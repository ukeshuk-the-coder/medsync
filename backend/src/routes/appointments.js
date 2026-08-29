const express = require('express');
const db = require('../db');
const { authRequired } = require('../auth');
const { tickNode, syncClocks, logEvent } = require('../lamport');

const router = express.Router();

function genCode() {
  const year = new Date().getFullYear();
  const rand = Math.floor(100000 + Math.random() * 900000);
  return `MED-${year}-${rand}`;
}

// GET /api/appointments/availability?doctorId=&date=
router.get('/availability', (req, res) => {
  const { doctorId, date } = req.query;
  if (!doctorId) return res.status(400).json({ error: 'doctorId is required.' });
  let sql = 'SELECT * FROM appointment_slots WHERE doctor_id = ?';
  const params = [doctorId];
  if (date) { sql += ' AND date = ?'; params.push(date); }
  sql += ' ORDER BY date, time';
  const slots = db.prepare(sql).all(...params);

  // Group by date
  const byDate = {};
  slots.forEach(s => {
    byDate[s.date] = byDate[s.date] || [];
    byDate[s.date].push({ id: s.id, time: s.time, status: s.status });
  });
  res.json(byDate);
});

// Book an appointment — validates + locks the slot atomically, ties into the
// hospital's distributed node via a Lamport clock event.
router.post('/', authRequired, (req, res) => {
  const { doctorId, slotId, patientName, patientAge, patientGender, patientEmail, patientMobile, reason, notes, consultationType } = req.body;
  if (!doctorId || !slotId) return res.status(400).json({ error: 'doctorId and slotId are required.' });

  const doctor = db.prepare('SELECT * FROM doctors WHERE id = ?').get(doctorId);
  if (!doctor) return res.status(404).json({ error: 'Doctor not found.' });
  const hospital = db.prepare('SELECT * FROM hospitals WHERE id = ?').get(doctor.hospital_id);
  if (!hospital.online_booking_enabled) {
    return res.status(409).json({ error: 'Online booking is unavailable for this hospital. Please request a callback instead.' });
  }

  const result = (() => {
    const txn = db.transaction(() => {
      const slot = db.prepare('SELECT * FROM appointment_slots WHERE id = ? AND doctor_id = ?').get(slotId, doctorId);
      if (!slot) throw { code: 404, message: 'Slot not found.' };
      if (slot.status === 'booked') throw { code: 409, message: 'SLOT_TAKEN' };

      // Lock the slot
      db.prepare(`UPDATE appointment_slots SET status = 'booked' WHERE id = ?`).run(slotId);

      // Distributed event: local node tick
      const clock = tickNode(hospital.node_id);
      logEvent({ nodeId: hospital.node_id, eventType: 'BOOKING_REQUEST', doctorId, patientLabel: patientName, lamportClock: clock, details: `${slot.date} ${slot.time}` });
      const confirmedClock = tickNode(hospital.node_id);
      logEvent({ nodeId: hospital.node_id, eventType: 'CONFIRMED', doctorId, patientLabel: patientName, lamportClock: confirmedClock, details: `${slot.date} ${slot.time}` });

      const code = genCode();
      const info = db.prepare(`INSERT INTO appointments
        (appointment_code, patient_id, doctor_id, hospital_id, slot_id, date, time, patient_name, patient_age, patient_gender, patient_email, patient_mobile, reason, notes, consultation_type, fee, status, lamport_clock, node_id)
        VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?, 'Confirmed', ?, ?)`).run(
        code, req.user.id, doctorId, doctor.hospital_id, slotId, slot.date, slot.time,
        patientName, patientAge || null, patientGender || null, patientEmail || null, patientMobile || null,
        reason || null, notes || null, consultationType || 'In-person', doctor.fee, confirmedClock, hospital.node_id
      );

      const appt = db.prepare('SELECT * FROM appointments WHERE id = ?').get(info.lastInsertRowid);
      return appt;
    });
    return txn();
  })();

  res.status(201).json({
    appointment: result,
    doctor: { name: doctor.name, specialty: doctor.specialty },
    hospital: { name: hospital.name, address: hospital.address, city: hospital.city, state: hospital.state },
  });
});

// Wrap the above with error translation + "next available slots" suggestion on conflict
router.use((err, req, res, next) => {
  if (err && err.code === 409 && err.message === 'SLOT_TAKEN') {
    const { doctorId } = req.body;
    const alt = db.prepare(`SELECT id, date, time FROM appointment_slots WHERE doctor_id = ? AND status = 'available' ORDER BY date, time LIMIT 5`).all(doctorId);
    const otherDoctors = db.prepare(`SELECT id, name, specialty FROM doctors WHERE specialty = (SELECT specialty FROM doctors WHERE id = ?) AND id != ? LIMIT 5`).all(doctorId, doctorId);
    return res.status(409).json({ error: 'This slot is no longer available.', nextAvailableSlots: alt, otherDoctors });
  }
  if (err && err.code) return res.status(err.code).json({ error: err.message });
  next(err);
});

// GET /api/appointments/mine — patient's own appointments
router.get('/mine', authRequired, (req, res) => {
  const rows = db.prepare(`SELECT a.*, d.name as doctor_name, d.specialty, h.name as hospital_name, h.city, h.state
                            FROM appointments a
                            JOIN doctors d ON a.doctor_id = d.id
                            JOIN hospitals h ON a.hospital_id = h.id
                            WHERE a.patient_id = ? ORDER BY a.date DESC, a.time DESC`).all(req.user.id);
  res.json(rows);
});

router.post('/:id/cancel', authRequired, (req, res) => {
  const appt = db.prepare('SELECT * FROM appointments WHERE id = ? AND patient_id = ?').get(req.params.id, req.user.id);
  if (!appt) return res.status(404).json({ error: 'Appointment not found.' });
  db.prepare(`UPDATE appointments SET status = 'Cancelled' WHERE id = ?`).run(appt.id);
  if (appt.slot_id) db.prepare(`UPDATE appointment_slots SET status = 'available' WHERE id = ?`).run(appt.slot_id);
  res.json({ message: 'Appointment cancelled.' });
});

// ---- DISTRIBUTED BOOKING CONFLICT SIMULATION ----
// Simulates two patients on two different hospital nodes racing for the
// same doctor+slot at (almost) the same time. Demonstrates Lamport clock
// based deterministic conflict resolution.
router.post('/simulate-conflict', (req, res) => {
  const doctor = db.prepare(`SELECT doc.*, h.node_id, h.name as hospital_name FROM doctors doc JOIN hospitals h ON doc.hospital_id = h.id ORDER BY RANDOM() LIMIT 1`).get();
  let slot = db.prepare(`SELECT * FROM appointment_slots WHERE doctor_id = ? AND status = 'available' LIMIT 1`).get(doctor.id);
  if (!slot) {
    // fabricate a contested slot for the demo if none free
    slot = db.prepare(`SELECT * FROM appointment_slots WHERE doctor_id = ? LIMIT 1`).get(doctor.id);
  }

  const nodeA = doctor.node_id;
  const nodeBRow = db.prepare(`SELECT id FROM hospital_nodes WHERE id != ? ORDER BY RANDOM() LIMIT 1`).get(nodeA);
  const nodeB = nodeBRow ? nodeBRow.id : nodeA;

  const log = [];

  // Both nodes issue a booking request near-simultaneously
  const clockA1 = tickNode(nodeA);
  log.push({ node: 'Node A', event: 'BOOKING_REQUEST', patient: 'Patient A', clock: clockA1, slot: `${slot.date} ${slot.time}` });
  logEvent({ nodeId: nodeA, eventType: 'BOOKING_REQUEST', doctorId: doctor.id, patientLabel: 'Patient A', lamportClock: clockA1, details: `${slot.date} ${slot.time}` });

  const clockB1 = tickNode(nodeB);
  log.push({ node: 'Node B', event: 'BOOKING_REQUEST', patient: 'Patient B', clock: clockB1, slot: `${slot.date} ${slot.time}` });
  logEvent({ nodeId: nodeB, eventType: 'BOOKING_REQUEST', doctorId: doctor.id, patientLabel: 'Patient B', lamportClock: clockB1, details: `${slot.date} ${slot.time}` });

  log.push({ node: 'Coordinator', event: 'CONFLICT_DETECTED', detail: `Both requests target doctor #${doctor.id}, slot ${slot.date} ${slot.time}` });

  // Deterministic resolution: lower (clock, nodeId) tuple wins; tie-break by node id
  const winnerIsA = (clockA1 < clockB1) || (clockA1 === clockB1 && nodeA < nodeB);
  const syncedClock = syncClocks([nodeA, nodeB]);

  const winner = winnerIsA ? 'A' : 'B';
  log.push({ node: 'Coordinator', event: 'RESOLUTION', detail: `Timestamp+NodeID ordering → Booking ${winner} wins (synced clock ${syncedClock})` });

  db.prepare(`UPDATE appointment_slots SET status = 'booked' WHERE id = ?`).run(slot.id);

  const altSlots = db.prepare(`SELECT id, date, time FROM appointment_slots WHERE doctor_id = ? AND status = 'available' AND id != ? ORDER BY date, time LIMIT 4`).all(doctor.id, slot.id);

  log.push({ node: winnerIsA ? 'Node A' : 'Node B', event: 'BOOKING_CONFIRMED', patient: `Patient ${winner}` });
  log.push({ node: winnerIsA ? 'Node B' : 'Node A', event: 'BOOKING_CONFLICT', patient: `Patient ${winnerIsA ? 'B' : 'A'}`, detail: 'Alternative slots suggested' });

  res.json({
    doctor: { id: doctor.id, name: doctor.name, specialty: doctor.specialty, hospital: doctor.hospital_name },
    contestedSlot: { date: slot.date, time: slot.time },
    winner: `Patient ${winner}`,
    loser: `Patient ${winnerIsA ? 'B' : 'A'}`,
    log,
    alternativeSlotsForLoser: altSlots,
  });
});

module.exports = router;

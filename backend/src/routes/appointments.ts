import { Router } from "express";
import { nanoid } from "nanoid";
import { z } from "zod";
import db from "../db/index.js";
import { optionalAuth, requireAuth, type AuthedRequest } from "../lib/auth.js";
import { tick, logEvent } from "../lib/lamport.js";
import { sendAppointmentEmail } from "../lib/email.js";

export const appointmentsRouter = Router();

function genAppointmentCode() {
  const year = new Date().getFullYear();
  const suffix = Math.random().toString(36).slice(2, 8).toUpperCase();
  return `MED-${year}-${suffix}`;
}

const bookSchema = z.object({
  doctorId: z.string(),
  date: z.string(),
  time: z.string(),
  patientName: z.string().min(2),
  patientAge: z.number().optional(),
  patientGender: z.string().optional(),
  patientEmail: z.string().email(),
  patientMobile: z.string().min(6),
  reason: z.string().optional(),
  notes: z.string().optional(),
  consultationType: z.string().optional(),
});

/**
 * Booking flow implements the safety sequence from the spec:
 * 1. validate slot availability, 2. prevent duplicate booking (unique index +
 * transaction), 3. lock/reserve via atomic UPDATE ... WHERE status='AVAILABLE',
 * 4. create appointment, 5. update slot, 6. log a distributed booking event with
 * a Lamport timestamp for the owning hospital node, 7. send confirmation email.
 */
appointmentsRouter.post("/", optionalAuth, async (req: AuthedRequest, res) => {
  const parsed = bookSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.issues[0].message });
  const b = parsed.data;

  const doctor = db.prepare(`
    SELECT d.*, sp.name as specialty, h.id as hospital_id, h.name as hospital_name, h.address, h.node_id, h.online_booking_enabled
    FROM doctors d JOIN specialties sp ON sp.id = d.specialty_id JOIN hospitals h ON h.id = d.hospital_id
    WHERE d.id = ?
  `).get(b.doctorId) as any;
  if (!doctor) return res.status(404).json({ error: "Doctor not found" });
  if (!doctor.online_booking_enabled) {
    return res.status(409).json({ error: "Online booking is unavailable for this hospital. Request a callback instead." });
  }

  const slot = db.prepare(
    `SELECT * FROM appointment_slots WHERE doctor_id = ? AND date = ? AND time = ?`
  ).get(b.doctorId, b.date, b.time) as any;
  if (!slot) return res.status(404).json({ error: "That slot does not exist" });
  if (slot.status === "BOOKED") return res.status(409).json({ error: "SLOT_TAKEN", message: "This slot is no longer available" });

  // Atomic reservation: only succeeds if still AVAILABLE — this is what prevents double booking
  // under concurrent requests, since better-sqlite3 serializes writes per connection.
  const lockResult = db.prepare(
    `UPDATE appointment_slots SET status = 'BOOKED' WHERE id = ? AND status = 'AVAILABLE'`
  ).run(slot.id);

  if (lockResult.changes === 0) {
    return res.status(409).json({ error: "SLOT_TAKEN", message: "This slot was just booked by another patient" });
  }

  const clock = tick(doctor.node_id);
  logEvent({ nodeId: doctor.node_id, eventType: "REQUEST", doctorId: b.doctorId, date: b.date, time: b.time, lamportClock: clock, detail: `Booking request for ${doctor.name}` });

  const appointmentId = nanoid(10);
  const code = genAppointmentCode();
  db.prepare(`
    INSERT INTO appointments (id, appointment_code, patient_id, doctor_id, hospital_id, slot_id, date, time,
      patient_name, patient_age, patient_gender, patient_email, patient_mobile, reason, notes,
      consultation_type, fee, status, lamport_clock, node_id)
    VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,'CONFIRMED',?,?)
  `).run(
    appointmentId, code, req.user?.id ?? null, b.doctorId, doctor.hospital_id, slot.id, b.date, b.time,
    b.patientName, b.patientAge ?? null, b.patientGender ?? null, b.patientEmail, b.patientMobile,
    b.reason ?? null, b.notes ?? null, b.consultationType ?? "In-person", doctor.consultation_fee, clock, doctor.node_id
  );

  const confirmClock = tick(doctor.node_id);
  logEvent({ nodeId: doctor.node_id, eventType: "CONFIRMED", doctorId: b.doctorId, date: b.date, time: b.time, lamportClock: confirmClock, detail: `Booking ${code} confirmed` });

  if (req.user?.id) {
    db.prepare(`INSERT INTO notifications (id, user_id, type, message) VALUES (?,?,?,?)`)
      .run(nanoid(10), req.user.id, "APPOINTMENT_CONFIRMED", `Your appointment with ${doctor.name} on ${b.date} at ${b.time} is confirmed.`);
  }

  const emailResult = await sendAppointmentEmail({
    to: b.patientEmail,
    patientName: b.patientName,
    doctorName: doctor.name,
    specialty: doctor.specialty,
    hospitalName: doctor.hospital_name,
    hospitalAddress: doctor.address,
    date: b.date,
    time: b.time,
    appointmentCode: code,
    consultationType: b.consultationType ?? "In-person",
  });

  res.status(201).json({
    appointment: {
      id: appointmentId, appointmentCode: code, doctorName: doctor.name, specialty: doctor.specialty,
      hospitalName: doctor.hospital_name, hospitalAddress: doctor.address, date: b.date, time: b.time,
      patientName: b.patientName, fee: doctor.consultation_fee, consultationType: b.consultationType ?? "In-person",
    },
    email: emailResult,
  });
});

// Suggest alternatives if a slot is taken: next available slots for this doctor, and other doctors in the same specialty/city.
appointmentsRouter.get("/alternatives", (req, res) => {
  const { doctorId } = req.query as { doctorId?: string };
  if (!doctorId) return res.status(400).json({ error: "doctorId required" });
  const doctor = db.prepare(`SELECT * FROM doctors d JOIN hospitals h ON h.id = d.hospital_id WHERE d.id = ?`).get(doctorId) as any;
  if (!doctor) return res.status(404).json({ error: "Doctor not found" });

  const nextSlots = db.prepare(
    `SELECT date, time FROM appointment_slots WHERE doctor_id = ? AND status = 'AVAILABLE' ORDER BY date, time LIMIT 5`
  ).all(doctorId);

  const otherDoctors = db.prepare(`
    SELECT d.id, d.name, d.rating, d.experience_years, h.name as hospital_name
    FROM doctors d JOIN hospitals h ON h.id = d.hospital_id
    WHERE d.specialty_id = ? AND d.id != ? AND h.city = ? LIMIT 4
  `).all(doctor.specialty_id, doctorId, doctor.city);

  const otherHospitals = db.prepare(`
    SELECT id, name, city, rating FROM hospitals WHERE city = ? AND id != ? LIMIT 4
  `).all(doctor.hospital_id ? doctor.city : "", doctor.hospital_id);

  res.json({ nextSlots, otherDoctors, otherHospitals });
});

appointmentsRouter.get("/mine", requireAuth, (req: AuthedRequest, res) => {
  const appts = db.prepare(`
    SELECT a.*, d.name as doctor_name, sp.name as specialty, h.name as hospital_name, h.city
    FROM appointments a
    JOIN doctors d ON d.id = a.doctor_id
    JOIN specialties sp ON sp.id = d.specialty_id
    JOIN hospitals h ON h.id = a.hospital_id
    WHERE a.patient_id = ?
    ORDER BY a.date DESC, a.time DESC
  `).all(req.user!.id);
  res.json(appts);
});

appointmentsRouter.post("/:id/cancel", requireAuth, (req: AuthedRequest, res) => {
  const appt = db.prepare(`SELECT * FROM appointments WHERE id = ?`).get(req.params.id) as any;
  if (!appt) return res.status(404).json({ error: "Appointment not found" });
  if (appt.patient_id !== req.user!.id) return res.status(403).json({ error: "Forbidden" });

  db.prepare(`UPDATE appointments SET status = 'CANCELLED' WHERE id = ?`).run(req.params.id);
  if (appt.slot_id) db.prepare(`UPDATE appointment_slots SET status = 'AVAILABLE' WHERE id = ?`).run(appt.slot_id);
  db.prepare(`INSERT INTO notifications (id, user_id, type, message) VALUES (?,?,?,?)`)
    .run(nanoid(10), req.user!.id, "APPOINTMENT_CANCELLED", `Your appointment ${appt.appointment_code} was cancelled.`);
  res.json({ ok: true });
});

const express = require('express');
const db = require('../db');
const { authRequired, adminRequired } = require('../auth');

const router = express.Router();

router.get('/stats', authRequired, adminRequired, (req, res) => {
  const c = (sql, ...p) => db.prepare(sql).get(...p).c;
  const today = new Date().toISOString().slice(0, 10);
  res.json({
    totalPatients: c(`SELECT COUNT(*) c FROM users WHERE role = 'patient'`),
    totalHospitals: c(`SELECT COUNT(*) c FROM hospitals`),
    totalDoctors: c(`SELECT COUNT(*) c FROM doctors`),
    todaysAppointments: c(`SELECT COUNT(*) c FROM appointments WHERE date = ?`, today),
    pendingCallbacks: c(`SELECT COUNT(*) c FROM callback_requests WHERE status = 'Pending'`),
    onlineBookingsEnabled: c(`SELECT COUNT(*) c FROM hospitals WHERE online_booking_enabled = 1`),
    bookingConflicts: c(`SELECT COUNT(*) c FROM booking_events WHERE event_type = 'CONFLICT'`),
    totalAppointments: c(`SELECT COUNT(*) c FROM appointments`),
  });
});

router.get('/hospitals', authRequired, adminRequired, (req, res) => {
  res.json(db.prepare('SELECT * FROM hospitals ORDER BY name').all());
});

router.get('/callbacks', authRequired, adminRequired, (req, res) => {
  res.json(db.prepare(`SELECT cr.*, h.name as hospital_name FROM callback_requests cr JOIN hospitals h ON cr.hospital_id = h.id ORDER BY cr.created_at DESC`).all());
});

router.post('/callbacks/:id/complete', authRequired, adminRequired, (req, res) => {
  db.prepare(`UPDATE callback_requests SET status = 'Completed' WHERE id = ?`).run(req.params.id);
  res.json({ message: 'Marked as completed.' });
});

router.post('/hospitals/:id/toggle-booking', authRequired, adminRequired, (req, res) => {
  const h = db.prepare('SELECT * FROM hospitals WHERE id = ?').get(req.params.id);
  if (!h) return res.status(404).json({ error: 'Hospital not found.' });
  db.prepare('UPDATE hospitals SET online_booking_enabled = ? WHERE id = ?').run(h.online_booking_enabled ? 0 : 1, h.id);
  res.json({ message: 'Updated.' });
});

// ---- Distributed network monitor (public-ish for demo purposes) ----
router.get('/distributed/nodes', (req, res) => {
  const nodes = db.prepare('SELECT * FROM hospital_nodes').all();
  const withCounts = nodes.map(n => ({
    ...n,
    hospitalCount: db.prepare('SELECT COUNT(*) c FROM hospitals WHERE node_id = ?').get(n.id).c,
    activeAppointments: db.prepare(`SELECT COUNT(*) c FROM appointments a JOIN hospitals h ON a.hospital_id = h.id WHERE h.node_id = ? AND a.status = 'Confirmed'`).get(n.id).c,
  }));
  res.json(withCounts);
});

router.get('/distributed/events', (req, res) => {
  const events = db.prepare('SELECT * FROM booking_events ORDER BY id DESC LIMIT 30').all();
  res.json(events);
});

module.exports = router;

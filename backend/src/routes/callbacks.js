const express = require('express');
const db = require('../db');
const { optionalAuth } = require('../auth');
const { logEvent } = require('../lamport');

const router = express.Router();

router.post('/', optionalAuth, (req, res) => {
  const { hospitalId, doctorId, name, mobile, preferredTime, reason } = req.body;
  if (!hospitalId || !name || !mobile) {
    return res.status(400).json({ error: 'hospitalId, name and mobile are required.' });
  }
  const hospital = db.prepare('SELECT * FROM hospitals WHERE id = ?').get(hospitalId);
  if (!hospital) return res.status(404).json({ error: 'Hospital not found.' });

  const info = db.prepare(`INSERT INTO callback_requests (patient_id, hospital_id, doctor_id, name, mobile, preferred_time, reason)
              VALUES (?,?,?,?,?,?,?)`)
    .run(req.user ? req.user.id : null, hospitalId, doctorId || null, name, mobile, preferredTime || null, reason || null);

  logEvent({ nodeId: hospital.node_id, eventType: 'CALLBACK', doctorId: doctorId || null, patientLabel: name, lamportClock: 0, details: `Callback requested for ${hospital.name}` });

  const request = db.prepare('SELECT * FROM callback_requests WHERE id = ?').get(info.lastInsertRowid);
  res.status(201).json(request);
});

router.get('/mine', optionalAuth, (req, res) => {
  if (!req.user) return res.json([]);
  const rows = db.prepare(`SELECT cr.*, h.name as hospital_name, d.name as doctor_name
                            FROM callback_requests cr
                            JOIN hospitals h ON cr.hospital_id = h.id
                            LEFT JOIN doctors d ON cr.doctor_id = d.id
                            WHERE cr.patient_id = ? ORDER BY cr.created_at DESC`).all(req.user.id);
  res.json(rows);
});

module.exports = router;

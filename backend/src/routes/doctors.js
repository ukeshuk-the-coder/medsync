const express = require('express');
const db = require('../db');

const router = express.Router();

function parseDoctor(d) {
  return {
    ...d,
    languages: safeJSON(d.languages, []),
    expertise: safeJSON(d.expertise, []),
    working_hours: safeJSON(d.working_hours, {}),
  };
}
function safeJSON(str, fallback) {
  try { return JSON.parse(str); } catch (e) { return fallback; }
}

// GET /api/doctors?state=&city=&specialty=&hospitalId=&minExperience=&gender=&sort=&q=
router.get('/', (req, res) => {
  const { state, city, specialty, hospitalId, minExperience, gender, sort, q } = req.query;

  let sql = `SELECT doc.*, h.name as hospital_name, h.state, h.city, h.online_booking_enabled
             FROM doctors doc JOIN hospitals h ON doc.hospital_id = h.id WHERE 1=1`;
  const params = [];

  if (state) { sql += ' AND h.state = ?'; params.push(state); }
  if (city) { sql += ' AND h.city = ?'; params.push(city); }
  if (specialty) { sql += ' AND doc.specialty = ?'; params.push(specialty); }
  if (hospitalId) { sql += ' AND doc.hospital_id = ?'; params.push(hospitalId); }
  if (gender) { sql += ' AND doc.gender = ?'; params.push(gender); }
  if (minExperience) { sql += ' AND doc.experience_years >= ?'; params.push(Number(minExperience)); }
  if (q) { sql += ' AND (doc.name LIKE ? OR doc.specialty LIKE ? OR h.name LIKE ?)'; params.push(`%${q}%`, `%${q}%`, `%${q}%`); }

  if (sort === 'experience') sql += ' ORDER BY doc.experience_years DESC';
  else if (sort === 'rating') sql += ' ORDER BY doc.rating DESC';
  else if (sort === 'fee') sql += ' ORDER BY doc.fee ASC';
  else sql += ' ORDER BY doc.rating DESC';

  const rows = db.prepare(sql).all(...params);
  res.json(rows.map(parseDoctor));
});

router.get('/:id', (req, res) => {
  const doc = db.prepare(`SELECT doc.*, h.name as hospital_name, h.state, h.city, h.address, h.online_booking_enabled
                           FROM doctors doc JOIN hospitals h ON doc.hospital_id = h.id WHERE doc.id = ?`).get(req.params.id);
  if (!doc) return res.status(404).json({ error: 'Doctor not found.' });
  const reviews = db.prepare('SELECT * FROM reviews WHERE doctor_id = ? ORDER BY created_at DESC LIMIT 10').all(req.params.id);
  res.json({ ...parseDoctor(doc), reviews });
});

module.exports = router;

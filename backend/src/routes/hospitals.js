const express = require('express');
const db = require('../db');

const router = express.Router();

function parseHospital(h) {
  return {
    ...h,
    working_hours: safeJSON(h.working_hours, {}),
    departments: safeJSON(h.departments, []),
    facilities: safeJSON(h.facilities, []),
  };
}
function safeJSON(str, fallback) { try { return JSON.parse(str); } catch (e) { return fallback; } }

router.get('/', (req, res) => {
  const { state, city, q, sort } = req.query;
  let sql = 'SELECT * FROM hospitals WHERE 1=1';
  const params = [];
  if (state) { sql += ' AND state = ?'; params.push(state); }
  if (city) { sql += ' AND city = ?'; params.push(city); }
  if (q) { sql += ' AND name LIKE ?'; params.push(`%${q}%`); }
  sql += sort === 'rating' ? ' ORDER BY rating DESC' : ' ORDER BY name ASC';
  const rows = db.prepare(sql).all(...params);
  res.json(rows.map(parseHospital));
});

router.get('/:id', (req, res) => {
  const h = db.prepare('SELECT * FROM hospitals WHERE id = ?').get(req.params.id);
  if (!h) return res.status(404).json({ error: 'Hospital not found.' });
  const doctors = db.prepare('SELECT id, name, specialty, experience_years, rating, image FROM doctors WHERE hospital_id = ?').all(req.params.id);
  const reviews = db.prepare('SELECT * FROM reviews WHERE hospital_id = ? ORDER BY created_at DESC LIMIT 10').all(req.params.id);
  res.json({ ...parseHospital(h), doctors, reviews });
});

module.exports = router;

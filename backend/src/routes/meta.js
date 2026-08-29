const express = require('express');
const db = require('../db');
const { ALL_INDIA_STATES, SPECIALTIES } = require('../db/seed');

const router = express.Router();

router.get('/states', (req, res) => {
  res.json(ALL_INDIA_STATES);
});

router.get('/specialties', (req, res) => {
  res.json(SPECIALTIES);
});

router.get('/cities', (req, res) => {
  const { state } = req.query;
  if (!state) return res.json([]);
  const rows = db.prepare('SELECT DISTINCT city FROM hospitals WHERE state = ? ORDER BY city').all(state);
  res.json(rows.map(r => r.city));
});

module.exports = router;

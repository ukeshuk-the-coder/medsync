const express = require('express');
const bcrypt = require('bcryptjs');
const db = require('../db');
const { signToken } = require('../auth');

const router = express.Router();

router.post('/register', (req, res) => {
  const { name, email, password, mobile, state, city } = req.body;
  if (!name || !email || !password) {
    return res.status(400).json({ error: 'Name, email and password are required.' });
  }
  const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email.toLowerCase());
  if (existing) return res.status(409).json({ error: 'An account with this email already exists.' });

  const hash = bcrypt.hashSync(password, 8);
  const info = db.prepare(`INSERT INTO users (name, email, password_hash, mobile, role, state, city)
                            VALUES (?, ?, ?, ?, 'patient', ?, ?)`)
    .run(name, email.toLowerCase(), hash, mobile || null, state || null, city || null);
  const user = db.prepare('SELECT id, name, email, role, mobile, state, city FROM users WHERE id = ?').get(info.lastInsertRowid);
  const token = signToken(user);
  res.status(201).json({ token, user });
});

router.post('/login', (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'Email and password are required.' });
  const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email.toLowerCase());
  if (!user || !bcrypt.compareSync(password, user.password_hash)) {
    return res.status(401).json({ error: 'Invalid email or password.' });
  }
  const token = signToken(user);
  delete user.password_hash;
  res.json({ token, user });
});

// Simplified demo "forgot password" flow: issues a reset token (would be emailed in production)
router.post('/forgot-password', (req, res) => {
  const { email } = req.body;
  const user = db.prepare('SELECT id FROM users WHERE email = ?').get((email || '').toLowerCase());
  // Always respond success (don't leak which emails exist)
  if (user) {
    const resetToken = signToken({ id: user.id, role: 'reset', name: '', email });
    console.log(`[DEMO] Password reset link for ${email}: /reset-password?token=${resetToken}`);
  }
  res.json({ message: 'If that email exists in our system, a password reset link has been sent.' });
});

router.post('/reset-password', (req, res) => {
  const { token, newPassword } = req.body;
  const jwt = require('jsonwebtoken');
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'medsync-dev-secret-change-in-production');
    const hash = bcrypt.hashSync(newPassword, 8);
    db.prepare('UPDATE users SET password_hash = ? WHERE id = ?').run(hash, decoded.id);
    res.json({ message: 'Password updated successfully.' });
  } catch (e) {
    res.status(400).json({ error: 'Invalid or expired reset link.' });
  }
});

module.exports = router;

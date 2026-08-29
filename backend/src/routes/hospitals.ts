import { Router } from "express";
import db from "../db/index.js";

export const hospitalsRouter = Router();

hospitalsRouter.get("/", (req, res) => {
  const { state, city, q } = req.query as Record<string, string | undefined>;
  let sql = `SELECT h.*, hn.label as node_label, hn.status as node_status FROM hospitals h JOIN hospital_nodes hn ON hn.id = h.node_id WHERE 1=1`;
  const params: any[] = [];
  if (state) { sql += ` AND h.state = ?`; params.push(state); }
  if (city) { sql += ` AND h.city = ?`; params.push(city); }
  if (q) { sql += ` AND h.name LIKE ?`; params.push(`%${q}%`); }
  sql += ` ORDER BY h.rating DESC`;
  res.json(db.prepare(sql).all(...params));
});

hospitalsRouter.get("/:id", (req, res) => {
  const hospital = db.prepare(`
    SELECT h.*, hn.label as node_label, hn.status as node_status, hn.lamport_clock
    FROM hospitals h JOIN hospital_nodes hn ON hn.id = h.node_id WHERE h.id = ?
  `).get(req.params.id) as any;
  if (!hospital) return res.status(404).json({ error: "Hospital not found" });

  const doctors = db.prepare(`
    SELECT d.id, d.name, d.experience_years, d.rating, d.consultation_fee, sp.name as specialty
    FROM doctors d JOIN specialties sp ON sp.id = d.specialty_id
    WHERE d.hospital_id = ? ORDER BY sp.name
  `).all(req.params.id);

  const reviews = db.prepare(
    `SELECT patient_name, rating, comment, created_at FROM reviews WHERE hospital_id = ? ORDER BY created_at DESC LIMIT 20`
  ).all(req.params.id);

  res.json({ ...hospital, doctors, reviews });
});

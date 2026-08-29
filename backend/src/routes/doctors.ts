import { Router } from "express";
import db from "../db/index.js";

export const doctorsRouter = Router();

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

doctorsRouter.get("/", (req, res) => {
  const {
    state, city, specialty, hospital, minExperience, minRating, maxFee,
    onlineConsult, availableToday, gender, sort, q,
  } = req.query as Record<string, string | undefined>;

  let sql = `
    SELECT d.id, d.name, d.qualification, d.experience_years, d.gender, d.rating, d.consultation_fee,
           d.about, d.expertise, d.online_consult, d.image,
           sp.name as specialty, sp.id as specialty_id,
           h.id as hospital_id, h.name as hospital_name, h.city, h.state, h.online_booking_enabled, h.rating as hospital_rating
    FROM doctors d
    JOIN specialties sp ON sp.id = d.specialty_id
    JOIN hospitals h ON h.id = d.hospital_id
    WHERE 1=1
  `;
  const params: any[] = [];

  if (state) { sql += ` AND h.state = ?`; params.push(state); }
  if (city) { sql += ` AND h.city = ?`; params.push(city); }
  if (specialty) { sql += ` AND sp.name = ?`; params.push(specialty); }
  if (hospital) { sql += ` AND h.id = ?`; params.push(hospital); }
  if (minExperience) { sql += ` AND d.experience_years >= ?`; params.push(Number(minExperience)); }
  if (minRating) { sql += ` AND d.rating >= ?`; params.push(Number(minRating)); }
  if (maxFee) { sql += ` AND d.consultation_fee <= ?`; params.push(Number(maxFee)); }
  if (onlineConsult === "true") { sql += ` AND d.online_consult = 1`; }
  if (gender) { sql += ` AND d.gender = ?`; params.push(gender); }
  if (q) { sql += ` AND (d.name LIKE ? OR h.name LIKE ? OR sp.name LIKE ?)`; params.push(`%${q}%`, `%${q}%`, `%${q}%`); }

  if (sort === "experience") sql += ` ORDER BY d.experience_years DESC`;
  else if (sort === "fee") sql += ` ORDER BY d.consultation_fee ASC`;
  else if (sort === "rating") sql += ` ORDER BY d.rating DESC`;
  else sql += ` ORDER BY d.rating DESC`;

  let doctors = db.prepare(sql).all(...params) as any[];

  if (availableToday === "true") {
    const today = todayStr();
    const hasSlot = db.prepare(
      `SELECT 1 FROM appointment_slots WHERE doctor_id = ? AND date = ? AND status = 'AVAILABLE' LIMIT 1`
    );
    doctors = doctors.filter((d) => hasSlot.get(d.id, today));
  }

  // Attach today's available slots preview (max 4) for each doctor
  const slotStmt = db.prepare(
    `SELECT time FROM appointment_slots WHERE doctor_id = ? AND date = ? AND status = 'AVAILABLE' ORDER BY time LIMIT 4`
  );
  const today = todayStr();
  doctors = doctors.map((d) => ({
    ...d,
    expertise: safeParse(d.expertise),
    todaySlots: (slotStmt.all(d.id, today) as any[]).map((s) => s.time),
  }));

  res.json(doctors);
});

doctorsRouter.get("/:id", (req, res) => {
  const doctor = db.prepare(`
    SELECT d.*, sp.name as specialty, h.name as hospital_name, h.city, h.state, h.id as hospital_id,
           h.online_booking_enabled, h.address, h.phone
    FROM doctors d
    JOIN specialties sp ON sp.id = d.specialty_id
    JOIN hospitals h ON h.id = d.hospital_id
    WHERE d.id = ?
  `).get(req.params.id) as any;
  if (!doctor) return res.status(404).json({ error: "Doctor not found" });

  doctor.expertise = safeParse(doctor.expertise);
  doctor.languages = safeParse(doctor.languages);

  const schedule = db.prepare(
    `SELECT day_of_week, start_time, end_time, is_available FROM doctor_schedules WHERE doctor_id = ? ORDER BY day_of_week`
  ).all(req.params.id);

  const reviews = db.prepare(
    `SELECT patient_name, rating, comment, created_at FROM reviews WHERE doctor_id = ? ORDER BY created_at DESC`
  ).all(req.params.id);

  res.json({ ...doctor, schedule, reviews });
});

doctorsRouter.get("/:id/availability", (req, res) => {
  const { from } = req.query as { from?: string };
  const startDate = from ? new Date(from) : new Date();
  const days = [];
  for (let i = 0; i < 7; i++) {
    const dt = new Date(startDate);
    dt.setDate(startDate.getDate() + i);
    const dateStr = dt.toISOString().slice(0, 10);
    const slots = db.prepare(
      `SELECT id, time, status FROM appointment_slots WHERE doctor_id = ? AND date = ? ORDER BY time`
    ).all(req.params.id, dateStr);
    days.push({
      date: dateStr,
      weekday: dt.toLocaleDateString("en-IN", { weekday: "long" }),
      slots,
    });
  }
  res.json(days);
});

function safeParse(v: any) {
  if (!v) return [];
  try { return JSON.parse(v); } catch { return []; }
}

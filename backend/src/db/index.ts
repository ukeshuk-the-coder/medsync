import Database from "better-sqlite3";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DB_PATH = path.join(__dirname, "..", "..", "medsync.db");

export const db = new Database(DB_PATH);
db.pragma("journal_mode = WAL");
db.pragma("foreign_keys = ON");

db.exec(`
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL CHECK(role IN ('patient','hospital','admin')) DEFAULT 'patient',
  mobile TEXT,
  age INTEGER,
  gender TEXT,
  state TEXT,
  city TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS states (
  id TEXT PRIMARY KEY,
  name TEXT UNIQUE NOT NULL
);

CREATE TABLE IF NOT EXISTS cities (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  state_id TEXT NOT NULL REFERENCES states(id)
);

CREATE TABLE IF NOT EXISTS specialties (
  id TEXT PRIMARY KEY,
  name TEXT UNIQUE NOT NULL,
  icon TEXT
);

CREATE TABLE IF NOT EXISTS hospital_nodes (
  id TEXT PRIMARY KEY,
  label TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'ONLINE',
  lamport_clock INTEGER NOT NULL DEFAULT 0,
  last_sync TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS hospitals (
  id TEXT PRIMARY KEY,
  node_id TEXT NOT NULL REFERENCES hospital_nodes(id),
  name TEXT NOT NULL,
  state TEXT NOT NULL,
  city TEXT NOT NULL,
  address TEXT,
  pincode TEXT,
  phone TEXT,
  emergency_phone TEXT,
  working_hours TEXT,
  departments TEXT,
  facilities TEXT,
  latitude REAL,
  longitude REAL,
  rating REAL DEFAULT 4.5,
  online_booking_enabled INTEGER NOT NULL DEFAULT 1,
  image TEXT
);

CREATE TABLE IF NOT EXISTS doctors (
  id TEXT PRIMARY KEY,
  hospital_id TEXT NOT NULL REFERENCES hospitals(id),
  name TEXT NOT NULL,
  specialty_id TEXT NOT NULL REFERENCES specialties(id),
  qualification TEXT,
  experience_years INTEGER,
  gender TEXT,
  rating REAL DEFAULT 4.5,
  consultation_fee INTEGER,
  about TEXT,
  expertise TEXT,
  languages TEXT,
  image TEXT,
  online_consult INTEGER DEFAULT 1
);

CREATE TABLE IF NOT EXISTS doctor_schedules (
  id TEXT PRIMARY KEY,
  doctor_id TEXT NOT NULL REFERENCES doctors(id),
  day_of_week INTEGER NOT NULL, -- 0=Sun .. 6=Sat
  start_time TEXT,
  end_time TEXT,
  is_available INTEGER NOT NULL DEFAULT 1
);

CREATE TABLE IF NOT EXISTS appointment_slots (
  id TEXT PRIMARY KEY,
  doctor_id TEXT NOT NULL REFERENCES doctors(id),
  date TEXT NOT NULL, -- YYYY-MM-DD
  time TEXT NOT NULL, -- HH:MM
  status TEXT NOT NULL DEFAULT 'AVAILABLE' CHECK(status IN ('AVAILABLE','BOOKED','UNAVAILABLE')),
  UNIQUE(doctor_id, date, time)
);

CREATE TABLE IF NOT EXISTS appointments (
  id TEXT PRIMARY KEY,
  appointment_code TEXT UNIQUE NOT NULL,
  patient_id TEXT REFERENCES users(id),
  doctor_id TEXT NOT NULL REFERENCES doctors(id),
  hospital_id TEXT NOT NULL REFERENCES hospitals(id),
  slot_id TEXT REFERENCES appointment_slots(id),
  date TEXT NOT NULL,
  time TEXT NOT NULL,
  patient_name TEXT NOT NULL,
  patient_age INTEGER,
  patient_gender TEXT,
  patient_email TEXT,
  patient_mobile TEXT,
  reason TEXT,
  notes TEXT,
  consultation_type TEXT DEFAULT 'In-person',
  fee INTEGER,
  status TEXT NOT NULL DEFAULT 'CONFIRMED' CHECK(status IN ('CONFIRMED','PENDING','COMPLETED','CANCELLED')),
  lamport_clock INTEGER,
  node_id TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS callback_requests (
  id TEXT PRIMARY KEY,
  hospital_id TEXT NOT NULL REFERENCES hospitals(id),
  doctor_id TEXT REFERENCES doctors(id),
  patient_id TEXT REFERENCES users(id),
  name TEXT NOT NULL,
  mobile TEXT NOT NULL,
  preferred_time TEXT,
  reason TEXT,
  status TEXT NOT NULL DEFAULT 'PENDING' CHECK(status IN ('PENDING','COMPLETED')),
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS reviews (
  id TEXT PRIMARY KEY,
  doctor_id TEXT REFERENCES doctors(id),
  hospital_id TEXT REFERENCES hospitals(id),
  patient_name TEXT,
  rating INTEGER,
  comment TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS notifications (
  id TEXT PRIMARY KEY,
  user_id TEXT REFERENCES users(id),
  type TEXT NOT NULL,
  message TEXT NOT NULL,
  is_read INTEGER NOT NULL DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS booking_events (
  id TEXT PRIMARY KEY,
  node_id TEXT NOT NULL,
  event_type TEXT NOT NULL, -- REQUEST | CONFIRMED | CONFLICT | SYNC
  doctor_id TEXT,
  date TEXT,
  time TEXT,
  lamport_clock INTEGER NOT NULL,
  detail TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);
`);

export default db;

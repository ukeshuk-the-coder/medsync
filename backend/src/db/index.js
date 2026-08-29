const Database = require('better-sqlite3');
const path = require('path');

const DB_PATH = process.env.DB_PATH || path.join(__dirname, '../../medsync.db');
const db = new Database(DB_PATH);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

db.exec(`
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  mobile TEXT,
  role TEXT NOT NULL DEFAULT 'patient', -- patient | hospital | admin
  age INTEGER,
  gender TEXT,
  state TEXT,
  city TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS hospital_nodes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  node_name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'ONLINE', -- ONLINE | OFFLINE
  lamport_clock INTEGER NOT NULL DEFAULT 0,
  last_sync TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS hospitals (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  node_id INTEGER NOT NULL,
  name TEXT NOT NULL,
  state TEXT NOT NULL,
  city TEXT NOT NULL,
  address TEXT,
  pincode TEXT,
  phone TEXT,
  emergency_phone TEXT,
  working_hours TEXT, -- JSON
  departments TEXT,   -- JSON array
  facilities TEXT,    -- JSON array
  online_booking_enabled INTEGER NOT NULL DEFAULT 1,
  rating REAL DEFAULT 4.5,
  image TEXT,
  lat REAL,
  lng REAL,
  FOREIGN KEY (node_id) REFERENCES hospital_nodes(id)
);

CREATE TABLE IF NOT EXISTS doctors (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  hospital_id INTEGER NOT NULL,
  name TEXT NOT NULL,
  specialty TEXT NOT NULL,
  qualification TEXT,
  experience_years INTEGER,
  gender TEXT,
  fee INTEGER,
  rating REAL DEFAULT 4.5,
  languages TEXT, -- JSON array
  about TEXT,
  expertise TEXT, -- JSON array
  image TEXT,
  online_consultation INTEGER DEFAULT 1,
  working_hours TEXT, -- JSON: {mon: "9:00 AM-1:00 PM", tue: "Unavailable", ...}
  FOREIGN KEY (hospital_id) REFERENCES hospitals(id)
);

CREATE TABLE IF NOT EXISTS appointment_slots (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  doctor_id INTEGER NOT NULL,
  date TEXT NOT NULL,   -- YYYY-MM-DD
  time TEXT NOT NULL,   -- e.g. "10:30 AM"
  status TEXT NOT NULL DEFAULT 'available', -- available | booked | unavailable
  FOREIGN KEY (doctor_id) REFERENCES doctors(id),
  UNIQUE(doctor_id, date, time)
);

CREATE TABLE IF NOT EXISTS appointments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  appointment_code TEXT UNIQUE NOT NULL,
  patient_id INTEGER NOT NULL,
  doctor_id INTEGER NOT NULL,
  hospital_id INTEGER NOT NULL,
  slot_id INTEGER,
  date TEXT NOT NULL,
  time TEXT NOT NULL,
  patient_name TEXT,
  patient_age INTEGER,
  patient_gender TEXT,
  patient_email TEXT,
  patient_mobile TEXT,
  reason TEXT,
  notes TEXT,
  consultation_type TEXT DEFAULT 'In-person',
  fee INTEGER,
  status TEXT NOT NULL DEFAULT 'Confirmed', -- Confirmed | Pending | Completed | Cancelled
  lamport_clock INTEGER,
  node_id INTEGER,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (patient_id) REFERENCES users(id),
  FOREIGN KEY (doctor_id) REFERENCES doctors(id),
  FOREIGN KEY (hospital_id) REFERENCES hospitals(id)
);

CREATE TABLE IF NOT EXISTS callback_requests (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  patient_id INTEGER,
  hospital_id INTEGER NOT NULL,
  doctor_id INTEGER,
  name TEXT NOT NULL,
  mobile TEXT NOT NULL,
  preferred_time TEXT,
  reason TEXT,
  status TEXT NOT NULL DEFAULT 'Pending', -- Pending | Completed
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS reviews (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  doctor_id INTEGER,
  hospital_id INTEGER,
  patient_name TEXT,
  rating REAL,
  comment TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS booking_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  node_id INTEGER,
  event_type TEXT,   -- BOOKING_REQUEST | CONFIRMED | CONFLICT | CALLBACK
  doctor_id INTEGER,
  patient_label TEXT,
  lamport_clock INTEGER,
  details TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);
`);

module.exports = db;

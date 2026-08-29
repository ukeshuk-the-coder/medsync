# MedSync
### Distributed Healthcare Appointment & Hospital Coordination System

**Made by Ukesh Kumar R — RMK College of Engineering and Technology**

> "Find the Right Doctor. Book the Right Time. Anywhere in India."

Medsync is a full-stack healthcare appointment platform that lets patients discover doctors and
hospitals across India, check real-time availability, book appointments online, or request a
hospital callback when online booking isn't available. It also demonstrates **distributed
computing concepts**: every hospital is modeled as an independent node, and a coordination
service uses **Lamport logical clocks** to resolve concurrent booking conflicts deterministically.

---

## Tech Stack

| Layer      | Technology |
|------------|------------|
| Frontend   | React 19 + TypeScript + Vite |
| Backend    | Node.js + Express |
| Database   | SQLite (via better-sqlite3) — zero setup, file-based |
| Auth       | JWT + bcrypt |
| Maps       | Google Maps embed (no API key needed for the embed/directions used here) |

> The brief called for PostgreSQL — this build uses SQLite instead so the whole project runs with
> zero external services (no DB server to install, nothing to configure) which matters a lot for a
> live college demo. The schema and query layer are simple enough to port to PostgreSQL directly
> if you need that for submission — see "Porting to PostgreSQL" below.

---

## Quick Start

You need **Node.js 18+** installed. Two terminals — one for the backend, one for the frontend.

### 1. Backend (API + database)

```bash
cd backend
npm install
node src/server.js
```

This will:
- Create `medsync.db` (SQLite file) automatically
- Seed it with demo data: 13 hospitals across 8 states, ~50 doctors, ~1500 appointment slots
- Start the API at **http://localhost:4000**

### 2. Frontend

In a second terminal:

```bash
cd frontend
npm install
npm run dev
```

Open **http://localhost:5173** — the Vite dev server proxies `/api/*` calls to the backend automatically.

### Demo logins

| Role    | Email                | Password  |
|---------|-----------------------|-----------|
| Patient | patient@medsync.in    | demo1234  |
| Admin   | admin@medsync.in      | admin123  |

Or just click **Register** and create your own patient account.

---

## Demo Script (for your presentation)

1. **Home page** → search by state/city/specialty → **Find Doctors**.
2. Open a doctor profile → see experience, working hours, reviews → **Book Appointment**.
3. Walk the booking flow: date → time slot → patient details → confirm → get an **Appointment ID**.
4. Go to **Dashboard → Appointments** to see it saved, and try **Cancel**.
5. Filter doctors down to a hospital with "Callback only" (online booking disabled) and show the
   **Request Hospital Callback** flow instead.
6. Open a **Hospital profile** → show the embedded map and **Get Directions**.
7. Go to **Network** (top nav) — the **Distributed Network Dashboard**:
   - Shows each hospital node, its status, and its live Lamport clock.
   - Click **⚡ Simulate Concurrent Booking** — this fires two near-simultaneous booking requests
     from two different hospital nodes for the same doctor + slot, and you'll watch the event log
     stream in: both requests logged with their Lamport timestamps, conflict detected, and a
     deterministic winner resolved by **(timestamp, node ID)** ordering. The losing patient is
     immediately offered alternative slots.
8. Log in as **admin** → **Admin Dashboard** — system stats, toggle a hospital's online booking on/off,
   manage callback requests.

---

## Project Structure

```
medsync/
├── backend/
│   └── src/
│       ├── server.js         # Express app entrypoint
│       ├── auth.js           # JWT signing + middleware
│       ├── lamport.js        # Lamport clock logic for distributed nodes
│       ├── db/
│       │   ├── index.js      # SQLite schema (tables for users, hospitals, doctors, etc.)
│       │   └── seed.js       # Demo data generator (India states/cities, specialties, doctors)
│       └── routes/
│           ├── auth.js       # register / login / forgot-password
│           ├── meta.js       # states / cities / specialties
│           ├── doctors.js    # search + profile
│           ├── hospitals.js  # search + profile
│           ├── appointments.js # availability, booking, cancel, conflict simulation
│           ├── callbacks.js  # callback request flow
│           └── admin.js      # stats, hospital management, distributed node monitor
└── frontend/
    └── src/
        ├── App.tsx            # Routing
        ├── AuthContext.tsx    # Auth state (JWT in localStorage)
        ├── Toast.tsx          # Toast notifications
        ├── api.ts             # Axios client
        ├── components/        # Navbar, Footer, DoctorCard, HospitalCard
        └── pages/              # Home, FindDoctors, DoctorProfile, HospitalProfile, Booking,
                                 # Login, Register, Dashboard*, AdminDashboard, DistributedNetwork, ...
```

## API Overview

```
POST   /api/auth/register
POST   /api/auth/login
POST   /api/auth/forgot-password

GET    /api/meta/states | /cities?state= | /specialties

GET    /api/doctors?state=&city=&specialty=&sort=&q=
GET    /api/doctors/:id
GET    /api/hospitals?state=&city=&q=
GET    /api/hospitals/:id

GET    /api/appointments/availability?doctorId=&date=
POST   /api/appointments                    (auth required — books a slot)
GET    /api/appointments/mine               (auth required)
POST   /api/appointments/:id/cancel         (auth required)
POST   /api/appointments/simulate-conflict  (the distributed-booking demo)

POST   /api/callbacks
GET    /api/callbacks/mine

GET    /api/admin/stats                     (admin only)
GET    /api/admin/hospitals                 (admin only)
POST   /api/admin/hospitals/:id/toggle-booking (admin only)
GET    /api/admin/callbacks                 (admin only)
GET    /api/admin/distributed/nodes         (node status + Lamport clocks)
GET    /api/admin/distributed/events        (recent booking event log)
```

## Notes on scope

A few things were simplified for a runnable single-evening build, flagged here so you can decide
what to extend before submission:
- **Email confirmation** is simulated: the booking confirmation screen shows exactly what the
  email would contain (and a real integration point is documented in the code) rather than sending
  real email, so the demo doesn't depend on SMTP credentials being configured on stage.
- **Maps** use a keyless Google Maps embed for the location + directions button — good enough for
  a demo; swap in a Maps API key for production-grade geocoding.
- **Profile editing** (Dashboard → Profile) is UI-complete but not yet wired to a save endpoint —
  add a `PUT /api/users/me` route if you want that to persist.

### Porting to PostgreSQL
The SQL in `backend/src/db/index.js` is close to standard SQL. To port: swap `better-sqlite3` for
`pg`, replace `AUTOINCREMENT` with `SERIAL`/`GENERATED ALWAYS AS IDENTITY`, and swap the
synchronous `db.prepare(...).get/all/run()` calls in the routes for `await pool.query(...)`.

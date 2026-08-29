const bcrypt = require('bcryptjs');
const db = require('./index');

const SPECIALTIES = [
  'Cardiology', 'Neurology', 'Orthopedics', 'Dermatology', 'Pediatrics',
  'Gynecology', 'General Medicine', 'ENT', 'Ophthalmology', 'Oncology',
  'Psychiatry', 'Pulmonology', 'Gastroenterology', 'Urology', 'Nephrology',
  'Endocrinology', 'Dentistry'
];

const STATES = {
  'Tamil Nadu': ['Chennai', 'Coimbatore', 'Madurai'],
  'Karnataka': ['Bengaluru', 'Mysuru'],
  'Maharashtra': ['Mumbai', 'Pune'],
  'Kerala': ['Kochi', 'Thiruvananthapuram'],
  'Delhi': ['New Delhi'],
  'Telangana': ['Hyderabad'],
  'West Bengal': ['Kolkata'],
  'Gujarat': ['Ahmedabad'],
};

// Full list of Indian states/UTs (for the dropdown, even without demo hospitals in all of them)
const ALL_INDIA_STATES = [
  'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh', 'Goa',
  'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka', 'Kerala',
  'Madhya Pradesh', 'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram', 'Nagaland',
  'Odisha', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu', 'Telangana', 'Tripura',
  'Uttar Pradesh', 'Uttarakhand', 'West Bengal',
  'Andaman and Nicobar Islands', 'Chandigarh', 'Dadra and Nagar Haveli and Daman and Diu',
  'Delhi', 'Jammu and Kashmir', 'Ladakh', 'Lakshadweep', 'Puducherry'
];

const FIRST_NAMES = ['Ananya', 'Priya', 'Arjun', 'Karthik', 'Divya', 'Rahul', 'Sneha', 'Vikram',
  'Meera', 'Suresh', 'Lakshmi', 'Aditya', 'Kavya', 'Ravi', 'Pooja', 'Sanjay'];
const LAST_NAMES = ['Sharma', 'Krishnan', 'Iyer', 'Reddy', 'Nair', 'Menon', 'Gupta', 'Rao',
  'Pillai', 'Verma', 'Subramaniam', 'Chandran'];
const QUALS = ['MBBS, MD', 'MBBS, MS', 'MBBS, MD, DM', 'MBBS, MS, MCh', 'BDS, MDS'];

function rand(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
function randInt(a, b) { return Math.floor(Math.random() * (b - a + 1)) + a; }

function weeklyHours() {
  const pattern = [
    { mon: '9:00 AM – 1:00 PM', tue: '4:00 PM – 8:00 PM', wed: 'Unavailable', thu: '9:00 AM – 1:00 PM', fri: '4:00 PM – 8:00 PM', sat: '10:00 AM – 2:00 PM', sun: 'Unavailable' },
    { mon: '10:00 AM – 2:00 PM', tue: '10:00 AM – 2:00 PM', wed: '4:00 PM – 7:00 PM', thu: 'Unavailable', fri: '10:00 AM – 2:00 PM', sat: '9:00 AM – 12:00 PM', sun: 'Unavailable' },
  ];
  return rand(pattern);
}

function seed() {
  const already = db.prepare('SELECT COUNT(*) c FROM hospitals').get().c;
  if (already > 0) {
    console.log('Seed skipped — data already exists.');
    return;
  }

  const txn = db.transaction(() => {
    // --- Users: 1 admin + 1 demo patient ---
    const adminHash = bcrypt.hashSync('admin123', 8);
    db.prepare(`INSERT INTO users (name, email, password_hash, mobile, role, state, city)
                VALUES (?, ?, ?, ?, 'admin', 'Tamil Nadu', 'Chennai')`)
      .run('MedSync Admin', 'admin@medsync.in', adminHash, '9999999999');

    const demoHash = bcrypt.hashSync('demo1234', 8);
    db.prepare(`INSERT INTO users (name, email, password_hash, mobile, role, age, gender, state, city)
                VALUES (?, ?, ?, ?, 'patient', 24, 'Male', 'Tamil Nadu', 'Chennai')`)
      .run('Demo Patient', 'patient@medsync.in', demoHash, '9876543210');

    // --- Hospital nodes (distributed nodes) ---
    const nodeNames = ['Hospital Node A', 'Hospital Node B', 'Hospital Node C', 'Hospital Node D'];
    const nodeIds = nodeNames.map(n =>
      db.prepare(`INSERT INTO hospital_nodes (node_name, status, lamport_clock) VALUES (?, 'ONLINE', 0)`).run(n).lastInsertRowid
    );

    const hospitalNames = [
      'Apollo Meridian Hospital', 'Sunrise Multispecialty Hospital', 'CareWell General Hospital',
      'Lakeview Health Institute', 'Vitality Heart & Ortho Center', 'GreenCross City Hospital',
      'St. Anne Medical Center', 'Horizon Speciality Hospital'
    ];

    const hospitalIds = [];
    let nodeCursor = 0;
    for (const [state, cities] of Object.entries(STATES)) {
      for (const city of cities) {
        const name = hospitalNames[hospitalIds.length % hospitalNames.length] + ` – ${city}`;
        const node_id = nodeIds[nodeCursor % nodeIds.length];
        nodeCursor++;
        const online = hospitalIds.length % 5 === 4 ? 0 : 1; // ~1 in 5 hospitals has no online booking
        const id = db.prepare(`INSERT INTO hospitals
          (node_id, name, state, city, address, pincode, phone, emergency_phone, working_hours, departments, facilities, online_booking_enabled, rating, image)
          VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)`).run(
          node_id, name, state, city,
          `${randInt(1, 200)}, ${rand(['Anna Salai', 'MG Road', 'Ring Road', 'Gandhi Nagar', 'Lake Road'])}, ${city}`,
          `${randInt(500000, 699999)}`,
          `0${randInt(11, 44)}-${randInt(20000000, 29999999)}`,
          `${randInt(90000, 99999)}${randInt(10000, 99999)}`,
          JSON.stringify({ mon_sat: '8:00 AM – 9:00 PM', sun: '9:00 AM – 1:00 PM (Emergency 24x7)' }),
          JSON.stringify(['Cardiology', 'Orthopedics', 'General Medicine', 'Pediatrics']),
          JSON.stringify(['24x7 Emergency', 'Pharmacy', 'Lab & Diagnostics', 'ICU', 'Ambulance']),
          online, (4 + Math.random()).toFixed(1),
          null
        ).lastInsertRowid;
        hospitalIds.push(id);
      }
    }

    // --- Doctors ---
    const doctorIds = [];
    for (const hospitalId of hospitalIds) {
      const numDoctors = randInt(3, 5);
      for (let i = 0; i < numDoctors; i++) {
        const specialty = rand(SPECIALTIES);
        const name = `Dr. ${rand(FIRST_NAMES)} ${rand(LAST_NAMES)}`;
        const id = db.prepare(`INSERT INTO doctors
          (hospital_id, name, specialty, qualification, experience_years, gender, fee, rating, languages, about, expertise, image, online_consultation, working_hours)
          VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)`).run(
          hospitalId, name, specialty, rand(QUALS), randInt(4, 22), rand(['Male', 'Female']),
          randInt(300, 1500), (4 + Math.random() * 0.9).toFixed(1),
          JSON.stringify(['English', 'Tamil', rand(['Hindi', 'Telugu', 'Kannada', 'Malayalam'])]),
          `${name} is a dedicated ${specialty.toLowerCase()} specialist focused on evidence-based, patient-first care.`,
          JSON.stringify([`${specialty} disorders`, 'Preventive care', 'Chronic condition management', 'Patient counselling']),
          null, 1,
          JSON.stringify(weeklyHours())
        ).lastInsertRowid;
        doctorIds.push(id);
      }
    }

    // --- Appointment slots for the next 5 days for every doctor ---
    const today = new Date();
    const timesMorning = ['9:00 AM', '9:30 AM', '10:00 AM', '10:30 AM', '11:00 AM', '11:30 AM'];
    const timesEvening = ['4:00 PM', '4:30 PM', '5:00 PM', '5:30 PM', '6:00 PM', '6:30 PM'];
    const insertSlot = db.prepare(`INSERT OR IGNORE INTO appointment_slots (doctor_id, date, time, status) VALUES (?,?,?,?)`);

    for (const doctorId of doctorIds) {
      for (let d = 0; d < 5; d++) {
        const date = new Date(today); date.setDate(today.getDate() + d);
        const dateStr = date.toISOString().slice(0, 10);
        const times = d % 2 === 0 ? timesMorning : timesEvening;
        times.forEach(t => {
          const status = Math.random() < 0.25 ? 'booked' : 'available';
          insertSlot.run(doctorId, dateStr, t, status);
        });
      }
    }

    // --- A handful of reviews ---
    const reviewComments = [
      'Very attentive and explained everything clearly.',
      'Short waiting time, professional staff.',
      'Great experience, highly recommend.',
      'Doctor was patient and thorough with the diagnosis.',
    ];
    for (const doctorId of doctorIds.slice(0, 20)) {
      db.prepare(`INSERT INTO reviews (doctor_id, patient_name, rating, comment) VALUES (?,?,?,?)`)
        .run(doctorId, rand(FIRST_NAMES) + ' ' + rand(LAST_NAMES)[0] + '.', randInt(4, 5), rand(reviewComments));
    }
  });

  txn();
  console.log(`Seeded: ${db.prepare('SELECT COUNT(*) c FROM hospitals').get().c} hospitals, ${db.prepare('SELECT COUNT(*) c FROM doctors').get().c} doctors, ${db.prepare('SELECT COUNT(*) c FROM appointment_slots').get().c} slots.`);
}

module.exports = { seed, SPECIALTIES, ALL_INDIA_STATES, STATES };

if (require.main === module) {
  seed();
}

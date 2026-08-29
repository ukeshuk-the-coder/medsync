require('dotenv').config();
const express = require('express');
const cors = require('cors');

const { seed } = require('./db/seed');
seed();

const authRoutes = require('./routes/auth');
const metaRoutes = require('./routes/meta');
const doctorRoutes = require('./routes/doctors');
const hospitalRoutes = require('./routes/hospitals');
const appointmentRoutes = require('./routes/appointments');
const callbackRoutes = require('./routes/callbacks');
const adminRoutes = require('./routes/admin');

const app = express();
app.use(cors());
app.use(express.json());

app.get('/api/health', (req, res) => res.json({ status: 'ok', service: 'MedSync API' }));

app.use('/api/auth', authRoutes);
app.use('/api/meta', metaRoutes);
app.use('/api/doctors', doctorRoutes);
app.use('/api/hospitals', hospitalRoutes);
app.use('/api/appointments', appointmentRoutes);
app.use('/api/callbacks', callbackRoutes);
app.use('/api/admin', adminRoutes);

// Fallback error handler
app.use((err, req, res, next) => {
  console.error(err);
  res.status(err.status || 500).json({ error: err.message || 'Something went wrong.' });
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`MedSync API running on http://localhost:${PORT}`);
});

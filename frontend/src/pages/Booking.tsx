import { useEffect, useState } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import api from '../api';
import { useAuth } from '../AuthContext';
import { useToast } from '../Toast';
import type { Doctor, Slot } from '../types';

type Step = 'date' | 'time' | 'details' | 'confirm';

export default function Booking() {
  const { doctorId } = useParams();
  const [params] = useSearchParams();
  const forceCallback = params.get('callback') === '1';
  const navigate = useNavigate();
  const { user } = useAuth();
  const toast = useToast();

  const [doctor, setDoctor] = useState<Doctor | null>(null);
  const [availability, setAvailability] = useState<Record<string, Slot[]>>({});
  const [step, setStep] = useState<Step>('date');
  const [date, setDate] = useState('');
  const [slot, setSlot] = useState<Slot | null>(null);
  const [form, setForm] = useState({ name: user?.name || '', age: '', gender: '', email: user?.email || '', mobile: user?.mobile || '', reason: '', notes: '' });
  const [callbackMode, setCallbackMode] = useState(forceCallback);
  const [callbackForm, setCallbackForm] = useState({ name: user?.name || '', mobile: user?.mobile || '', preferredTime: '', reason: '' });
  const [submitting, setSubmitting] = useState(false);
  const [conflict, setConflict] = useState<{ nextAvailableSlots: any[]; otherDoctors: any[] } | null>(null);
  const [result, setResult] = useState<any>(null);
  const [callbackDone, setCallbackDone] = useState(false);

  useEffect(() => {
    api.get(`/doctors/${doctorId}`).then(r => {
      setDoctor(r.data);
      if (!r.data.online_booking_enabled) setCallbackMode(true);
    });
    api.get(`/appointments/availability?doctorId=${doctorId}`).then(r => setAvailability(r.data));
  }, [doctorId]);

  if (!doctor) return <div className="container section"><div className="skeleton" style={{ height: 300 }} /></div>;

  if (!user) {
    return (
      <div className="container section" style={{ maxWidth: 480 }}>
        <div className="card" style={{ padding: 32, textAlign: 'center' }}>
          <h3>Please login to continue</h3>
          <p style={{ color: 'var(--muted)' }}>You need an account to book an appointment or request a callback.</p>
          <button className="btn btn-primary btn-block" onClick={() => navigate('/login', { state: { from: `/book/${doctorId}` } })}>Login</button>
        </div>
      </div>
    );
  }

  // ---- CALLBACK PATH ----
  if (callbackMode) {
    if (callbackDone) {
      return (
        <div className="container section" style={{ maxWidth: 520 }}>
          <div className="card" style={{ padding: 36, textAlign: 'center' }}>
            <div style={{ fontSize: '2.4rem', color: 'var(--ok)' }}>✓</div>
            <h3>Callback Request Submitted</h3>
            <p style={{ color: 'var(--muted)' }}>Your request has been sent to the hospital. A hospital representative will contact you during your selected callback period.</p>
            <button className="btn btn-primary" onClick={() => navigate('/dashboard/callbacks')}>View My Callback Requests</button>
          </div>
        </div>
      );
    }
    return (
      <div className="container section" style={{ maxWidth: 560 }}>
        <div className="card" style={{ padding: 32 }}>
          <div className="pill pill-danger" style={{ marginBottom: 16 }}>Online Booking Currently Unavailable</div>
          <h3 style={{ marginBottom: 6 }}>{doctor.name} · {doctor.hospital_name}</h3>
          <div className="grid grid-2" style={{ marginBottom: 20, fontSize: '0.85rem' }}>
            <div style={{ background: 'var(--mint-bg)', padding: 12, borderRadius: 10 }}>
              <strong>Doctor working hours</strong>
              <div style={{ color: 'var(--muted)', marginTop: 4 }}>
                {Object.entries(doctor.working_hours || {}).slice(0, 3).map(([k, v]) => <div key={k}>{k.toUpperCase()}: {v}</div>)}
              </div>
            </div>
            <div style={{ background: 'var(--mint-bg)', padding: 12, borderRadius: 10 }}>
              <strong>Hospital contact</strong>
              <div style={{ color: 'var(--muted)', marginTop: 4 }}>{doctor.address}</div>
            </div>
          </div>

          <form onSubmit={async e => {
            e.preventDefault();
            setSubmitting(true);
            try {
              await api.post('/callbacks', {
                hospitalId: doctor.hospital_id, doctorId: doctor.id,
                name: callbackForm.name, mobile: callbackForm.mobile,
                preferredTime: callbackForm.preferredTime, reason: callbackForm.reason,
              });
              setCallbackDone(true);
            } catch (err: any) {
              toast(err.response?.data?.error || 'Could not submit request.', 'error');
            } finally { setSubmitting(false); }
          }}>
            <div className="field"><label>Name</label><input required value={callbackForm.name} onChange={e => setCallbackForm({ ...callbackForm, name: e.target.value })} /></div>
            <div className="field"><label>Mobile Number</label><input required value={callbackForm.mobile} onChange={e => setCallbackForm({ ...callbackForm, mobile: e.target.value })} /></div>
            <div className="field"><label>Preferred Callback Time</label>
              <select required value={callbackForm.preferredTime} onChange={e => setCallbackForm({ ...callbackForm, preferredTime: e.target.value })}>
                <option value="">Select a slot</option>
                <option>Morning (9 AM – 12 PM)</option>
                <option>Afternoon (12 PM – 4 PM)</option>
                <option>Evening (4 PM – 8 PM)</option>
              </select>
            </div>
            <div className="field"><label>Reason for Visit</label><textarea rows={3} value={callbackForm.reason} onChange={e => setCallbackForm({ ...callbackForm, reason: e.target.value })} /></div>
            <button className="btn btn-amber btn-block" disabled={submitting}>{submitting ? 'Submitting…' : 'Request Callback'}</button>
          </form>
        </div>
      </div>
    );
  }

  // ---- ONLINE BOOKING PATH ----
  if (result) {
    return (
      <div className="container section" style={{ maxWidth: 560 }}>
        <div className="card" style={{ padding: 36 }}>
          <div style={{ fontSize: '2.4rem', color: 'var(--ok)', textAlign: 'center' }}>✓</div>
          <h3 style={{ textAlign: 'center', marginBottom: 4 }}>Appointment Confirmed</h3>
          <div className="mono" style={{ textAlign: 'center', color: 'var(--amber-deep)', marginBottom: 24 }}>{result.appointment.appointment_code}</div>
          <div style={{ background: 'var(--mint-bg)', borderRadius: 10, padding: 18, fontSize: '0.9rem' }}>
            <Row label="Doctor" value={result.doctor.name} />
            <Row label="Specialty" value={result.doctor.specialty} />
            <Row label="Hospital" value={result.hospital.name} />
            <Row label="Date" value={result.appointment.date} />
            <Row label="Time" value={result.appointment.time} />
            <Row label="Patient" value={result.appointment.patient_name} />
            <Row label="Fee" value={`₹${result.appointment.fee}`} />
            <Row label="Address" value={`${result.hospital.address}, ${result.hospital.city}`} />
          </div>
          <p style={{ fontSize: '0.82rem', color: 'var(--muted)', marginTop: 16 }}>
            📧 A confirmation email has been sent to {form.email || 'your registered email'} with these details and arrival instructions.
          </p>
          <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
            <button className="btn btn-outline" style={{ flex: 1 }} onClick={() => navigate('/dashboard/appointments')}>View Appointment</button>
            <button className="btn btn-primary" style={{ flex: 1 }} onClick={() => window.print()}>Download Confirmation</button>
          </div>
        </div>
      </div>
    );
  }

  if (conflict) {
    return (
      <div className="container section" style={{ maxWidth: 560 }}>
        <div className="card" style={{ padding: 32 }}>
          <div className="pill pill-danger" style={{ marginBottom: 14 }}>This Slot Is No Longer Available</div>
          <h4 style={{ marginBottom: 14 }}>Next Available Slots</h4>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 20 }}>
            {conflict.nextAvailableSlots.map(s => (
              <button key={s.id} className="btn btn-outline btn-sm" onClick={() => { setSlot({ id: s.id, time: s.time, status: 'available' }); setDate(s.date); setConflict(null); setStep('details'); }}>
                {s.date} · {s.time}
              </button>
            ))}
          </div>
          <h4 style={{ marginBottom: 14 }}>Other Doctors ({doctor.specialty})</h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {conflict.otherDoctors.map((d: any) => (
              <button key={d.id} className="btn btn-outline btn-sm" onClick={() => navigate(`/doctors/${d.id}`)}>{d.name} — {d.specialty}</button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const dates = Object.keys(availability);

  return (
    <div className="container section" style={{ maxWidth: 640 }}>
      <StepBar step={step} />
      <div className="card" style={{ padding: 32, marginTop: 20 }}>
        <h3 style={{ marginBottom: 4 }}>{doctor.name}</h3>
        <p style={{ color: 'var(--muted)', marginBottom: 24, fontSize: '0.9rem' }}>{doctor.specialty} · {doctor.hospital_name}</p>

        {step === 'date' && (
          <>
            <label>Select Date</label>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 24 }}>
              {dates.map(d => (
                <button key={d} className={date === d ? 'btn btn-primary btn-sm' : 'btn btn-outline btn-sm'} onClick={() => setDate(d)}>{d}</button>
              ))}
            </div>
            <button className="btn btn-primary btn-block" disabled={!date} onClick={() => setStep('time')}>Continue</button>
          </>
        )}

        {step === 'time' && (
          <>
            <label>Select Available Time — {date}</label>
            <div className="grid grid-3" style={{ marginBottom: 24 }}>
              {(availability[date] || []).map(s => (
                <button key={s.id} disabled={s.status !== 'available'}
                  className={slot?.id === s.id ? 'btn btn-primary btn-sm' : 'btn btn-outline btn-sm'}
                  onClick={() => setSlot(s)}>
                  {s.status === 'available' ? '🟢' : '🔴'} {s.time}
                </button>
              ))}
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button className="btn btn-outline" onClick={() => setStep('date')}>Back</button>
              <button className="btn btn-primary" style={{ flex: 1 }} disabled={!slot} onClick={() => setStep('details')}>Continue</button>
            </div>
          </>
        )}

        {step === 'details' && (
          <form onSubmit={e => { e.preventDefault(); setStep('confirm'); }}>
            <div className="grid grid-2">
              <div className="field"><label>Full Name</label><input required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} /></div>
              <div className="field"><label>Age</label><input required type="number" min={0} value={form.age} onChange={e => setForm({ ...form, age: e.target.value })} /></div>
              <div className="field"><label>Gender</label>
                <select required value={form.gender} onChange={e => setForm({ ...form, gender: e.target.value })}>
                  <option value="">Select</option><option>Male</option><option>Female</option><option>Other</option>
                </select>
              </div>
              <div className="field"><label>Mobile Number</label><input required value={form.mobile} onChange={e => setForm({ ...form, mobile: e.target.value })} /></div>
            </div>
            <div className="field"><label>Email</label><input required type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} /></div>
            <div className="field"><label>Reason for Visit</label><input required value={form.reason} onChange={e => setForm({ ...form, reason: e.target.value })} /></div>
            <div className="field"><label>Optional Notes</label><textarea rows={3} value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} /></div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button type="button" className="btn btn-outline" onClick={() => setStep('time')}>Back</button>
              <button className="btn btn-primary" style={{ flex: 1 }}>Continue</button>
            </div>
          </form>
        )}

        {step === 'confirm' && slot && (
          <>
            <div style={{ background: 'var(--mint-bg)', borderRadius: 10, padding: 18, fontSize: '0.9rem', marginBottom: 20 }}>
              <Row label="Doctor" value={doctor.name} />
              <Row label="Hospital" value={doctor.hospital_name || ''} />
              <Row label="Date" value={date} />
              <Row label="Time" value={slot.time} />
              <Row label="Consultation" value="In-person" />
              <Row label="Fee" value={`₹${doctor.fee}`} />
              <Row label="Patient" value={form.name} />
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button className="btn btn-outline" onClick={() => setStep('details')}>Back</button>
              <button className="btn btn-primary" style={{ flex: 1 }} disabled={submitting} onClick={async () => {
                setSubmitting(true);
                try {
                  const res = await api.post('/appointments', {
                    doctorId: doctor.id, slotId: slot.id,
                    patientName: form.name, patientAge: Number(form.age), patientGender: form.gender,
                    patientEmail: form.email, patientMobile: form.mobile, reason: form.reason, notes: form.notes,
                    consultationType: 'In-person',
                  });
                  setResult(res.data);
                } catch (err: any) {
                  if (err.response?.status === 409 && err.response.data.nextAvailableSlots) {
                    setConflict(err.response.data);
                  } else {
                    toast(err.response?.data?.error || 'Booking failed.', 'error');
                  }
                } finally { setSubmitting(false); }
              }}>{submitting ? 'Confirming…' : 'Confirm Appointment'}</button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return <div style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0' }}><span style={{ color: 'var(--muted)' }}>{label}</span><strong>{value}</strong></div>;
}

function StepBar({ step }: { step: Step }) {
  const steps: Step[] = ['date', 'time', 'details', 'confirm'];
  const labels = { date: 'Date', time: 'Time', details: 'Details', confirm: 'Confirm' };
  const idx = steps.indexOf(step);
  return (
    <div style={{ display: 'flex', gap: 8 }}>
      {steps.map((s, i) => (
        <div key={s} style={{ flex: 1, textAlign: 'center' }}>
          <div style={{ height: 4, borderRadius: 2, background: i <= idx ? 'var(--teal-deep)' : 'var(--line)', marginBottom: 6 }} />
          <span style={{ fontSize: '0.75rem', color: i <= idx ? 'var(--teal-deep)' : 'var(--muted)', fontWeight: 600 }}>{labels[s]}</span>
        </div>
      ))}
    </div>
  );
}

import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './AuthContext';
import { ToastProvider } from './Toast';
import { RequireAuth, RequireAdmin } from './RouteGuards';
import Navbar from './components/Navbar';
import Footer from './components/Footer';

import Home from './pages/Home';
import FindDoctors from './pages/FindDoctors';
import FindHospitals from './pages/FindHospitals';
import Specialties from './pages/Specialties';
import DoctorProfile from './pages/DoctorProfile';
import HospitalProfile from './pages/HospitalProfile';
import Booking from './pages/Booking';
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import DashboardLayout from './pages/DashboardLayout';
import DashboardOverview from './pages/DashboardOverview';
import AppointmentHistory from './pages/AppointmentHistory';
import CallbackRequests from './pages/CallbackRequests';
import ProfilePage from './pages/ProfilePage';
import AdminDashboard from './pages/AdminDashboard';
import DistributedNetwork from './pages/DistributedNetwork';
import About from './pages/About';
import Contact from './pages/Contact';
import { Privacy, Terms } from './pages/StaticPages';

function NotFound() {
  return (
    <div className="container section" style={{ textAlign: 'center' }}>
      <h1>404</h1>
      <p style={{ color: 'var(--muted)' }}>The page you're looking for doesn't exist.</p>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ToastProvider>
          <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
            <Navbar />
            <main style={{ flex: 1 }}>
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/doctors" element={<FindDoctors />} />
                <Route path="/doctors/:id" element={<DoctorProfile />} />
                <Route path="/hospitals" element={<FindHospitals />} />
                <Route path="/hospitals/:id" element={<HospitalProfile />} />
                <Route path="/specialties" element={<Specialties />} />
                <Route path="/network" element={<DistributedNetwork />} />
                <Route path="/book/:doctorId" element={<Booking />} />

                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/forgot-password" element={<ForgotPassword />} />

                <Route path="/dashboard" element={<RequireAuth><DashboardLayout /></RequireAuth>}>
                  <Route index element={<DashboardOverview />} />
                  <Route path="appointments" element={<AppointmentHistory />} />
                  <Route path="callbacks" element={<CallbackRequests />} />
                  <Route path="profile" element={<ProfilePage />} />
                </Route>

                <Route path="/admin" element={<RequireAdmin><AdminDashboard /></RequireAdmin>} />

                <Route path="/about" element={<About />} />
                <Route path="/contact" element={<Contact />} />
                <Route path="/privacy" element={<Privacy />} />
                <Route path="/terms" element={<Terms />} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </main>
            <Footer />
          </div>
        </ToastProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export interface User {
  id: number;
  name: string;
  email: string;
  role: 'patient' | 'admin' | 'hospital';
  mobile?: string;
  state?: string;
  city?: string;
}

export interface Doctor {
  id: number;
  hospital_id: number;
  name: string;
  specialty: string;
  qualification: string;
  experience_years: number;
  gender: string;
  fee: number;
  rating: number;
  languages: string[];
  about: string;
  expertise: string[];
  image?: string;
  online_consultation: number;
  working_hours: Record<string, string>;
  hospital_name?: string;
  state?: string;
  city?: string;
  online_booking_enabled?: number;
  address?: string;
  reviews?: Review[];
}

export interface Review {
  id: number;
  patient_name: string;
  rating: number;
  comment: string;
  created_at: string;
}

export interface Hospital {
  id: number;
  node_id: number;
  name: string;
  state: string;
  city: string;
  address: string;
  pincode: string;
  phone: string;
  emergency_phone: string;
  working_hours: Record<string, string>;
  departments: string[];
  facilities: string[];
  online_booking_enabled: number;
  rating: number;
  doctors?: Doctor[];
  reviews?: Review[];
}

export interface Slot {
  id: number;
  time: string;
  status: 'available' | 'booked' | 'unavailable';
}

export interface Appointment {
  id: number;
  appointment_code: string;
  doctor_id: number;
  hospital_id: number;
  date: string;
  time: string;
  patient_name: string;
  reason: string;
  consultation_type: string;
  fee: number;
  status: string;
  doctor_name?: string;
  specialty?: string;
  hospital_name?: string;
  city?: string;
  state?: string;
}

export interface CallbackRequest {
  id: number;
  hospital_id: number;
  hospital_name?: string;
  doctor_name?: string;
  name: string;
  mobile: string;
  preferred_time: string;
  reason: string;
  status: string;
  created_at: string;
}

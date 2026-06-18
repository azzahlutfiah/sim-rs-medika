/**
 * Types definition for Sistem Informasi Manajemen Rumah Sakit (SIM RS)
 */

export interface WeeklySchedule {
  day: 'Senin' | 'Selasa' | 'Rabu' | 'Kamis' | 'Jumat' | 'Sabtu' | 'Minggu';
  shift: 'Pagi' | 'Siang' | 'Malam' | 'Libur';
  hours: string;
}

export interface Doctor {
  id: number;
  name: string;
  specialization: string;
  status: 'Aktif' | 'Cuti' | 'Tidak Aktif';
  contact: string;
  gender: 'Laki-laki' | 'Perempuan';
  room: string;
  schedule?: WeeklySchedule[];
}

export interface Patient {
  id: number;
  nik: string;
  rekam_medis_number: string;
  name: string;
  birth_date: string; // YYYY-MM-DD
  gender: 'Laki-laki' | 'Perempuan';
  address: string;
  phone: string;
  bpjs_number?: string;
  created_at?: string;
}

export interface Appointment {
  id: number;
  patient_id: number;
  doctor_id: number;
  appointment_date: string; // YYYY-MM-DD
  appointment_time: string; // e.g. "09:00 - 10:00"
  queue_number: number;
  status: 'Menunggu' | 'Diperiksa' | 'Selesai' | 'Batal';
  complaint: string;
  patient_name?: string; // Hydrated on retrieval
  doctor_name?: string;  // Hydrated on retrieval
  specialization?: string; // Hydrated on retrieval
  rekam_medis_number?: string; // Hydrated on retrieval
}

export interface PrescriptionItem {
  name: string;
  qty: number;
  dosage: string;
}

export interface MedicalRecord {
  id: number;
  patient_id: number;
  doctor_id: number;
  check_date: string; // YYYY-MM-DD
  blood_pressure?: string;
  heart_rate?: number;
  temperature?: number;
  symptoms: string;
  diagnosis: string;
  prescription: PrescriptionItem[]; // Stored as JSON
  notes?: string;
  patient_name?: string; // Hydrated
  doctor_name?: string;  // Hydrated
  specialization?: string; // Hydrated
  rekam_medis_number?: string; // Hydrated
}

export interface Medicine {
  id: number;
  name: string;
  category: string;
  stock: number;
  price: number;
  unit: string;
  code: string;
}

export interface Billing {
  id: number;
  patient_id: number;
  invoice_number: string;
  doctor_fee: number;
  medicine_fee: number;
  facility_fee: number;
  total_amount: number;
  status: 'Belum Lunas' | 'Lunas';
  billing_date: string;
  payment_method?: string;
  payment_date?: string;
  patient_name?: string; // Hydrated
  rekam_medis_number?: string; // Hydrated
}

export interface HospitalStats {
  totalPatients: number;
  activeDoctors: number;
  todayAppointments: number;
  completedAppointments: number;
  activeQueues: number;
  medicineShortageCount: number;
  revenueToday: number;
}

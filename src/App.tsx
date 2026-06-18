import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import Patients from './components/Patients';
import Doctors from './components/Doctors';
import Pharmacy from './components/Pharmacy';
import BillingPanel from './components/Billing';
import BackupPanel from './components/Backup';
import Login from './components/Login';
import { Doctor, Patient, Appointment, MedicalRecord, Medicine, Billing, HospitalStats } from './types';

interface UserSession {
  username: string;
  role: 'admin' | 'staff';
  name: string;
  email: string;
}

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [dbType, setDbType] = useState<'mysql' | 'json'>('json');
  const [loading, setLoading] = useState(true);

  // User Authentication State
  const [user, setUser] = useState<UserSession | null>(() => {
    const saved = localStorage.getItem('simrs_user');
    return saved ? JSON.parse(saved) : null;
  });

  const handleLoginSuccess = (userData: UserSession) => {
    setUser(userData);
    localStorage.setItem('simrs_user', JSON.stringify(userData));
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('simrs_user');
  };

  // States
  const [stats, setStats] = useState<HospitalStats>({
    totalPatients: 0,
    activeDoctors: 0,
    todayAppointments: 0,
    completedAppointments: 0,
    activeQueues: 0,
    medicineShortageCount: 0,
    revenueToday: 0
  });
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [medicalRecords, setMedicalRecords] = useState<MedicalRecord[]>([]);
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [billingList, setBillingList] = useState<Billing[]>([]);

  // Function to load all lists from Backend
  const loadAllData = async () => {
    try {
      setLoading(true);
      
      // Load Stats
      const resStats = await fetch('/api/stats');
      if (resStats.ok) {
        const dataStats = await resStats.json();
        setStats(dataStats);
        if (dataStats.dbType) {
          setDbType(dataStats.dbType);
        }
      }

      // Load Doctors
      const resDocs = await fetch('/api/doctors');
      if (resDocs.ok) setDoctors(await resDocs.json());

      // Load Patients
      const resPats = await fetch('/api/patients');
      if (resPats.ok) setPatients(await resPats.json());

      // Load Appointments
      const resApps = await fetch('/api/appointments');
      if (resApps.ok) setAppointments(await resApps.json());

      // Load Medical Records
      const resRecords = await fetch('/api/medical-records');
      if (resRecords.ok) setMedicalRecords(await resRecords.json());

      // Load Medicines
      const resMeds = await fetch('/api/medicines');
      if (resMeds.ok) setMedicines(await resMeds.json());

      // Load Billing
      const resBills = await fetch('/api/billing');
      if (resBills.ok) setBillingList(await resBills.json());

    } catch (error) {
      console.error("Gagal menyelaraskan data dengan API server:", error);
    } finally {
      setLoading(false);
    }
  };

  // Muat data di awal pemasangan komponen
  useEffect(() => {
    loadAllData();
  }, []);

  // ---------------------------------------------------------------------------
  // OPERASI API (MUTASI)
  // ---------------------------------------------------------------------------

  const handleAddPatient = async (patientData: Partial<Patient>) => {
    const res = await fetch('/api/patients', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(patientData)
    });
    if (!res.ok) throw new Error('Gagal meregistrasi pasien');
    await loadAllData();
    return await res.json();
  };

  const handleAddDoctor = async (doctorData: Partial<Doctor>) => {
    const res = await fetch('/api/doctors', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(doctorData)
    });
    if (!res.ok) throw new Error('Gagal meregistrasi dokter');
    await loadAllData();
    return await res.json();
  };

  const handleUpdateDoctorStatus = async (id: number, status: 'Aktif' | 'Cuti' | 'Tidak Aktif') => {
    const res = await fetch(`/api/doctors/${id}/status`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status })
    });
    if (!res.ok) throw new Error('Gagal mengupdate status dokter');
    await loadAllData();
  };

  const handleAddAppointment = async (appData: Partial<Appointment>) => {
    const res = await fetch('/api/appointments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(appData)
    });
    if (!res.ok) throw new Error('Gagal mendaftarkan antrean baru');
    await loadAllData();
    return await res.json();
  };

  const handleUpdateAppointmentStatus = async (id: number, status: 'Menunggu' | 'Diperiksa' | 'Selesai' | 'Batal') => {
    const res = await fetch(`/api/appointments/${id}/status`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status })
    });
    if (!res.ok) throw new Error('Gagal mengupdate status antrean');
    await loadAllData();
  };

  const handleAddMedicalRecord = async (mrData: Partial<MedicalRecord>) => {
    const res = await fetch('/api/medical-records', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(mrData)
    });
    if (!res.ok) throw new Error('Gagal merekam data pemeriksaan medis');
    await loadAllData();
    return await res.json();
  };

  const handleAddMedicine = async (medData: Partial<Medicine>) => {
    const res = await fetch('/api/medicines', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(medData)
    });
    if (!res.ok) throw new Error('Gagal mendaftarkan obat baru');
    await loadAllData();
    return await res.json();
  };

  const handleRestockMedicine = async (id: number, qty: number) => {
    const res = await fetch(`/api/medicines/${id}/restock`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ qty })
    });
    if (!res.ok) throw new Error('Gagal merestock persediaan');
    await loadAllData();
  };

  const handlePayBilling = async (id: number, paymentMethod: string) => {
    const res = await fetch(`/api/billing/${id}/pay`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ paymentMethod })
    });
    if (!res.ok) throw new Error('Gagal memproses validasi pembayaran kasir');
    await loadAllData();
  };

  const handleAddBilling = async (billingData: Partial<Billing>) => {
    const res = await fetch(`/api/billing`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(billingData)
    });
    if (!res.ok) throw new Error('Gagal membuat tagihan billing baru');
    await loadAllData();
  };

  const handleUpdateBilling = async (id: number, billingData: Partial<Billing>) => {
    const res = await fetch(`/api/billing/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(billingData)
    });
    if (!res.ok) throw new Error('Gagal memperbarui tagihan billing');
    await loadAllData();
  };

  const handleDeleteBilling = async (id: number) => {
    const res = await fetch(`/api/billing/${id}`, {
      method: 'DELETE'
    });
    if (!res.ok) throw new Error('Gagal menghapus tagihan billing');
    await loadAllData();
  };

  // ---------------------------------------------------------------------------
  // OPERASI API ENHANCED CRUD (EDIT & DELETE)
  // ---------------------------------------------------------------------------

  const handleUpdatePatient = async (id: number, patientData: Partial<Patient>) => {
    const res = await fetch(`/api/patients/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(patientData)
    });
    if (!res.ok) throw new Error('Gagal memperbarui data pasien');
    await loadAllData();
  };

  const handleDeletePatient = async (id: number) => {
    const res = await fetch(`/api/patients/${id}`, {
      method: 'DELETE'
    });
    if (!res.ok) throw new Error('Gagal menghapus pasien');
    await loadAllData();
  };

  const handleUpdateDoctor = async (id: number, doctorData: Partial<Doctor>) => {
    const res = await fetch(`/api/doctors/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(doctorData)
    });
    if (!res.ok) throw new Error('Gagal memperbarui data dokter');
    await loadAllData();
  };

  const handleDeleteDoctor = async (id: number) => {
    const res = await fetch(`/api/doctors/${id}`, {
      method: 'DELETE'
    });
    if (!res.ok) throw new Error('Gagal menghapus dokter');
    await loadAllData();
  };

  const handleUpdateAppointment = async (id: number, appointmentData: Partial<Appointment>) => {
    const res = await fetch(`/api/appointments/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(appointmentData)
    });
    if (!res.ok) throw new Error('Gagal memperbarui data antrean');
    await loadAllData();
  };

  const handleDeleteAppointment = async (id: number) => {
    const res = await fetch(`/api/appointments/${id}`, {
      method: 'DELETE'
    });
    if (!res.ok) throw new Error('Gagal menghapus antrean');
    await loadAllData();
  };

  const handleUpdateMedicine = async (id: number, medicineData: Partial<Medicine>) => {
    const res = await fetch(`/api/medicines/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(medicineData)
    });
    if (!res.ok) throw new Error('Gagal memperbarui data obat');
    await loadAllData();
  };

  const handleDeleteMedicine = async (id: number) => {
    const res = await fetch(`/api/medicines/${id}`, {
      method: 'DELETE'
    });
    if (!res.ok) throw new Error('Gagal menghapus obat');
    await loadAllData();
  };

  // Rendering screen per tab
  const renderTabContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return (
          <Dashboard
            stats={stats}
            doctors={doctors}
            patients={patients}
            appointments={appointments}
            billingList={billingList}
            loading={loading}
            user={user}
            onRefresh={loadAllData}
            onAddAppointment={handleAddAppointment}
            onUpdateAppointmentStatus={handleUpdateAppointmentStatus}
            onUpdateAppointment={handleUpdateAppointment}
            onDeleteAppointment={handleDeleteAppointment}
          />
        );
      case 'patients':
        return (
          <Patients
            patients={patients}
            doctors={doctors}
            medicines={medicines}
            medicalRecords={medicalRecords}
            loading={loading}
            user={user}
            onRefresh={loadAllData}
            onAddPatient={handleAddPatient}
            onAddMedicalRecord={handleAddMedicalRecord}
            onUpdatePatient={handleUpdatePatient}
            onDeletePatient={handleDeletePatient}
          />
        );
      case 'doctors':
        return (
          <Doctors
            doctors={doctors}
            loading={loading}
            user={user}
            onRefresh={loadAllData}
            onAddDoctor={handleAddDoctor}
            onUpdateDoctorStatus={handleUpdateDoctorStatus}
            onUpdateDoctor={handleUpdateDoctor}
            onDeleteDoctor={handleDeleteDoctor}
          />
        );
      case 'pharmacy':
        return (
          <Pharmacy
            medicines={medicines}
            loading={loading}
            user={user}
            onRefresh={loadAllData}
            onAddMedicine={handleAddMedicine}
            onRestockMedicine={handleRestockMedicine}
            onUpdateMedicine={handleUpdateMedicine}
            onDeleteMedicine={handleDeleteMedicine}
          />
        );
      case 'billing':
        return (
          <BillingPanel
            billingList={billingList}
            loading={loading}
            user={user}
            onRefresh={loadAllData}
            onPayBilling={handlePayBilling}
            patients={patients}
            onAddBilling={handleAddBilling}
            onUpdateBilling={handleUpdateBilling}
            onDeleteBilling={handleDeleteBilling}
          />
        );
      case 'backup':
        return (
          <BackupPanel
            user={user}
            onRefreshAllData={async () => { await loadAllData(); }}
            dbType={dbType}
          />
        );
      default:
        return (
          <div className="p-8 text-center text-slate-500 font-medium">Halaman tidak ditemukan.</div>
        );
    }
  };

  if (!user) {
    return <Login onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <div className="flex bg-slate-50 min-h-screen text-slate-700 select-none">
      {/* Sidebar Menu Navigasi */}
      <Sidebar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        dbType={dbType}
        user={user}
        onLogout={handleLogout}
      />

      {/* Konten Utama Layar */}
      <main className="flex-1 p-8 max-w-7xl mx-auto h-screen overflow-y-auto">
        {renderTabContent()}
      </main>
    </div>
  );
}

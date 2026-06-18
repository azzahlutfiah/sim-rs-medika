import React, { useState } from 'react';
import { 
  Users, 
  UserPlus, 
  Heart, 
  Search, 
  Plus, 
  Trash, 
  ClipboardList, 
  Eye, 
  ShieldAlert,
  ChevronRight,
  Activity,
  UserCheck,
  Edit,
  X
} from 'lucide-react';
import { Patient, Doctor, MedicalRecord, Medicine, PrescriptionItem } from '../types';

interface PatientsProps {
  patients: Patient[];
  doctors: Doctor[];
  medicines: Medicine[];
  medicalRecords: MedicalRecord[];
  loading: boolean;
  user: { username: string; role: 'admin' | 'staff'; name: string; email: string } | null;
  onAddPatient: (patientData: Partial<Patient>) => Promise<any>;
  onAddMedicalRecord: (recordData: Partial<MedicalRecord>) => Promise<any>;
  onUpdatePatient: (id: number, patientData: Partial<Patient>) => Promise<void>;
  onDeletePatient: (id: number) => Promise<void>;
  onRefresh: () => void;
}

export default function Patients({
  patients,
  doctors,
  medicines,
  medicalRecords,
  loading,
  user,
  onAddPatient,
  onAddMedicalRecord,
  onUpdatePatient,
  onDeletePatient,
  onRefresh
}: PatientsProps) {
  // States untuk manajemen tampilan
  const [activeTab, setActiveTab] = useState<'list' | 'register'>('list');
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [showAddMRForm, setShowAddMRForm] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // States Edit Pasien
  const [editingPatient, setEditingPatient] = useState<Patient | null>(null);
  const [editNik, setEditNik] = useState('');
  const [editName, setEditName] = useState('');
  const [editBirthDate, setEditBirthDate] = useState('');
  const [editGender, setEditGender] = useState<'Laki-laki' | 'Perempuan'>('Laki-laki');
  const [editAddress, setEditAddress] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editBpjs, setEditBpjs] = useState('');
  const [isSavingEdit, setIsSavingEdit] = useState(false);

  const startEditPatient = (pat: Patient) => {
    setEditingPatient(pat);
    setEditNik(pat.nik);
    setEditName(pat.name);
    setEditBirthDate(pat.birth_date);
    setEditGender(pat.gender);
    setEditAddress(pat.address || '');
    setEditPhone(pat.phone || '');
    setEditBpjs(pat.bpjs_number || '');
  };

  const handleSaveEditPatient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPatient) return;
    try {
      setIsSavingEdit(true);
      await onUpdatePatient(editingPatient.id, {
        nik: editNik,
        name: editName,
        birth_date: editBirthDate,
        gender: editGender,
        address: editAddress,
        phone: editPhone,
        bpjs_number: editBpjs || undefined
      });
      
      // Update selectedPatient view if it is the current one
      if (selectedPatient?.id === editingPatient.id) {
        setSelectedPatient({
          ...editingPatient,
          nik: editNik,
          name: editName,
          birth_date: editBirthDate,
          gender: editGender,
          address: editAddress,
          phone: editPhone,
          bpjs_number: editBpjs || undefined
        });
      }
      setEditingPatient(null);
    } catch (err: any) {
      alert(err.message || 'Gagal menyimpan perubahan');
    } finally {
      setIsSavingEdit(false);
    }
  };

  const handleDeleteTrigger = async (id: number, name: string) => {
    if (confirm(`Apakah Anda yakin ingin menghapus data pasien: "${name}"? Tindakan ini tidak dapat dibatalkan.`)) {
      try {
        await onDeletePatient(id);
        if (selectedPatient?.id === id) {
          setSelectedPatient(null);
        }
      } catch (err: any) {
        alert(err.message || 'Gagal menghapus pasien');
      }
    }
  };

  // States Pasien Baru
  const [patNik, setPatNik] = useState('');
  const [patName, setPatName] = useState('');
  const [patBirthDate, setPatBirthDate] = useState('');
  const [patGender, setPatGender] = useState<'Laki-laki' | 'Perempuan'>('Laki-laki');
  const [patAddress, setPatAddress] = useState('');
  const [patPhone, setPatPhone] = useState('');
  const [patBpjs, setPatBpjs] = useState('');
  const [registering, setRegistering] = useState(false);

  // States Rekam Medis Baru
  const [mrDoctorId, setMrDoctorId] = useState('');
  const [mrBloodPressure, setMrBloodPressure] = useState('120/80');
  const [mrHeartRate, setMrHeartRate] = useState('80');
  const [mrTemperature, setMrTemperature] = useState('36.5');
  const [mrSymptoms, setMrSymptoms] = useState('');
  const [mrDiagnosis, setMrDiagnosis] = useState('');
  const [mrNotes, setMrNotes] = useState('');
  const [mrPrescription, setMrPrescription] = useState<PrescriptionItem[]>([]);
  const [selectedMedName, setSelectedMedName] = useState('');
  const [selectedMedQty, setSelectedMedQty] = useState('1');
  const [selectedMedDosage, setSelectedMedDosage] = useState('3x1 tablet');
  const [savingMR, setSavingMR] = useState(false);

  // Filter Pasien
  const filteredPatients = patients.filter(p => 
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.nik.includes(searchQuery) ||
    p.rekam_medis_number.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Daftarkan Pasien
  const handleRegisterPatient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!patNik || !patName || !patBirthDate || !patAddress || !patPhone) {
      alert('Mohon lengkapi semua isian formulir!');
      return;
    }

    try {
      setRegistering(true);
      await onAddPatient({
        nik: patNik,
        name: patName,
        birth_date: patBirthDate,
        gender: patGender,
        address: patAddress,
        phone: patPhone,
        bpjs_number: patBpjs || undefined
      });

      // Reset
      setPatNik('');
      setPatName('');
      setPatBirthDate('');
      setPatAddress('');
      setPatPhone('');
      setPatBpjs('');
      setActiveTab('list');
      onRefresh();
      alert('Pendaftaran Pasien baru berhasil dilakukan!');
    } catch (err: any) {
      alert('Gagal meregister pasien: ' + err.message);
    } finally {
      setRegistering(false);
    }
  };

  // Tambah item resep ke draft
  const handleAddPrescriptionItem = () => {
    if (!selectedMedName) {
      alert('Pilih obat terlebih dahulu!');
      return;
    }
    const qtyNum = parseInt(selectedMedQty, 10);
    const existingIndex = mrPrescription.findIndex(item => item.name === selectedMedName);
    
    if (existingIndex !== -1) {
      const updated = [...mrPrescription];
      updated[existingIndex].qty += qtyNum;
      setMrPrescription(updated);
    } else {
      setMrPrescription([
        ...mrPrescription,
        { name: selectedMedName, qty: qtyNum, dosage: selectedMedDosage }
      ]);
    }

    setSelectedMedName('');
    setSelectedMedQty('1');
    setSelectedMedDosage('3x1 tablet');
  };

  // Hapus item resep dari draft
  const handleRemovePrescriptionItem = (index: number) => {
    setMrPrescription(mrPrescription.filter((_, i) => i !== index));
  };

  // Simpan Rekam Medis Baru
  const handleSaveMedicalRecord = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPatient) return;
    if (!mrDoctorId || !mrSymptoms || !mrDiagnosis) {
      alert('Dokter, Gejala Utama, dan Diagnosis wajib diisi!');
      return;
    }

    try {
      setSavingMR(true);
      await onAddMedicalRecord({
        patient_id: selectedPatient.id,
        doctor_id: parseInt(mrDoctorId, 10),
        blood_pressure: mrBloodPressure,
        heart_rate: parseInt(mrHeartRate, 10),
        temperature: parseFloat(mrTemperature),
        symptoms: mrSymptoms,
        diagnosis: mrDiagnosis,
        prescription: mrPrescription,
        notes: mrNotes
      });

      // Clear Form Rekam Medis
      setMrDoctorId('');
      setMrSymptoms('');
      setMrDiagnosis('');
      setMrNotes('');
      setMrPrescription([]);
      setShowAddMRForm(false);
      onRefresh();
      
      // Update selected patient list
      alert('Rekam Medis berhasil disimpan! Obat-obatan telah didecrement, antrean di-update, dan resep billing baru diterbitkan.');
    } catch (err: any) {
      alert('Gagal menyimpan rekam medis: ' + err.message);
    } finally {
      setSavingMR(false);
    }
  };

  // Ambil riwayat rekam medis pasien terpilih
  const patientRMHistory = selectedPatient
    ? medicalRecords.filter(mr => mr.patient_id === selectedPatient.id)
    : [];

  return (
    <div className="space-y-6">
      {/* Header Panel */}
      <div className="flex justify-between items-center bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 font-sans tracking-tight">Manajemen Pasien & Rekam Medis</h2>
          <p className="text-slate-500 text-sm mt-0.5">Database Kependudukan Medis, Registrasi, & Kartu Rekam Medis Pasien</p>
        </div>
        <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200">
          <button
            onClick={() => { setActiveTab('list'); setSelectedPatient(null); setShowAddMRForm(false); }}
            className={`px-4 py-1.5 text-xs font-semibold rounded-lg transition-all ${
              activeTab === 'list' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Daftar Pasien
          </button>
          <button
            onClick={() => { setActiveTab('register'); setSelectedPatient(null); setShowAddMRForm(false); }}
            className={`px-4 py-1.5 text-xs font-semibold rounded-lg transition-all ${
              activeTab === 'register' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Registrasi Baru (Reg Pasien)
          </button>
        </div>
      </div>

      {/* Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Kolom Kiri: Form / List Pasien */}
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 lg:col-span-2">
          
          {/* TAMPILAN 1: REGISTER PASIEN BARU */}
          {activeTab === 'register' ? (
            <div className="space-y-4">
              <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2 pb-3 border-b border-slate-100">
                <UserPlus className="w-5 h-5 text-emerald-500" />
                Formulir Pendaftaran Pasien Baru
              </h3>

              <form onSubmit={handleRegisterPatient} className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-2">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">No. NIK (KTP)</label>
                  <input
                    type="text"
                    required
                    maxLength={16}
                    placeholder="Contoh: 317101XXXXXXXXXX"
                    value={patNik}
                    onChange={(e) => setPatNik(e.target.value.replace(/[^0-9]/g, ''))}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-emerald-500 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">Nama Lengkap Pasien</label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: Heri Darmawan"
                    value={patName}
                    onChange={(e) => setPatName(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-emerald-500 font-medium text-slate-800"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">Tanggal Lahir</label>
                  <input
                    type="date"
                    required
                    value={patBirthDate}
                    onChange={(e) => setPatBirthDate(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-emerald-500 text-slate-800"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">Jenis Kelamin</label>
                  <div className="flex gap-4 pt-1">
                    <label className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer">
                      <input
                        type="radio"
                        name="gender"
                        checked={patGender === 'Laki-laki'}
                        onChange={() => setPatGender('Laki-laki')}
                        className="text-emerald-600 focus:ring-emerald-500"
                      />
                      Laki-laki
                    </label>
                    <label className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer">
                      <input
                        type="radio"
                        name="gender"
                        checked={patGender === 'Perempuan'}
                        onChange={() => setPatGender('Perempuan')}
                        className="text-emerald-500 focus:ring-emerald-500"
                      />
                      Perempuan
                    </label>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">No. Telepon / HP</label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: 0812XXXXXXXX"
                    value={patPhone}
                    onChange={(e) => setPatPhone(e.target.value.replace(/[^0-9]/g, ''))}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-emerald-500 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">No. Kartu BPJS Kesehatan (Opsional)</label>
                  <input
                    type="text"
                    placeholder="Kosongkan jika Pasien Umum"
                    value={patBpjs}
                    onChange={(e) => setPatBpjs(e.target.value.replace(/[^0-9]/g, ''))}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-emerald-500 font-mono"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">Alamat Sesuai KTP</label>
                  <textarea
                    required
                    placeholder="Nama jalan, nomor rumah, RT/RW, kecamatan, kota..."
                    value={patAddress}
                    onChange={(e) => setPatAddress(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-emerald-500 min-h-[80px] text-slate-700"
                  ></textarea>
                </div>

                <div className="md:col-span-2 pt-2">
                  <button
                    type="submit"
                    disabled={registering}
                    className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-semibold transition-colors shadow-lg shadow-emerald-600/10"
                  >
                    {registering ? 'Menyimpan Data Pasien...' : 'Konfirmasi & Daftarkan Rekam Medis (RM)'}
                  </button>
                </div>
              </form>
            </div>
          ) : (
            
            // TAMPILAN 2: DAFTAR PASIEN & SEARCH
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row gap-3 justify-between items-start sm:items-center pb-3 border-b border-slate-100">
                <h3 className="font-bold text-slate-900 font-sans flex items-center gap-2.5">
                  <ClipboardList className="w-5 h-5 text-emerald-500" />
                  Kependudukan & Terdaftar Medis ({filteredPatients.length} Pasien)
                </h3>
                {/* Search Bar */}
                <div className="relative w-full sm:w-64">
                  <input
                    type="text"
                    placeholder="Cari Pasien (Nama, NIK, RM)..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full py-1.5 pl-8 pr-3 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:border-emerald-500 focus:bg-white"
                  />
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                </div>
              </div>

              {/* Table Patients */}
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm whitespace-nowrap">
                  <thead>
                    <tr className="text-slate-400 text-xs uppercase tracking-wider font-semibold bg-slate-50 rounded-xl">
                      <th className="p-3 rounded-l-lg">No. Rekam Medis / NIK</th>
                      <th className="p-3">Nama Pasien</th>
                      <th className="p-3">Info Demografi</th>
                      <th className="p-3">No HP / BPJS</th>
                      <th className="p-3 text-right rounded-r-lg">Kartu Rekam Medis</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {loading ? (
                      <tr>
                        <td colSpan={5} className="py-10 text-center text-slate-400 text-xs">Memuat data pasien...</td>
                      </tr>
                    ) : filteredPatients.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="py-14 text-center text-slate-400">
                          Tidak ditemukan pasien yang sesuai dengan kata kependudukan.
                        </td>
                      </tr>
                    ) : (
                      filteredPatients.map((pat) => (
                        <tr 
                          key={pat.id} 
                          className={`hover:bg-emerald-50/20 transition-colors group cursor-pointer ${
                            selectedPatient?.id === pat.id ? 'bg-emerald-50/30' : ''
                          }`}
                          onClick={() => { setSelectedPatient(pat); setShowAddMRForm(false); }}
                        >
                          <td className="p-3">
                            <p className="font-mono font-bold text-emerald-600 text-xs">{pat.rekam_medis_number}</p>
                            <p className="text-[10px] text-slate-400 font-mono">NIK: {pat.nik}</p>
                          </td>
                          <td className="p-3">
                            <p className="font-bold text-slate-900">{pat.name}</p>
                            <p className="text-[10px] text-slate-400">{pat.gender}</p>
                          </td>
                          <td className="p-3 text-xs text-slate-600">
                            <p>{pat.birth_date} (~{new Date().getFullYear() - parseInt(pat.birth_date.split('-')[0])} th)</p>
                            <p className="max-w-[170px] truncate text-slate-400" title={pat.address}>{pat.address}</p>
                          </td>
                          <td className="p-3 text-xs">
                            <p className="text-slate-700 font-mono">{pat.phone}</p>
                            {pat.bpjs_number ? (
                              <span className="inline-block mt-1 text-[9px] font-bold px-1.5 py-0.5 bg-emerald-50 text-emerald-600 rounded border border-emerald-100">
                                BPJS: {pat.bpjs_number}
                              </span>
                            ) : (
                              <span className="inline-block mt-1 text-[9px] font-bold px-1.5 py-0.5 bg-slate-100 text-slate-500 rounded border border-slate-200">
                                Pasien Umum
                              </span>
                            )}
                          </td>
                          <td className="p-3 text-right" onClick={(e) => e.stopPropagation()}>
                            <div className="flex justify-end gap-1.5">
                              <button
                                onClick={() => { setSelectedPatient(pat); setShowAddMRForm(false); }}
                                className="inline-flex items-center gap-1 px-2 py-1.5 text-[11px] font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-lg transition"
                                title="Lihat Rekam Medis"
                              >
                                <Eye className="w-3.5 h-3.5" />
                                <span>RM</span>
                              </button>
                              
                              <button
                                onClick={() => startEditPatient(pat)}
                                className="inline-flex items-center gap-1 px-2 py-1.5 text-[11px] font-semibold text-amber-700 bg-amber-50 hover:bg-amber-100 rounded-lg transition"
                                title="Edit Pasien"
                              >
                                <Edit className="w-3.5 h-3.5" />
                                <span>Edit</span>
                              </button>

                              {user?.role === 'admin' && (
                                <button
                                  onClick={() => handleDeleteTrigger(pat.id, pat.name)}
                                  className="inline-flex items-center gap-1 px-2 py-1.5 text-[11px] font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 rounded-lg transition"
                                  title="Hapus Pasien"
                                >
                                  <Trash className="w-3.5 h-3.5" />
                                  <span>Hapus</span>
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

        </div>

        {/* Kolom Kanan: Detail Rekam Medis (RM) Pasien Terpilih */}
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6">
          {!selectedPatient ? (
            <div className="py-24 text-center text-slate-400 space-y-3">
              <ClipboardList className="w-12 h-12 text-slate-200 mx-auto stroke-1" />
              <div className="max-w-[200px] mx-auto text-xs">
                <p className="font-semibold text-slate-700">Pemeriksaan Rekam Medis</p>
                <p className="text-slate-400 mt-1 leading-relaxed">Pilih pasien di tabel samping untuk membaca tumpukan kartu Rekam Medis (RM) atau menginput diagnosa baru.</p>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              
              {/* Header Info Pasien */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-[10px] font-mono font-bold text-emerald-600 bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded">
                      {selectedPatient.rekam_medis_number}
                    </span>
                    <h3 className="font-bold text-slate-800 text-base mt-2 font-sans">{selectedPatient.name}</h3>
                    <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                      {selectedPatient.gender}, {selectedPatient.birth_date} (~{new Date().getFullYear() - parseInt(selectedPatient.birth_date.split('-')[0])} Th)
                    </p>
                  </div>
                  <button 
                    onClick={() => setSelectedPatient(null)} 
                    className="text-xs text-slate-400 hover:text-slate-700"
                  >
                    Tutup [x]
                  </button>
                </div>
              </div>

              {/* TAMPILAN 3A: INPUT REKAM MEDIS BARU */}
              {showAddMRForm ? (
                <form onSubmit={handleSaveMedicalRecord} className="space-y-4 p-1 border-t border-slate-105 pt-2">
                  <div className="flex justify-between items-center bg-emerald-50/50 p-2 rounded-lg border border-emerald-100">
                    <span className="text-xs font-bold text-emerald-800">Catat Diagnosa Klinis</span>
                    <button 
                      type="button" 
                      onClick={() => setShowAddMRForm(false)}
                      className="text-xs text-slate-400 hover:text-emerald-700 font-semibold"
                    >
                      Batal [x]
                    </button>
                  </div>

                  {/* Dokter Pemeriksa */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Dokter Pemberi Rekomendasi</label>
                    <select
                      required
                      value={mrDoctorId}
                      onChange={(e) => setMrDoctorId(e.target.value)}
                      className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs focus:outline-none focus:border-emerald-500"
                    >
                      <option value="">-- Pilih Dokter Spesialis --</option>
                      {doctors.map(d => (
                        <option key={d.id} value={d.id}>{d.name} ({d.specialization})</option>
                      ))}
                    </select>
                  </div>

                  {/* Tanda Vital (Grid) */}
                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <label className="block text-[10px] font-semibold text-slate-400 uppercase mb-1">Tek. Darah</label>
                      <input
                        type="text"
                        placeholder="120/80"
                        value={mrBloodPressure}
                        onChange={(e) => setMrBloodPressure(e.target.value)}
                        className="w-full px-2 py-1.5 border border-slate-200 rounded-lg text-xs text-center font-mono focus:outline-none focus:border-emerald-500"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-semibold text-slate-400 uppercase mb-1">Nadi (bpm)</label>
                      <input
                        type="number"
                        placeholder="80"
                        value={mrHeartRate}
                        onChange={(e) => setMrHeartRate(e.target.value)}
                        className="w-full px-2 py-1.5 border border-slate-200 rounded-lg text-xs text-center font-mono focus:outline-none focus:border-emerald-500"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-semibold text-slate-400 uppercase mb-1">Suhu (°C)</label>
                      <input
                        type="text"
                        placeholder="36.5"
                        value={mrTemperature}
                        onChange={(e) => setMrTemperature(e.target.value)}
                        className="w-full px-2 py-1.5 border border-slate-200 rounded-lg text-xs text-center font-mono focus:outline-none focus:border-emerald-500"
                      />
                    </div>
                  </div>

                  {/* Gejala Keluhan (Anamnesa) */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Gejala (Symptoms / Anamnesa)</label>
                    <textarea
                      required
                      placeholder="Input anamnesa keluhan obyektif & subyektif..."
                      value={mrSymptoms}
                      onChange={(e) => setMrSymptoms(e.target.value)}
                      className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs focus:outline-none focus:border-emerald-500 min-h-[50px] text-slate-700"
                    ></textarea>
                  </div>

                  {/* Diagnosa Utama (Diagnosa) */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Diagnosa (Diagnosis ICD-10)</label>
                    <textarea
                      required
                      placeholder="Input kesimpulan diagnosa klinis medis..."
                      value={mrDiagnosis}
                      onChange={(e) => setMrDiagnosis(e.target.value)}
                      className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs focus:outline-none focus:border-emerald-500 min-h-[50px] text-slate-700"
                    ></textarea>
                  </div>

                  {/* Resep Apotek */}
                  <div className="border border-slate-100 p-2.5 rounded-lg space-y-2.5 bg-slate-50/50">
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Draft Resep Obat Apotek</p>
                    
                    {/* Draft Item List */}
                    {mrPrescription.length > 0 && (
                      <div className="text-[11px] text-slate-700 divide-y divide-slate-100 bg-white p-2 rounded border border-slate-150">
                        {mrPrescription.map((item, idx) => (
                          <div key={idx} className="flex justify-between items-center py-1">
                            <span>{item.name} ({item.qty} {medicines.find(m=>m.name===item.name)?.unit || 'Tablet'}) &bull; <em className="text-slate-400 font-normal">{item.dosage}</em></span>
                            <button 
                              type="button" 
                              onClick={() => handleRemovePrescriptionItem(idx)}
                              className="text-[10px] text-red-500 font-bold hover:underline"
                            >
                              Batal
                            </button>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Form Pembuatan baris resep */}
                    <div className="space-y-1.5 p-1 bg-white rounded border border-slate-100">
                      <select
                        value={selectedMedName}
                        onChange={(e) => setSelectedMedName(e.target.value)}
                        className="w-full px-2 py-1 border border-slate-150 rounded text-[11px] focus:outline-none"
                      >
                        <option value="">-- Pilih Obat Apotek --</option>
                        {medicines.map(m => (
                          <option key={m.id} value={m.name} disabled={m.stock <= 0}>
                            {m.name} ({m.stock > 0 ? `Sedia ${m.stock} ${m.unit}` : 'Habis!'})
                          </option>
                        ))}
                      </select>

                      <div className="grid grid-cols-2 gap-1.5">
                        <input
                          type="number"
                          placeholder="Qty"
                          min="1"
                          value={selectedMedQty}
                          onChange={(e) => setSelectedMedQty(e.target.value)}
                          className="px-2 py-1 border border-slate-150 rounded text-[11px] text-center"
                        />
                        <input
                          type="text"
                          placeholder="Dosis (e.g. 3x1 tablet)"
                          value={selectedMedDosage}
                          onChange={(e) => setSelectedMedDosage(e.target.value)}
                          className="px-2 py-1 border border-slate-150 rounded text-[11px] text-center"
                        />
                      </div>

                      <button
                        type="button"
                        onClick={handleAddPrescriptionItem}
                        className="w-full py-1 text-[11px] bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded"
                      >
                        + Tambah Obat ke draft
                      </button>
                    </div>
                  </div>

                  {/* Notes / Tindak Lanjut */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Catatan Tambahan / Edukasi (Notes)</label>
                    <input
                      type="text"
                      placeholder="Saran diet, istirahat, kontrol kembali..."
                      value={mrNotes}
                      onChange={(e) => setMrNotes(e.target.value)}
                      className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs focus:outline-none focus:border-emerald-500 text-slate-700"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={savingMR}
                    className="w-full py-2 bg-emerald-600 font-semibold hover:bg-emerald-700 text-white rounded-lg text-xs shadow-md transition-colors"
                  >
                    {savingMR ? 'Sedang Memproses...' : 'Simpan Rekam Medis & Terbitkan Tagihan'}
                  </button>
                </form>
              ) : (
                
                // TAMPILAN 3B: RIWAYAT REKAM MEDIS JALAN
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-bold text-slate-700 font-sans">Riwayat Kunjungan & RM ({patientRMHistory.length})</span>
                    <button
                      onClick={() => {
                        // Reset forms
                        setMrPrescription([]);
                        setShowAddMRForm(true);
                      }}
                      className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg shadow-sm"
                    >
                      + Tambah Rekam Medis
                    </button>
                  </div>

                  <div className="space-y-4.5 max-h-[420px] overflow-y-auto pr-1 space-y-4">
                    {patientRMHistory.length === 0 ? (
                      <div className="py-12 text-center text-slate-400 bg-slate-50 rounded-xl border border-dotted border-slate-200 text-xs text-slate-500">
                        Belum ada riwayat rekam klinis dokter. Klik tombol hijau diatas untuk membuat entri rekam medis pertama pasien.
                      </div>
                    ) : (
                      patientRMHistory.map((mr) => (
                        <div key={mr.id} className="p-4 rounded-xl border border-slate-100 bg-white space-y-2.5 relative shadow-xs">
                          <div className="absolute top-3 right-3 text-[10px] font-mono text-slate-400">
                            {mr.check_date}
                          </div>
                          
                          {/* Nama Dokter */}
                          <div>
                            <p className="text-[11px] uppercase tracking-wider font-bold text-slate-500">Tenaga Medis</p>
                            <p className="text-xs font-bold text-slate-800">{mr.doctor_name || 'Dokter Spesialis'}</p>
                            <p className="text-[10px] text-emerald-600 font-medium">{mr.specialization}</p>
                          </div>

                          {/* Vital Signs (Badge) */}
                          <div className="flex gap-1.5 text-[10px] bg-slate-50 p-1.5 rounded border border-slate-100 font-mono">
                            <span>TD: {mr.blood_pressure || '-'}</span> |
                            <span>Nadi: {mr.heart_rate || '-'} bpm</span> |
                            <span>Suhu: {mr.temperature || '-'} °C</span>
                          </div>

                          {/* Gejala */}
                          <div>
                            <p className="text-[10px] uppercase font-bold text-slate-400">Keluhan Utama</p>
                            <p className="text-xs font-medium text-slate-700 leading-relaxed italic">"{mr.symptoms}"</p>
                          </div>

                          {/* Diagnosa */}
                          <div>
                            <p className="text-[10px] uppercase font-bold text-slate-400">Kesimpulan Diagnosis</p>
                            <p className="text-xs font-bold text-indigo-750 text-indigo-900 leading-relaxed font-sans">{mr.diagnosis}</p>
                          </div>

                          {/* Resep Sediaan Obat */}
                          {mr.prescription && mr.prescription.length > 0 && (
                            <div className="bg-emerald-50/20 p-2 rounded border border-emerald-100/40">
                              <p className="text-[10px] uppercase font-bold text-emerald-700">Resep diberikan</p>
                              <ul className="list-disc list-inside text-xs mt-1 text-slate-700 space-y-0.5">
                                {mr.prescription.map((item, i) => (
                                  <li key={i}>
                                    {item.name} x {item.qty} &bull; <span className="font-mono text-[10px] bg-slate-100 px-1 py-0.5 text-slate-600 rounded">{item.dosage}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}

                          {/* Tindak Lanjut */}
                          {mr.notes && (
                            <div>
                              <p className="text-[10px] uppercase font-bold text-slate-400">Saran Dokter</p>
                              <p className="text-xs text-slate-600 leading-relaxed">{mr.notes}</p>
                            </div>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}

            </div>
          )}
        </div>

      </div>

      {/* Modal Edit Pasien */}
      {editingPatient && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-lg w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150 text-left">
            <div className="px-6 py-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-amber-50 rounded-xl text-amber-600 border border-amber-100">
                  <Edit className="w-5 h-5 text-amber-600" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-950 font-sans">Ubah Detail Pasien</h3>
                  <p className="text-slate-400 text-[11px] font-mono leading-tight">{editingPatient.rekam_medis_number}</p>
                </div>
              </div>
              <button 
                type="button"
                onClick={() => setEditingPatient(null)}
                className="p-1.5 hover:bg-slate-100 rounded-full text-slate-400 hover:text-slate-600 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEditPatient} className="p-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">No. NIK (KTP)</label>
                  <input
                    type="text"
                    required
                    maxLength={16}
                    value={editNik}
                    onChange={(e) => setEditNik(e.target.value.replace(/[^0-9]/g, ''))}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:border-emerald-500 focus:outline-none font-mono text-slate-800"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Nama Lengkap Pasien</label>
                  <input
                    type="text"
                    required
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:border-emerald-500 focus:outline-none font-medium text-slate-800"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Tanggal Lahir</label>
                  <input
                    type="date"
                    required
                    value={editBirthDate}
                    onChange={(e) => setEditBirthDate(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:border-emerald-500 focus:outline-none text-slate-800"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wide block">Jenis Kelamin</label>
                  <div className="flex gap-4 pt-2">
                    <label className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer">
                      <input
                        type="radio"
                        name="edit-gender"
                        checked={editGender === 'Laki-laki'}
                        onChange={() => setEditGender('Laki-laki')}
                        className="text-emerald-500"
                      />
                      Laki-laki
                    </label>
                    <label className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer">
                      <input
                        type="radio"
                        name="edit-gender"
                        checked={editGender === 'Perempuan'}
                        onChange={() => setEditGender('Perempuan')}
                        className="text-emerald-500"
                      />
                      Perempuan
                    </label>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">No. Telepon / HP</label>
                  <input
                    type="text"
                    required
                    value={editPhone}
                    onChange={(e) => setEditPhone(e.target.value.replace(/[^0-9]/g, ''))}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:border-emerald-500 focus:outline-none font-mono text-slate-800"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">No. BPJS Kesehatan (Opsional)</label>
                  <input
                    type="text"
                    value={editBpjs}
                    onChange={(e) => setEditBpjs(e.target.value.replace(/[^0-9]/g, ''))}
                    placeholder="Kosongkan jika Umum"
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:border-emerald-500 focus:outline-none font-mono text-slate-800"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Alamat Lengkap</label>
                <textarea
                  required
                  rows={2}
                  value={editAddress}
                  onChange={(e) => setEditAddress(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:border-emerald-500 focus:outline-none text-slate-700"
                ></textarea>
              </div>

              <div className="flex gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingPatient(null)}
                  className="flex-1 py-2.5 border border-slate-200 text-slate-500 hover:bg-slate-50 text-sm font-semibold rounded-xl transition cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSavingEdit}
                  className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold rounded-xl transition shadow-md shadow-emerald-600/15 cursor-pointer disabled:opacity-50"
                >
                  {isSavingEdit ? 'Menyimpan...' : 'Simpan Perubahan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}

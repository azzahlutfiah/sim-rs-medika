import React, { useState } from 'react';
import { 
  UserPlus, 
  Phone, 
  Building, 
  CheckCircle, 
  XCircle, 
  Activity, 
  UserCheck, 
  Lock,
  Edit,
  Trash,
  X,
  Calendar,
  Clock,
  Sun,
  Moon,
  Coffee,
  Sliders,
  RefreshCw,
  Search
} from 'lucide-react';
import { Doctor, WeeklySchedule } from '../types';

interface DoctorsProps {
  doctors: Doctor[];
  loading: boolean;
  user: { username: string; role: 'admin' | 'staff'; name: string; email: string } | null;
  onAddDoctor: (doctorData: Partial<Doctor>) => Promise<any>;
  onUpdateDoctorStatus: (id: number, status: 'Aktif' | 'Cuti' | 'Tidak Aktif') => Promise<void>;
  onUpdateDoctor: (id: number, doctorData: Partial<Doctor>) => Promise<void>;
  onDeleteDoctor: (id: number) => Promise<void>;
  onRefresh: () => void;
}

export default function Doctors({
  doctors,
  loading,
  user,
  onAddDoctor,
  onUpdateDoctorStatus,
  onUpdateDoctor,
  onDeleteDoctor,
  onRefresh
}: DoctorsProps) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [activeTab, setActiveTab] = useState<'list' | 'schedule'>('list');

  // State Cari & Filter untuk Daftar Dokter
  const [listSearchQuery, setListSearchQuery] = useState('');
  const [listSpecFilter, setListSpecFilter] = useState('Semua');
  const [listStatusFilter, setListStatusFilter] = useState('Semua');

  // State Jadwal Dinas Dinas Mingguan & Rotasi Shift
  const [selectedScheduleDoc, setSelectedScheduleDoc] = useState<Doctor | null>(null);
  const [selectedScheduleDay, setSelectedScheduleDay] = useState<'Senin' | 'Selasa' | 'Rabu' | 'Kamis' | 'Jumat' | 'Sabtu' | 'Minggu' | null>(null);
  const [editingShift, setEditingShift] = useState<'Pagi' | 'Siang' | 'Malam' | 'Libur'>('Pagi');
  const [editingHours, setEditingHours] = useState('08:00 - 14:00');
  const [specialUpdateLoading, setSpecialUpdateLoading] = useState(false);
  const [scheduleSearchQuery, setScheduleSearchQuery] = useState('');
  const [scheduleSpecFilter, setScheduleSpecFilter] = useState('Semua');

  // Days list Constant
  const DEFAULT_DAYS: Array<'Senin' | 'Selasa' | 'Rabu' | 'Kamis' | 'Jumat' | 'Sabtu' | 'Minggu'> = 
    ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu'];

  const getDoctorSchedule = (doc: Doctor): WeeklySchedule[] => {
    if (doc.schedule && doc.schedule.length > 0) {
      // Ensure all 7 days have objects correctly
      const scheduleMap = new Map(doc.schedule.map(s => [s.day, s]));
      return DEFAULT_DAYS.map(day => {
        if (scheduleMap.has(day)) {
          return scheduleMap.get(day)!;
        }
        // Fallback default
        return getDefaultDaySchedule(doc.id, day);
      });
    }
    return DEFAULT_DAYS.map(day => getDefaultDaySchedule(doc.id, day));
  };

  const getDefaultDaySchedule = (docId: number, day: 'Senin' | 'Selasa' | 'Rabu' | 'Kamis' | 'Jumat' | 'Sabtu' | 'Minggu'): WeeklySchedule => {
    const dayIndices: Record<string, number> = { 'Senin': 0, 'Selasa': 1, 'Rabu': 2, 'Kamis': 3, 'Jumat': 4, 'Sabtu': 5, 'Minggu': 6 };
    const idx = dayIndices[day];
    const seed = (docId + idx) % 4;
    
    let shift: 'Pagi' | 'Siang' | 'Malam' | 'Libur' = 'Pagi';
    let hours = '08:00 - 14:00';
    
    if (seed === 0) {
      shift = 'Pagi';
      hours = '08:00 - 14:00';
    } else if (seed === 1) {
      shift = 'Siang';
      hours = '14:00 - 20:00';
    } else if (seed === 2) {
      shift = 'Malam';
      hours = '20:00 - 08:00';
    } else {
      shift = 'Libur';
      hours = '-';
    }
    return { day, shift, hours };
  };

  const handleOpenScheduleEditor = (doc: Doctor, day: 'Senin' | 'Selasa' | 'Rabu' | 'Kamis' | 'Jumat' | 'Sabtu' | 'Minggu') => {
    const sList = getDoctorSchedule(doc);
    const sDay = sList.find(s => s.day === day) || getDefaultDaySchedule(doc.id, day);
    
    setSelectedScheduleDoc(doc);
    setSelectedScheduleDay(day);
    setEditingShift(sDay.shift);
    setEditingHours(sDay.shift === 'Libur' ? '-' : sDay.hours);
  };

  const handleSaveDaySchedule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedScheduleDoc || !selectedScheduleDay) return;
    
    const currentSchedule = [...getDoctorSchedule(selectedScheduleDoc)];
    const dayIdx = currentSchedule.findIndex(s => s.day === selectedScheduleDay);
    
    const newDaySchedule: WeeklySchedule = {
      day: selectedScheduleDay,
      shift: editingShift,
      hours: editingShift === 'Libur' ? '-' : editingHours
    };
    
    if (dayIdx !== -1) {
      currentSchedule[dayIdx] = newDaySchedule;
    } else {
      currentSchedule.push(newDaySchedule);
    }
    
    try {
      setSpecialUpdateLoading(true);
      await onUpdateDoctor(selectedScheduleDoc.id, {
        ...selectedScheduleDoc,
        schedule: currentSchedule
      });
      setSelectedScheduleDoc(null);
      setSelectedScheduleDay(null);
      onRefresh();
    } catch (err: any) {
      alert(err.message || 'Gagal menyimpan rotasi jadwal dinas');
    } finally {
      setSpecialUpdateLoading(false);
    }
  };

  const handleApplyQuickPreset = async (doc: Doctor, presetType: 'pola_222' | 'pagi_saja' | 'bebas_libur') => {
    let newSchedule: WeeklySchedule[] = [];
    
    if (presetType === 'pola_222') {
      newSchedule = [
        { day: 'Senin', shift: 'Pagi', hours: '08:00 - 14:00' },
        { day: 'Selasa', shift: 'Pagi', hours: '08:00 - 14:00' },
        { day: 'Rabu', shift: 'Siang', hours: '14:00 - 20:00' },
        { day: 'Kamis', shift: 'Siang', hours: '14:00 - 20:00' },
        { day: 'Jumat', shift: 'Malam', hours: '20:00 - 08:00' },
        { day: 'Sabtu', shift: 'Malam', hours: '20:00 - 08:00' },
        { day: 'Minggu', shift: 'Libur', hours: '-' },
      ];
    } else if (presetType === 'pagi_saja') {
      newSchedule = [
        { day: 'Senin', shift: 'Pagi', hours: '08:00 - 14:00' },
        { day: 'Selasa', shift: 'Pagi', hours: '08:00 - 14:00' },
        { day: 'Rabu', shift: 'Pagi', hours: '08:00 - 14:00' },
        { day: 'Kamis', shift: 'Pagi', hours: '08:00 - 14:00' },
        { day: 'Jumat', shift: 'Pagi', hours: '08:00 - 14:00' },
        { day: 'Sabtu', shift: 'Pagi', hours: '08:00 - 14:00' },
        { day: 'Minggu', shift: 'Libur', hours: '-' },
      ];
    } else {
      newSchedule = DEFAULT_DAYS.map(day => ({ day, shift: 'Libur', hours: '-' }));
    }

    try {
      setSpecialUpdateLoading(true);
      await onUpdateDoctor(doc.id, {
        ...doc,
        schedule: newSchedule
      });
      onRefresh();
      alert(`Berhasil menerapkan pola jadwal dinas cepat untuk dr. ${doc.name}!`);
    } catch (err: any) {
      alert(err.message || 'Gagal menerapkan pola rotasi cepat');
    } finally {
      setSpecialUpdateLoading(false);
    }
  };

  // Form input states
  const [docName, setDocName] = useState('');
  const [docSpecialization, setDocSpecialization] = useState('Penyakit Dalam');
  const [docContact, setDocContact] = useState('');
  const [docGender, setDocGender] = useState<'Laki-laki' | 'Perempuan'>('Laki-laki');
  const [docRoom, setDocRoom] = useState('Poli A01');
  const [submitting, setSubmitting] = useState(false);

  // States Edit Dokter
  const [editingDoctor, setEditingDoctor] = useState<Doctor | null>(null);
  const [editDocName, setEditDocName] = useState('');
  const [editDocSpecialization, setEditDocSpecialization] = useState('Penyakit Dalam');
  const [editDocContact, setEditDocContact] = useState('');
  const [editDocGender, setEditDocGender] = useState<'Laki-laki' | 'Perempuan'>('Laki-laki');
  const [editDocRoom, setEditDocRoom] = useState('Poli A01');
  const [isSavingEdit, setIsSavingEdit] = useState(false);

  const startEditDoctor = (doc: Doctor) => {
    setEditingDoctor(doc);
    setEditDocName(doc.name);
    setEditDocSpecialization(doc.specialization);
    setEditDocContact(doc.contact || '');
    setEditDocGender(doc.gender === 'Perempuan' ? 'Perempuan' : 'Laki-laki');
    setEditDocRoom(doc.room || 'Poli A01');
  };

  const handleSaveEditDoctor = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingDoctor) return;
    try {
      setIsSavingEdit(true);
      await onUpdateDoctor(editingDoctor.id, {
        name: editDocName,
        specialization: editDocSpecialization,
        contact: editDocContact,
        gender: editDocGender,
        room: editDocRoom
      });
      setEditingDoctor(null);
    } catch (err: any) {
      alert(err.message || 'Gagal memperbarui data dokter');
    } finally {
      setIsSavingEdit(false);
    }
  };

  const handleDeleteDoctorTrigger = async (id: number, name: string) => {
    if (confirm(`Apakah Anda yakin ingin menghapus data dokter: "${name}"? Tindakan ini tidak dapat dibatalkan.`)) {
      try {
        await onDeleteDoctor(id);
      } catch (err: any) {
        alert(err.message || 'Gagal menghapus data dokter');
      }
    }
  };

  const specializations = [
    'Penyakit Dalam',
    'Spesialis Anak',
    'Jantung dan Pembuluh Darah',
    'Kandungan & Kebidanan',
    'Spesialis Mata',
    'Bedah Umum',
    'THT-KL',
    'Kulit & Kelamin'
  ];

  const rooms = [
    'Poli A01', 'Poli B02', 'Poli C03', 'Poli C05', 
    'Poli D01', 'Poli E03', 'Unit Bedah 01', 'Instalasi Gawat Darurat'
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!docName || !docContact) {
      alert('Nama dan Kontak Dokter wajib diisi!');
      return;
    }

    try {
      setSubmitting(true);
      await onAddDoctor({
        name: docName,
        specialization: docSpecialization,
        contact: docContact,
        gender: docGender,
        room: docRoom,
        status: 'Aktif'
      });

      // Reset
      setDocName('');
      setDocContact('');
      setDocSpecialization('Penyakit Dalam');
      setDocRoom('Poli A01');
      setShowAddForm(false);
      onRefresh();
      alert('Dokter Spesialis Baru berhasil ditambahkan!');
    } catch (error) {
      console.error(error);
      alert('Gagal menambahkan Dokter spesialis');
    } finally {
      setSubmitting(false);
    }
  };

  const filteredDoctorsForList = doctors.filter(doc => {
    const matchName = doc.name.toLowerCase().includes(listSearchQuery.toLowerCase());
    const matchSpec = listSpecFilter === 'Semua' || doc.specialization === listSpecFilter;
    const matchStatus = listStatusFilter === 'Semua' || doc.status === listStatusFilter;
    return matchName && matchSpec && matchStatus;
  });

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex justify-between items-center bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 font-sans tracking-tight">Manajemen Jadwal & Tenaga Medis</h2>
          <p className="text-slate-500 text-sm mt-0.5">Daftar Dokter, Jadwal Poliklinik, Lokasi Praktek, & Status Kehadiran</p>
        </div>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-xl text-sm font-semibold hover:bg-emerald-700 transition shadow-md shadow-emerald-600/10"
        >
          <UserPlus className="w-4 h-4" />
          {showAddForm ? 'Tutup Formulir' : 'Tambah Dokter Spesialis'}
        </button>
      </div>

      {/* Tab Selectors */}
      <div className="flex border-b border-slate-200 shrink-0">
        <button
          id="tab-doctors-list"
          onClick={() => setActiveTab('list')}
          className={`px-5 py-3 text-xs sm:text-sm font-semibold border-b-2 transition-all cursor-pointer ${
            activeTab === 'list' 
              ? 'border-emerald-600 text-emerald-600' 
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Daftar & Profil Dokter
        </button>
        <button
          id="tab-doctors-schedule"
          onClick={() => setActiveTab('schedule')}
          className={`px-5 py-3 text-xs sm:text-sm font-semibold border-b-2 transition-all cursor-pointer flex items-center gap-2 ${
            activeTab === 'schedule' 
              ? 'border-emerald-600 text-emerald-600' 
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Calendar className="w-4 h-4 text-emerald-500" />
          Jadwal Dinas Mingguan & Rotasi Shift
        </button>
      </div>

      {activeTab === 'list' ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Kolom Kiri/Tengah: Daftar Dokter */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 lg:col-span-2 space-y-4 animate-in fade-in duration-150">
            {/* Header dengan Counter */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 pb-3 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 font-sans flex items-center gap-2">
                <UserCheck className="w-5 h-5 text-emerald-500" />
                Kehadiran Poliklinik Dokter ({filteredDoctorsForList.length} dari {doctors.length} Dokter)
              </h3>
            </div>

            {/* Pencarian dan Filter Pencari Dokter */}
            <div className="p-4 bg-slate-50/80 rounded-2xl border border-slate-150 grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Kolom 1: Nama */}
              <div className="relative">
                <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Cari nama dr..."
                  value={listSearchQuery}
                  onChange={(e) => setListSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 border border-slate-200 bg-white rounded-xl text-xs focus:outline-none focus:border-emerald-500 text-slate-800"
                />
              </div>

              {/* Kolom 2: Spesialisasi */}
              <div>
                <select
                  value={listSpecFilter}
                  onChange={(e) => setListSpecFilter(e.target.value)}
                  className="w-full px-3 py-1.5 border border-slate-200 bg-white rounded-xl text-xs focus:outline-none focus:border-emerald-500 text-slate-700 font-sans"
                >
                  <option value="Semua">Semua Spesialis/Poli</option>
                  {specializations.map((spec, i) => (
                    <option key={i} value={spec}>{spec}</option>
                  ))}
                </select>
              </div>

              {/* Kolom 3: Status Kehadiran */}
              <div>
                <select
                  value={listStatusFilter}
                  onChange={(e) => setListStatusFilter(e.target.value)}
                  className="w-full px-3 py-1.5 border border-slate-200 bg-white rounded-xl text-xs focus:outline-none focus:border-emerald-500 text-slate-700 font-sans"
                >
                  <option value="Semua">Semua Status Kehadiran</option>
                  <option value="Aktif">Aktif</option>
                  <option value="Cuti">Cuti</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 pt-1">
              {loading ? (
                <div className="col-span-2 py-12 text-center text-slate-400 text-sm">Menghubungkan data dokter...</div>
              ) : filteredDoctorsForList.length === 0 ? (
                <div className="col-span-2 py-16 text-center text-slate-400 text-sm">Tidak menemukan dokter yang sesuai dengan kriteria penelusuran.</div>
              ) : (
                filteredDoctorsForList.map((doc) => (
                  <div 
                    key={doc.id} 
                    className={`p-5 rounded-3xl border transition-all flex flex-col justify-between ${
                      doc.status === 'Aktif' 
                        ? 'bg-emerald-50/10 border-emerald-100 hover:border-emerald-200' 
                        : 'bg-slate-50 border-slate-200 opacity-75'
                    }`}
                  >
                    <div>
                      {/* Header: Name & Gender Badge */}
                      <div className="flex justify-between items-start gap-2">
                        <div>
                          <h4 className="font-bold text-slate-900 text-sm">{doc.name}</h4>
                          <p className="text-emerald-600 text-xs font-semibold mt-0.5">{doc.specialization}</p>
                        </div>
                        <span className={`inline-block px-2 py-0.5 text-[9px] uppercase font-bold rounded-md ${
                          doc.status === 'Aktif' 
                            ? 'bg-emerald-100 text-emerald-700' 
                            : 'bg-slate-200 text-slate-600'
                        }`}>
                          {doc.status}
                        </span>
                      </div>

                      {/* Info Contact */}
                      <div className="mt-4 space-y-2 text-xs text-slate-600 border-t border-slate-100 pt-3">
                        <div className="flex items-center gap-2">
                          <Building className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span className="font-medium text-slate-800">{doc.room}</span>
                        </div>
                        <div className="flex items-center gap-2 font-mono">
                          <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span>{doc.contact}</span>
                        </div>
                        <div className="text-[10px] text-slate-400">
                          Gender: {doc.gender}
                        </div>
                      </div>
                    </div>

                    {/* Actions Toggle Kehadiran */}
                    <div className="mt-5 pt-3 border-t border-slate-100 flex gap-1.5 justify-end items-center flex-wrap">
                      <button
                        onClick={() => startEditDoctor(doc)}
                        className="px-2.5 py-1.5 text-[10px] uppercase font-bold text-sky-700 bg-sky-50 hover:bg-sky-100 rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
                        title="Ubah Profil Dokter"
                      >
                        <Edit className="w-3 h-3" />
                        Edit
                      </button>

                      {user?.role === 'admin' && (
                        <button
                          onClick={() => handleDeleteDoctorTrigger(doc.id, doc.name)}
                          className="px-2.5 py-1.5 text-[10px] uppercase font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
                          title="Hapus Dokter dari RS"
                        >
                          <Trash className="w-3 h-3" />
                          Hapus
                        </button>
                      )}

                      <div className="h-4 w-px bg-slate-200 mx-0.5"></div>

                      {doc.status === 'Aktif' ? (
                        <button
                          onClick={() => onUpdateDoctorStatus(doc.id, 'Cuti')}
                          className="px-2.5 py-1.5 text-[10px] uppercase tracking-wider font-bold text-amber-700 bg-amber-50 hover:bg-amber-100 rounded-lg transition-colors flex items-center gap-1.5"
                        >
                          <XCircle className="w-3.5 h-3.5" />
                          Set Cuti
                        </button>
                      ) : (
                        <button
                          onClick={() => onUpdateDoctorStatus(doc.id, 'Aktif')}
                          className="px-2.5 py-1.5 text-[10px] uppercase tracking-wider font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-lg transition-colors flex items-center gap-1.5"
                        >
                          <CheckCircle className="w-3.5 h-3.5" />
                          Set Aktif
                        </button>
                      )}
                    </div>

                  </div>
                ))
              )}
            </div>
          </div>

          {/* Kolom Kanan: Tambah / Petunjuk */}
          <div className="space-y-6">
            {showAddForm ? (
              <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
                <h3 className="font-bold text-slate-900 border-b border-slate-100 pb-3 flex items-center gap-2">
                  <UserPlus className="w-5 h-5 text-emerald-500" />
                  Tambah Dokter Baru
                </h3>

                <form onSubmit={handleSubmit} className="space-y-4">
                  {/* Nama Dokter */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Nama Lengkap Dokter</label>
                    <input
                      type="text"
                      required
                      placeholder="Contoh: dr. Bambang, Sp.B"
                      value={docName}
                      onChange={(e) => setDocName(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-emerald-500 text-slate-800"
                    />
                  </div>

                  {/* Spesialisasi */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Spesialisasi (Poliklinik)</label>
                    <select
                      value={docSpecialization}
                      onChange={(e) => setDocSpecialization(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-emerald-500"
                    >
                      {specializations.map((spec, i) => (
                        <option key={i} value={spec}>{spec}</option>
                      ))}
                    </select>
                  </div>

                  {/* No Kontak */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">No Kontak Tlp</label>
                    <input
                      type="text"
                      required
                      placeholder="Contoh: 0812345xxxxx"
                      value={docContact}
                      onChange={(e) => setDocContact(e.target.value.replace(/[^0-9]/g, ''))}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-emerald-500 font-mono"
                    />
                  </div>

                  {/* Gender */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Jenis Kelamin</label>
                    <div className="flex gap-4 pt-1 text-sm text-slate-700">
                      <label className="flex items-center gap-1.5 cursor-pointer">
                        <input
                          type="radio"
                          checked={docGender === 'Laki-laki'}
                          onChange={() => setDocGender('Laki-laki')}
                        />
                        Laki-laki
                      </label>
                      <label className="flex items-center gap-1.5 cursor-pointer">
                        <input
                          type="radio"
                          checked={docGender === 'Perempuan'}
                          onChange={() => setDocGender('Perempuan')}
                        />
                        Perempuan
                      </label>
                    </div>
                  </div>

                  {/* Ruang Praktek */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Alokasi Ruang / Poli</label>
                    <select
                      value={docRoom}
                      onChange={(e) => setDocRoom(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-emerald-500"
                    >
                      {rooms.map((room, i) => (
                        <option key={i} value={room}>{room}</option>
                      ))}
                    </select>
                  </div>

                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-semibold shadow-md shadow-emerald-500/10 transition-colors"
                  >
                    {submitting ? 'Sedang Mendaftarkan...' : 'Daftarkan Dokter'}
                  </button>
                </form>
              </div>
            ) : (
              <div className="bg-slate-900 text-white p-6 rounded-3xl border border-slate-800 space-y-4 animate-in fade-in duration-150">
                <h4 className="font-semibold text-sm">Ketentuan Poliklinik</h4>
                <p className="text-slate-400 text-xs leading-relaxed">
                  Status dokter mempengaruhi penawaran poliklinik di pendaftaran pasien. Ketika seorang dokter berstatus <strong className="text-amber-400">Cuti</strong>:
                </p>
                <ul className="list-disc list-inside text-[11px] text-slate-400 leading-normal space-y-1">
                  <li>Dokter tidak akan muncul dalam menu dropdown "Pendaftaran Antrean Baru".</li>
                  <li>Pasien kunjungan darurat (IGD) tetap dapat dilayani melalui koordinasi ruang jaga.</li>
                  <li>Anda dapat mendaftarkan kembali kehadiran dokter dengan menekan tombol <strong className="text-emerald-400">Set Aktif</strong>.</li>
                </ul>
              </div>
            )}
          </div>

        </div>
      ) : (
        <div className="space-y-6 animate-in fade-in duration-150 text-left">
          {/* Schedule Statistics Row */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
              <div className="text-slate-400 text-xs font-mono font-bold uppercase">Total Sesi Dinas</div>
              <div className="text-2xl font-extrabold text-slate-900 tracking-tight mt-1 flex items-baseline gap-1">
                {(() => {
                  let activeCount = 0;
                  doctors.forEach(doc => {
                    getDoctorSchedule(doc).forEach(s => {
                      if (s.shift !== 'Libur') activeCount++;
                    });
                  });
                  return activeCount;
                })()}
                <span className="text-[10px] text-slate-400 font-normal">Aktif / Minggu</span>
              </div>
            </div>
            
            <div className="bg-teal-50/10 p-4 rounded-2xl border border-teal-100">
              <div className="text-teal-600 text-xs font-mono font-bold uppercase flex items-center gap-1">
                <Sun className="w-3.5 h-3.5" />
                Shift Pagi
              </div>
              <div className="text-2xl font-extrabold text-teal-800 tracking-tight mt-1">
                {(() => {
                  let count = 0;
                  doctors.forEach(doc => {
                    getDoctorSchedule(doc).forEach(s => {
                      if (s.shift === 'Pagi') count++;
                    });
                  });
                  return count;
                })()}
                <span className="text-xs text-teal-600 font-normal ml-1">Sesi</span>
              </div>
            </div>

            <div className="bg-amber-50/10 p-4 rounded-2xl border border-amber-100">
              <div className="text-amber-700 text-xs font-mono font-bold uppercase flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" />
                Shift Siang
              </div>
              <div className="text-2xl font-extrabold text-amber-800 tracking-tight mt-1">
                {(() => {
                  let count = 0;
                  doctors.forEach(doc => {
                    getDoctorSchedule(doc).forEach(s => {
                      if (s.shift === 'Siang') count++;
                    });
                  });
                  return count;
                })()}
                <span className="text-xs text-amber-700 font-normal ml-1">Sesi</span>
              </div>
            </div>

            <div className="bg-indigo-50/10 p-4 rounded-2xl border border-indigo-100">
              <div className="text-indigo-600 text-xs font-mono font-bold uppercase flex items-center gap-1">
                <Moon className="w-3.5 h-3.5" />
                Shift Malam
              </div>
              <div className="text-2xl font-extrabold text-indigo-800 tracking-tight mt-1">
                {(() => {
                  let count = 0;
                  doctors.forEach(doc => {
                    getDoctorSchedule(doc).forEach(s => {
                      if (s.shift === 'Malam') count++;
                    });
                  });
                  return count;
                })()}
                <span className="text-xs text-indigo-600 font-normal ml-1">Sesi (Jaga)</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 space-y-6">
            
            {/* Search and Filters for Schedule */}
            <div className="flex flex-col md:flex-row justify-between gap-4 items-start md:items-center">
              <div>
                <h3 className="font-bold text-slate-900 font-sans flex items-center gap-2">
                  <Sliders className="w-5 h-5 text-emerald-500" />
                  Pengaturan Rotasi & Jam Dinas Mingguan
                </h3>
                <p className="text-xs text-slate-500">Klik pada kotak hari dokter untuk memodifikasi shift dan jam tugas secara individual.</p>
              </div>

              <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
                {/* Search */}
                <input 
                  type="text" 
                  placeholder="Cari dr..." 
                  value={scheduleSearchQuery}
                  onChange={(e) => setScheduleSearchQuery(e.target.value)}
                  className="px-3 py-1.5 border border-slate-200 rounded-xl text-xs w-full sm:w-40 focus:outline-none focus:border-emerald-500"
                />

                {/* Spec Filter */}
                <select
                  value={scheduleSpecFilter}
                  onChange={(e) => setScheduleSpecFilter(e.target.value)}
                  className="px-3 py-1.5 border border-slate-200 bg-white rounded-xl text-xs focus:outline-none"
                >
                  <option value="Semua">Semua Spesialis</option>
                  {specializations.map((spec, i) => (
                    <option key={i} value={spec}>{spec}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Timetable Grid View */}
            <div className="overflow-x-auto border border-slate-100 rounded-2xl">
              <table className="w-full text-left border-collapse min-w-[900px]">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-250 select-none text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                    <th className="p-4 w-40">Dokter Spesialis / Poli</th>
                    {DEFAULT_DAYS.map(day => (
                      <th key={day} className="p-3 text-center">{day}</th>
                    ))}
                    <th className="p-4 text-center w-48">Rotasi Cepat</th>
                  </tr>
                </thead>
                <tbody>
                  {doctors.filter(d => {
                    const matchQ = d.name.toLowerCase().includes(scheduleSearchQuery.toLowerCase());
                    const matchF = scheduleSpecFilter === 'Semua' || d.specialization === scheduleSpecFilter;
                    return matchQ && matchF;
                  }).length === 0 ? (
                    <tr>
                      <td colSpan={9} className="py-16 text-center text-slate-400 text-sm">
                        Menyesuaikan kriteria filter... Tidak ada dokter yang cocok.
                      </td>
                    </tr>
                  ) : (
                    doctors.filter(d => {
                      const matchQ = d.name.toLowerCase().includes(scheduleSearchQuery.toLowerCase());
                      const matchF = scheduleSpecFilter === 'Semua' || d.specialization === scheduleSpecFilter;
                      return matchQ && matchF;
                    }).map((doc) => {
                      const sched = getDoctorSchedule(doc);
                      return (
                        <tr key={doc.id} className="border-b border-slate-100 hover:bg-slate-50/30 transition-colors">
                          {/* Doctor info */}
                          <td className="p-4 align-middle">
                            <div className="font-bold text-slate-900 text-sm">{doc.name}</div>
                            <div className="text-emerald-600 text-xs font-semibold mt-0.5">{doc.specialization}</div>
                            <div className="text-[10px] text-slate-400 font-mono mt-1">{doc.room}</div>
                          </td>

                          {/* Days loop */}
                          {DEFAULT_DAYS.map((day) => {
                            const daySched = sched.find(s => s.day === day) || getDefaultDaySchedule(doc.id, day);
                            const isPagi = daySched.shift === 'Pagi';
                            const isSiang = daySched.shift === 'Siang';
                            const isMalam = daySched.shift === 'Malam';
                            const isLibur = daySched.shift === 'Libur';

                            return (
                              <td 
                                key={day}
                                onClick={() => handleOpenScheduleEditor(doc, day)}
                                className="p-2.5 align-middle select-none transition-colors duration-150 hover:bg-slate-50 cursor-pointer"
                              >
                                <div className="flex flex-col items-center justify-center p-2 rounded-xl border border-transparent hover:border-slate-250 hover:bg-white hover:shadow-xs transition duration-150 gap-1 min-h-[56px]">
                                  {isPagi && (
                                    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 text-[9px] font-bold text-teal-700 bg-teal-50 rounded-md">
                                      <Sun className="w-2.5 h-2.5 text-teal-600 shrink-0" />
                                      Pagi
                                    </span>
                                  )}
                                  {isSiang && (
                                    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 text-[9px] font-bold text-amber-700 bg-amber-50 rounded-md">
                                      <Clock className="w-2.5 h-2.5 text-amber-600 shrink-0" />
                                      Siang
                                    </span>
                                  )}
                                  {isMalam && (
                                    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 text-[9px] font-bold text-indigo-700 bg-indigo-50 rounded-md">
                                      <Moon className="w-2.5 h-2.5 text-indigo-600 shrink-0" />
                                      Malam
                                    </span>
                                  )}
                                  {isLibur && (
                                    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 text-[9px] font-medium text-slate-500 bg-slate-100 rounded-md">
                                      <Coffee className="w-2.5 h-2.5 text-slate-450 shrink-0" />
                                      Libur
                                    </span>
                                  )}
                                  <span className="text-[9px] text-slate-400 font-mono mt-0.5">
                                    {daySched.hours}
                                  </span>
                                </div>
                              </td>
                            );
                          })}

                          {/* Quick Preset Buttons */}
                          <td className="p-4 align-middle text-center" onClick={(e) => e.stopPropagation()}>
                            <div className="flex items-center justify-center gap-1.5 flex-wrap">
                              <button
                                onClick={() => handleApplyQuickPreset(doc, 'pola_222')}
                                className="px-1.5 py-1 text-[9px] uppercase font-bold text-emerald-800 bg-emerald-55 cursor-pointer bg-emerald-50 hover:bg-emerald-100 rounded transition-all"
                                title="2 Hari Pagi, 2 Hari Siang, 2 Hari Malam, 1 Hari Libur"
                              >
                                Pola 222
                              </button>
                              <button
                                onClick={() => handleApplyQuickPreset(doc, 'pagi_saja')}
                                className="px-1.5 py-1 text-[9px] uppercase font-bold text-sky-800 bg-sky-50 cursor-pointer hover:bg-sky-100 rounded transition-all"
                                title="Pagi Penuh Senin - Sabtu"
                              >
                                Pagi
                              </button>
                              <button
                                onClick={() => handleApplyQuickPreset(doc, 'bebas_libur')}
                                className="px-1.5 py-1 text-[9px] uppercase font-bold text-slate-600 bg-slate-100 cursor-pointer hover:bg-slate-200 rounded transition-all"
                                title="Set Libur Seluruh Hari"
                              >
                                Libur
                              </button>
                            </div>
                          </td>

                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            <div className="p-4 bg-slate-900 text-slate-300 rounded-2xl text-xs space-y-1">
              <p className="font-semibold text-slate-200 flex items-center gap-1">
                <Activity className="w-3.5 h-3.5 text-emerald-400" />
                Catatan Operasional Roster Shift RS Medika
              </p>
              <p className="leading-relaxed">
                Roster shift dihitung mandiri setiap minggunya. Mengubah jadwal hari tertentu akan langsung memperbarui jam tugas pendaftaran poliklinik dan kehadiran dokter saat diakses oleh staf loket bagian antrean (Appointments).
              </p>
            </div>

          </div>
        </div>
      )}

      {/* Modal Edit Shift Hari Tertentu */}
      {selectedScheduleDoc && selectedScheduleDay && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-sm w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150 text-left">
            <div className="px-6 py-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-emerald-50 rounded-xl text-emerald-600 border border-emerald-100">
                  <Calendar className="w-5 h-5 text-emerald-600" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-950 font-sans text-sm">Update Shift Dinas</h3>
                  <p className="text-slate-400 text-xs mt-0.5">{selectedScheduleDoc.name} • {selectedScheduleDay}</p>
                </div>
              </div>
              <button 
                type="button"
                onClick={() => {
                  setSelectedScheduleDoc(null);
                  setSelectedScheduleDay(null);
                }}
                className="p-1.5 hover:bg-slate-100 rounded-full text-slate-400 hover:text-slate-600 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveDaySchedule} className="p-6 space-y-5">
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wide block">Pilih Shift Kerja</label>
                
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { value: 'Pagi', label: 'Pagi', desc: '08:00 - 14:00', icon: Sun },
                    { value: 'Siang', label: 'Siang', desc: '14:00 - 20:00', icon: Clock },
                    { value: 'Malam', label: 'Malam', desc: '20:00 - 08:00', icon: Moon },
                    { value: 'Libur', label: 'Libur', desc: 'Bebas Dinas', icon: Coffee }
                  ].map((sOption) => {
                    const SIcon = sOption.icon;
                    const isOptSelected = editingShift === sOption.value;
                    return (
                      <button
                        key={sOption.value}
                        type="button"
                        onClick={() => {
                          setEditingShift(sOption.value as any);
                          if (sOption.value === 'Libur') {
                            setEditingHours('-');
                          } else {
                            setEditingHours(sOption.desc);
                          }
                        }}
                        className={`flex flex-col items-center justify-center p-3 rounded-2xl border text-center transition cursor-pointer ${
                          isOptSelected 
                            ? 'border-emerald-500 ring-2 ring-emerald-500/20 bg-emerald-55 bg-emerald-50/30' 
                            : 'border-slate-200 bg-white hover:bg-slate-50'
                        }`}
                      >
                        <SIcon className={`w-5 h-5 ${isOptSelected ? 'text-emerald-600' : 'text-slate-400'}`} />
                        <div className="font-bold text-xs mt-1 text-slate-800">{sOption.label}</div>
                        <div className="text-[10px] text-slate-400 font-mono mt-0.5">{sOption.desc}</div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {editingShift !== 'Libur' && (
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wide block">Waktu / Jam Kerja Spesifik</label>
                  <input
                    type="text"
                    required
                    value={editingHours}
                    onChange={(e) => setEditingHours(e.target.value)}
                    placeholder="Contoh: 08:00 - 14:00"
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:border-emerald-500 focus:outline-none font-mono text-slate-800"
                  />
                </div>
              )}

              <div className="flex gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => {
                    setSelectedScheduleDoc(null);
                    setSelectedScheduleDay(null);
                  }}
                  className="flex-1 py-2.5 border border-slate-200 text-slate-500 hover:bg-slate-50 text-xs font-semibold rounded-xl transition cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={specialUpdateLoading}
                  className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-xl transition shadow-md shadow-emerald-600/15 cursor-pointer disabled:opacity-50"
                >
                  {specialUpdateLoading ? 'Menyimpan...' : 'Simpan Roster'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Edit Dokter */}
      {editingDoctor && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-md w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150 text-left">
            <div className="px-6 py-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-amber-50 rounded-xl text-amber-600 border border-amber-100">
                  <Edit className="w-5 h-5 text-amber-600" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-950 font-sans">Ubah Detail Dokter</h3>
                  <p className="text-slate-400 text-xs mt-0.5">Edit profil dan alokasi ruang medis</p>
                </div>
              </div>
              <button 
                type="button"
                onClick={() => setEditingDoctor(null)}
                className="p-1.5 hover:bg-slate-100 rounded-full text-slate-400 hover:text-slate-600 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEditDoctor} className="p-6 space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Nama Lengkap Dokter</label>
                <input
                  type="text"
                  required
                  value={editDocName}
                  onChange={(e) => setEditDocName(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:border-emerald-500 focus:outline-none font-medium text-slate-800"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Spesialisasi (Poliklinik)</label>
                <select
                  value={editDocSpecialization}
                  onChange={(e) => setEditDocSpecialization(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 bg-white rounded-xl text-sm focus:border-emerald-500 focus:outline-none text-slate-800"
                >
                  {specializations.map((spec, i) => (
                    <option key={i} value={spec}>{spec}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">No. Kontak / HP</label>
                <input
                  type="text"
                  required
                  value={editDocContact}
                  onChange={(e) => setEditDocContact(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:border-emerald-500 focus:outline-none font-mono text-slate-800"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wide block">Jenis Kelamin</label>
                <div className="flex gap-4 pt-1">
                  <label className="flex items-center gap-1.5 cursor-pointer text-sm text-slate-700">
                    <input
                      type="radio"
                      name="edit-doc-gender"
                      checked={editDocGender === 'Laki-laki'}
                      onChange={() => setEditDocGender('Laki-laki')}
                      className="text-emerald-500"
                    />
                    Laki-laki
                  </label>
                  <label className="flex items-center gap-1.5 cursor-pointer text-sm text-slate-700">
                    <input
                      type="radio"
                      name="edit-doc-gender"
                      checked={editDocGender === 'Perempuan'}
                      onChange={() => setEditDocGender('Perempuan')}
                      className="text-emerald-500"
                    />
                    Perempuan
                  </label>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Alokasi Ruang / Poli</label>
                <select
                  value={editDocRoom}
                  onChange={(e) => setEditDocRoom(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 bg-white rounded-xl text-sm focus:border-emerald-500 focus:outline-none text-slate-800"
                >
                  {rooms.map((room, i) => (
                    <option key={i} value={room}>{room}</option>
                  ))}
                </select>
              </div>

              <div className="flex gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingDoctor(null)}
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

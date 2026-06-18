import React, { useState, useEffect } from 'react';
import { 
  Users, 
  UserCheck, 
  Calendar, 
  Clock, 
  TrendingUp, 
  AlertTriangle,
  Plus,
  Stethoscope,
  ChevronRight,
  ClipboardList,
  Trash,
  Printer,
  ScanLine,
  CheckCircle2,
  Volume2
} from 'lucide-react';
import { Doctor, Patient, Appointment, HospitalStats, Billing } from '../types';
import { getBarcodeSvg } from '../utils/barcode';

interface DashboardProps {
  stats: HospitalStats;
  doctors: Doctor[];
  patients: Patient[];
  appointments: Appointment[];
  billingList: Billing[];
  loading: boolean;
  user: { username: string; role: 'admin' | 'staff'; name: string; email: string } | null;
  onRefresh: () => void;
  onAddAppointment: (appointmentData: Partial<Appointment>) => Promise<any>;
  onUpdateAppointmentStatus: (id: number, status: 'Menunggu' | 'Diperiksa' | 'Selesai' | 'Batal') => Promise<void>;
  onUpdateAppointment: (id: number, appointmentData: Partial<Appointment>) => Promise<void>;
  onDeleteAppointment: (id: number) => Promise<void>;
}

export default function Dashboard({
  stats,
  doctors,
  patients,
  appointments,
  billingList,
  loading,
  user,
  onRefresh,
  onAddAppointment,
  onUpdateAppointmentStatus,
  onUpdateAppointment,
  onDeleteAppointment
}: DashboardProps) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [selectedPatientId, setSelectedPatientId] = useState('');
  const [selectedDoctorId, setSelectedDoctorId] = useState('');
  const [appointmentTime, setAppointmentTime] = useState('09:00 - 10:00');
  const [complaint, setComplaint] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // States untuk Barcode Scanner & Pendaftaran Integrasi Antrean
  const [scanQuery, setScanQuery] = useState('');
  const [scanResult, setScanResult] = useState<{
    patient: Patient;
    appointment: Appointment | null;
  } | null>(null);
  const [scanError, setScanError] = useState('');
  const [beepActive, setBeepActive] = useState(false);

  // Fungsi untuk simulasi bunyi beep alat scan kasir / loket
  const triggerBeepSound = () => {
    setBeepActive(true);
    setTimeout(() => setBeepActive(false), 250);
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();
      oscillator.connect(gainNode);
      gainNode.connect(audioCtx.destination);
      oscillator.type = 'sine';
      oscillator.frequency.value = 880; // High tone beep
      gainNode.gain.setValueAtTime(0.1, audioCtx.currentTime);
      oscillator.start();
      oscillator.stop(audioCtx.currentTime + 0.15);
    } catch (e) {
      console.log('Web Audio Beep not supported or blocked by browser');
    }
  };

  const handleBarcodeScanSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setScanError('');
    setScanResult(null);

    if (!scanQuery.trim()) {
      setScanError('Input nomor barcode kosong!');
      return;
    }

    const query = scanQuery.trim().toUpperCase();
    
    // Cari pasien dengan No RM (Rekam Medis) atau NIK
    const foundPatient = patients.find(
      p => p.rekam_medis_number.toUpperCase() === query || 
           p.rekam_medis_number.replace(/[^A-Z0-9]/gi, '').toUpperCase() === query.replace(/[^A-Z0-9]/gi, '').toUpperCase() ||
           p.nik === query
    );

    if (!foundPatient) {
      setScanError(`Pasien dengan Kode RM/NIK "${scanQuery}" tidak ditemukan.`);
      setScanQuery('');
      return;
    }

    // Cari antrean aktif hari ini jika ada
    const todayStr = new Date().toISOString().split('T')[0];
    const foundAppointment = appointments.find(
      app => app.patient_id === foundPatient.id && 
             app.appointment_date === todayStr && 
             app.status !== 'Batal'
    ) || null;

    triggerBeepSound();
    setScanResult({
      patient: foundPatient,
      appointment: foundAppointment
    });
    setScanQuery(''); // Clear input for next rapid scan
  };

  const handlePrintQueueTicket = (app: Appointment) => {
    const printWindow = window.open('', '_blank', 'width=450,height=610');
    if (!printWindow) {
      alert('Gagal membuka jendela cetak. Izinkan pop-up browser Anda.');
      return;
    }

    const barcodeSvgMarkup = getBarcodeSvg(app.rekam_medis_number);

    const html = `
      <html>
      <head>
        <title>Tiket Antrean SIM RS - No ${app.queue_number}</title>
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800&family=JetBrains+Mono:wght@700&display=swap" rel="stylesheet">
        <style>
          body {
            font-family: 'Inter', sans-serif;
            color: #0f172a;
            padding: 30px;
            margin: 0;
            background-color: #ffffff;
            text-align: center;
          }
          .ticket-card {
            border: 2px dashed #94a3b8;
            padding: 20px;
            border-radius: 16px;
            max-width: 320px;
            margin: 0 auto;
            box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.05);
          }
          .clinic-name {
            font-size: 16px;
            font-weight: 800;
            text-transform: uppercase;
            letter-spacing: 1px;
            color: #059669;
          }
          .sub {
            font-size: 10px;
            color: #64748b;
            margin-top: 2px;
          }
          .divider {
            border-top: 1px dashed #cbd5e1;
            margin: 15px 0;
          }
          .queue-title {
            font-size: 11px;
            font-weight: 600;
            color: #475569;
            text-transform: uppercase;
            letter-spacing: 1.5px;
          }
          .queue-num {
            font-size: 64px;
            font-weight: 900;
            color: #0f172a;
            margin: 5px 0;
            line-height: 1;
            font-family: 'JetBrains Mono', monospace;
          }
          .patient-info {
            font-size: 14px;
            font-weight: 700;
            color: #1e293b;
            margin-top: 10px;
          }
          .rm-num {
            font-size: 12px;
            font-family: 'JetBrains Mono', monospace;
            color: #059669;
            font-weight: 700;
            margin: 2px 0 10px 0;
          }
          .doc-info {
            font-size: 11px;
            color: #475569;
            background: #f8fafc;
            padding: 8px;
            border-radius: 8px;
            margin-bottom: 15px;
            border: 1px solid #f1f5f9;
          }
          .barcode-container {
            margin: 15px auto;
            width: 220px;
            height: auto;
          }
          .footer-note {
            font-size: 9px;
            color: #94a3b8;
            margin-top: 15px;
            line-height: 1.4;
          }
          @media print {
            body { padding: 0; }
            .ticket-card { border: none; padding: 10px; box-shadow: none; }
            button { display: none; }
          }
        </style>
      </head>
      <body>
        <div class="ticket-card">
          <div class="clinic-name">Klinik Pratama SIM Medika</div>
          <div class="sub">Poliklinik Terpadu & Layanan Unggulan BPJS</div>
          <div class="divider"></div>
          
          <div class="queue-title">Nomor Antrean Poliklinik</div>
          <div class="queue-num">${app.queue_number}</div>
          
          <div class="patient-info">${app.patient_name}</div>
          <div class="rm-num">${app.rekam_medis_number}</div>
          
          <div class="doc-info">
            <strong>${app.doctor_name}</strong><br>
            Poliklinik ${app.specialization}
          </div>

          <div class="divider"></div>
          <div class="barcode-container">
            ${barcodeSvgMarkup}
            <div style="font-family:'JetBrains Mono',monospace;font-size:11px;margin-top:5px;font-weight:bold;letter-spacing:1px">${app.rekam_medis_number}</div>
          </div>
          
          <div class="divider"></div>
          <div class="sub">Antrean Cetak: ${new Date().toLocaleString('id-ID')}</div>
          <div class="footer-note">Simpan tiket cetakan ini dengan baik.<br/>Arahkan lembar kertas barcode ke laser scanner alat scan untuk integrasi sistem otomatis.</div>
        </div>
        
        <div style="margin-top: 25px; text-align: center;">
          <button onclick="window.print()" style="padding: 10px 20px; background: #059669; color: white; border: none; border-radius: 8px; font-weight: bold; cursor: pointer;">
            Cetak Tiket (Print / PDF)
          </button>
        </div>
        
        <script>
          window.onload = function() {
            setTimeout(function() {
              window.print();
            }, 600);
          }
        </script>
      </body>
      </html>
    `;

    printWindow.document.write(html);
    printWindow.document.close();
  };

  // Helper to format year-month to Indonesian
  const formatYearMonth = (ym: string) => {
    const [year, month] = ym.split('-');
    const mIndex = parseInt(month, 10) - 1;
    const monthNames = [
      'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
      'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
    ];
    return `${monthNames[mIndex] || 'Bulan'} ${year}`;
  };

  const getAvailableMonths = () => {
    const monthsSet = new Set<string>();
    
    // Extract from appointments
    appointments.forEach(app => {
      if (app.appointment_date && app.appointment_date.length >= 7) {
        monthsSet.add(app.appointment_date.substring(0, 7));
      }
    });

    // Extract from billing
    billingList.forEach(bill => {
      if (bill.billing_date && bill.billing_date.length >= 7) {
        monthsSet.add(bill.billing_date.substring(0, 7));
      }
    });

    // If empty, add current month
    if (monthsSet.size === 0) {
      monthsSet.add(new Date().toISOString().substring(0, 7));
    }

    // Sort descending (newest first)
    return Array.from(monthsSet).sort().reverse();
  };

  const calculateMonthlyPerformance = (yearMonth: string) => {
    // Visits: count appointments in this month
    const monthlyAppointments = appointments.filter(app => 
      app.appointment_date && app.appointment_date.startsWith(yearMonth) && app.status !== 'Batal'
    );
    const totalVisits = monthlyAppointments.length;

    // Active patients: unique patients in this month's appointments OR billings
    const activePatientIds = new Set<number>();
    monthlyAppointments.forEach(app => activePatientIds.add(app.patient_id));
    
    const monthlyBillings = billingList.filter(bill => 
      bill.billing_date && bill.billing_date.startsWith(yearMonth)
    );
    monthlyBillings.forEach(bill => activePatientIds.add(bill.patient_id));
    
    const activePatientsCount = activePatientIds.size;

    // Revenue: sum of total_amount of Lunas billings in this month
    const lunasBillings = monthlyBillings.filter(bill => bill.status === 'Lunas');
    const revenueLunas = lunasBillings.reduce((sum, bill) => sum + (bill.total_amount || 0), 0);

    // Total invoiced: sum of all billings in this month
    const totalInvoiced = monthlyBillings.reduce((sum, bill) => sum + (bill.total_amount || 0), 0);

    // Doctor fees sum, medicine fee sum, facility fee sum
    const doctorFees = monthlyBillings.reduce((sum, bill) => sum + (bill.doctor_fee || 0), 0);
    const medicineFees = monthlyBillings.reduce((sum, bill) => sum + (bill.medicine_fee || 0), 0);
    const facilityFees = monthlyBillings.reduce((sum, bill) => sum + (bill.facility_fee || 0), 0);

    // Completed vs Waiting status counts
    const statusCounts = {
      Selesai: monthlyAppointments.filter(app => app.status === 'Selesai').length,
      Diperiksa: monthlyAppointments.filter(app => app.status === 'Diperiksa').length,
      Menunggu: monthlyAppointments.filter(app => app.status === 'Menunggu').length,
    };

    return {
      totalVisits,
      activePatientsCount,
      revenueLunas,
      totalInvoiced,
      doctorFees,
      medicineFees,
      facilityFees,
      statusCounts,
      appointments: monthlyAppointments,
      billings: monthlyBillings
    };
  };

  const handleExportPerformancePDF = (ym: string) => {
    const data = calculateMonthlyPerformance(ym);
    const monthText = formatYearMonth(ym);
    const printWindow = window.open('', '_blank', 'width=950,height=850');
    if (!printWindow) {
      alert('Gagal membuka jendela cetak. Izinkan pop-up browser Anda.');
      return;
    }

    const formatIDR = (val: number) => {
      return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(val);
    };

    const totalFees = data.doctorFees + data.medicineFees + data.facilityFees || 1;
    const docPercent = Math.round((data.doctorFees / totalFees) * 100);
    const medPercent = Math.round((data.medicineFees / totalFees) * 100);
    const facPercent = 100 - docPercent - medPercent;

    const html = `
      <html>
      <head>
        <title>Laporan Kinerja Bulanan - ${monthText}</title>
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=JetBrains+Mono:wght@500;700&display=swap" rel="stylesheet">
        <style>
          body {
            font-family: 'Inter', sans-serif;
            color: #1e293b;
            line-height: 1.5;
            padding: 40px;
            margin: 0;
            background-color: #ffffff;
          }
          .header-container {
            display: flex;
            justify-content: space-between;
            align-items: center;
            border-bottom: 3px double #cbd5e1;
            padding-bottom: 20px;
            margin-bottom: 25px;
          }
          .header-logo {
            display: flex;
            align-items: center;
            gap: 12px;
          }
          .logo-box {
            width: 44px;
            height: 44px;
            background-color: #059669;
            color: white;
            border-radius: 10px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 24px;
            font-weight: 800;
          }
          .hospital-title {
            font-size: 20px;
            font-weight: 800;
            color: #0f172a;
            margin: 0;
            line-height: 1.2;
          }
          .hospital-subtitle {
            font-size: 11px;
            color: #64748b;
            margin: 2px 0 0 0;
          }
          .report-meta {
            text-align: right;
            font-size: 11px;
            color: #475569;
          }
          .report-meta strong {
            color: #0f172a;
          }
          h1 {
            font-size: 22px;
            font-weight: 800;
            color: #0f172a;
            margin: 0 0 5px 0;
            letter-spacing: -0.5px;
            text-transform: uppercase;
          }
          .period-badge {
            display: inline-block;
            background-color: #e0f2fe;
            color: #0369a1;
            font-size: 11px;
            font-weight: 700;
            padding: 4px 12px;
            border-radius: 20px;
            text-transform: uppercase;
            margin-bottom: 20px;
          }
          .metrics-grid {
            display: grid;
            grid-template-cols: repeat(3, 1fr);
            gap: 20px;
            margin-bottom: 30px;
          }
          .metric-card {
            background-color: #f8fafc;
            border: 1px solid #e2e8f0;
            border-radius: 16px;
            padding: 20px;
            position: relative;
            overflow: hidden;
          }
          .metric-card::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            width: 4px;
            height: 100%;
          }
          .card-visits::before { background-color: #3b82f6; }
          .card-patients::before { background-color: #10b981; }
          .card-revenue::before { background-color: #059669; }
          
          .metric-label {
            font-size: 10px;
            font-weight: 700;
            text-transform: uppercase;
            color: #64748b;
            letter-spacing: 1px;
          }
          .metric-value {
            font-size: 26px;
            font-weight: 800;
            color: #0f172a;
            margin-top: 5px;
            line-height: 1.1;
          }
          .metric-desc {
            font-size: 11px;
            color: #475569;
            margin-top: 5px;
          }
          .section-title {
            font-size: 13px;
            font-weight: 800;
            color: #0f172a;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            margin: 30px 0 15px 0;
            border-left: 4px solid #059669;
            padding-left: 8px;
          }
          .chart-revenue-container {
            display: grid;
            grid-template-cols: 1fr 1fr;
            gap: 20px;
            margin-bottom: 35px;
          }
          .revenue-breakdown-card {
            border: 1px solid #e2e8f0;
            border-radius: 16px;
            padding: 20px;
            background-color: #ffffff;
          }
          .progress-item {
            margin-bottom: 12px;
          }
          .progress-label-row {
            display: flex;
            justify-content: space-between;
            font-size: 11px;
            font-weight: 600;
            color: #334155;
            margin-bottom: 4px;
          }
          .progress-bar {
            height: 8px;
            background-color: #f1f5f9;
            border-radius: 4px;
            overflow: hidden;
          }
          .progress-fill {
            height: 100%;
            border-radius: 4px;
          }
          .table-container {
            width: 100%;
            margin-bottom: 25px;
            border: 1px solid #e2e8f0;
            border-radius: 12px;
            overflow: hidden;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            font-size: 11px;
            text-align: left;
          }
          th {
            background-color: #f8fafc;
            color: #475569;
            font-weight: 700;
            padding: 10px 12px;
            border-bottom: 1px solid #e2e8f0;
            text-transform: uppercase;
            font-size: 10px;
            letter-spacing: 0.5px;
          }
          td {
            padding: 10px 12px;
            border-bottom: 1px solid #f1f5f9;
            color: #334155;
          }
          tr:last-child td {
            border-bottom: none;
          }
          .badge {
            display: inline-block;
            font-size: 10px;
            font-weight: 700;
            padding: 2px 8px;
            border-radius: 6px;
          }
          .badge-lunas { background-color: #d1fae5; color: #065f46; }
          .badge-belum { background-color: #fef3c7; color: #92400e; }
          .badge-selesai { background-color: #d1fae5; color: #065f46; }
          .badge-diperiksa { background-color: #e0e7ff; color: #3730a3; }
          .badge-menunggu { background-color: #fef3c7; color: #92400e; }
          
          .signature-section {
            margin-top: 55px;
            display: flex;
            justify-content: space-between;
            align-items: flex-end;
          }
          .sig-box {
            text-align: center;
            font-size: 11px;
            color: #475569;
          }
          .sig-title {
            margin-bottom: 70px;
          }
          .sig-name {
            font-weight: 800;
            color: #0f172a;
            border-bottom: 1px solid #475569;
            padding-bottom: 2px;
          }
          .print-btn-bar {
            text-align: center;
            margin-top: 40px;
          }
          .print-btn {
            background-color: #059669;
            color: white;
            font-weight: 700;
            font-size: 13px;
            border: none;
            padding: 10px 24px;
            border-radius: 8px;
            cursor: pointer;
            box-shadow: 0 4px 6px -1px rgba(5, 150, 105, 0.2);
            transition: background 0.15s;
          }
          .print-btn:hover { background-color: #047857; }
          
          @media print {
            body { padding: 0; background: white; }
            .print-btn-bar { display: none; }
            .metric-card, .revenue-breakdown-card {
              box-shadow: none !important;
              page-break-inside: avoid;
            }
            .table-container { page-break-inside: avoid; }
          }
        </style>
      </head>
      <body>
        <div class="header-container">
          <div class="header-logo">
            <div class="logo-box">⚕</div>
            <div>
              <h2 class="hospital-title">Klinik Pratama SIM Medika</h2>
              <p class="hospital-subtitle">Sistem Informasi Manajemen Rumah Sakit Terpadu • Unit Administrasi Umum & Keuangan</p>
            </div>
          </div>
          <div class="report-meta">
            Tanggal Cetak: <strong>${new Date().toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' })}</strong><br>
            Dicetak Oleh: <strong>${user ? user.name : 'Staf Administrator'}</strong><br>
            ID Dokumen: <strong>REP-${ym.replace('-', '')}-RSML</strong>
          </div>
        </div>

        <div style="text-align: center; margin-bottom: 25px;">
          <h1>Laporan Kinerja Bulanan Rumah Sakit</h1>
          <div class="period-badge">Periode Operasional: ${monthText}</div>
        </div>

        <div class="metrics-grid">
          <div class="metric-card card-visits">
            <div class="metric-label">Total Kunjungan Pasien</div>
            <div class="metric-value">${data.totalVisits} Kunjungan</div>
            <div class="metric-desc">Pendaftaran Rawat Jalan & Poli</div>
          </div>
          <div class="metric-card card-patients">
            <div class="metric-label">Pasien Unik Aktif</div>
            <div class="metric-value">${data.activePatientsCount} Orang</div>
            <div class="metric-desc">Pasien terlayani dalam kurun bulan ini</div>
          </div>
          <div class="metric-card card-revenue">
            <div class="metric-label">Total Pendapatan (Lunas)</div>
            <div class="metric-value">${formatIDR(data.revenueLunas)}</div>
            <div class="metric-desc">Arus kas bersih kasir terkumpul</div>
          </div>
        </div>

        <div class="chart-revenue-container">
          <div class="revenue-breakdown-card">
            <h3 style="font-size: 12px; font-weight:800; color:#0f172a; margin: 0 0 15px 0; text-transform: uppercase;">Kontribusi Tarif Layanan</h3>
            
            <div class="progress-item">
              <div class="progress-label-row">
                <span>Jasa Medis Dokter</span>
                <span>${formatIDR(data.doctorFees)} (${docPercent}%)</span>
              </div>
              <div class="progress-bar">
                <div class="progress-fill" style="background-color: #3b82f6; width: ${docPercent}%"></div>
              </div>
            </div>

            <div class="progress-item">
              <div class="progress-label-row">
                <span>Penjualan Obat Resep</span>
                <span>${formatIDR(data.medicineFees)} (${medPercent}%)</span>
              </div>
              <div class="progress-bar">
                <div class="progress-fill" style="background-color: #10b981; width: ${medPercent}%"></div>
              </div>
            </div>

            <div class="progress-item">
              <div class="progress-label-row">
                <span>Biaya Penunjang Klinik</span>
                <span>${formatIDR(data.facilityFees)} (${facPercent}%)</span>
              </div>
              <div class="progress-bar">
                <div class="progress-fill" style="background-color: #64748b; width: ${facPercent}%"></div>
              </div>
            </div>
          </div>

          <div class="revenue-breakdown-card">
            <h3 style="font-size: 12px; font-weight:800; color:#0f172a; margin: 0 0 15px 0; text-transform: uppercase;">Status Keuangan & Antrean</h3>
            <div style="font-size:11px; color:#475569; space-y-2;">
              <div style="display: flex; justify-content: space-between; padding: 4px 0; border-bottom: 1px solid #f1f5f9;">
                <span>Total Invoice Terbit:</span>
                <strong style="color: #0f172a;">${data.billings.length} Faktur</strong>
              </div>
              <div style="display: flex; justify-content: space-between; padding: 4px 0; border-bottom: 1px solid #f1f5f9;">
                <span>Total Nilai Piutang:</span>
                <strong style="color: #0f172a;">${formatIDR(data.totalInvoiced)}</strong>
              </div>
              <div style="display: flex; justify-content: space-between; padding: 4px 0; border-bottom: 1px solid #f1f5f9;">
                <span>Tunggakan Belum Lunas:</span>
                <strong style="color: #b91c1c;">${formatIDR(data.totalInvoiced - data.revenueLunas)}</strong>
              </div>
              <div style="display: flex; justify-content: space-between; padding: 4px 0;">
                <span>Rasio Kolektabilitas:</span>
                <strong style="color: #047857;">${Math.round((data.revenueLunas / (data.totalInvoiced || 1)) * 100)}% Lunas</strong>
              </div>
            </div>
          </div>
        </div>

        <h2 class="section-title">A. Rincian Keuangan & Tagihan Kasir</h2>
        <div class="table-container">
          <table>
            <thead>
              <tr>
                <th>No Invoice</th>
                <th>Nama Pasien</th>
                <th>Tgl Tagihan</th>
                <th>Biaya Dokter</th>
                <th>Biaya Obat</th>
                <th>Biaya Klinik</th>
                <th>Total Akhir</th>
                <th>Metode Bayar</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              ${data.billings.length === 0 ? `<tr><td colspan="9" style="text-align: center; color: #94a3b8; padding: 20px;">Tidak ada transaksi keuangan pada periode ini</td></tr>` : 
                data.billings.map(b => `
                  <tr>
                    <td style="font-family: 'JetBrains Mono', monospace; font-weight: bold; color: #0f172a;">${b.invoice_number}</td>
                    <td><strong>${b.patient_name || patients.find(p=>p.id===b.patient_id)?.name || 'Pasien-ID ' + b.patient_id}</strong></td>
                    <td>${b.billing_date}</td>
                    <td>${formatIDR(b.doctor_fee)}</td>
                    <td>${formatIDR(b.medicine_fee)}</td>
                    <td>${formatIDR(b.facility_fee)}</td>
                    <td style="font-weight: bold; color: #0f172a;">${formatIDR(b.total_amount)}</td>
                    <td>${b.payment_method || '-'}</td>
                    <td><span class="badge ${b.status === 'Lunas' ? 'badge-lunas' : 'badge-belum'}">${b.status}</span></td>
                  </tr>
                `).join('')
              }
            </tbody>
          </table>
        </div>

        <h2 class="section-title">B. Registrasi & Kunjungan Poliklinik Pasien</h2>
        <div class="table-container">
          <table>
            <thead>
              <tr>
                <th>No Antrean</th>
                <th>Tgl Kunjungan</th>
                <th>No Rekam Medis</th>
                <th>Nama Pasien</th>
                <th>Dokter Spesialis</th>
                <th>Diagnosis Utama / Keluhan</th>
                <th>Status Antrean</th>
              </tr>
            </thead>
            <tbody>
              ${data.appointments.length === 0 ? `<tr><td colspan="7" style="text-align: center; color: #94a3b8; padding: 20px;">Tidak ada riwayat kunjungan poliklinik pada periode ini</td></tr>` :
                data.appointments.map(a => `
                  <tr>
                    <td style="font-family: 'JetBrains Mono', monospace; font-weight: bold; color: #059669; text-align: center;">${a.queue_number}</td>
                    <td>${a.appointment_date}</td>
                    <td style="font-family: 'JetBrains Mono', monospace;">${a.rekam_medis_number || patients.find(p=>p.id===a.patient_id)?.rekam_medis_number || '-'}</td>
                    <td><strong>${a.patient_name || patients.find(p=>p.id===a.patient_id)?.name || ''}</strong></td>
                    <td>${a.doctor_name || doctors.find(d=>d.id===a.doctor_id)?.name || ''} <span style="color:#64748b; font-size:10px;">(${a.specialization || doctors.find(d=>d.id===a.doctor_id)?.specialization || ''})</span></td>
                    <td><span style="font-style: italic; color: #475569;">"${a.complaint}"</span></td>
                    <td><span class="badge ${a.status === 'Selesai' ? 'badge-selesai' : a.status === 'Diperiksa' ? 'badge-diperiksa' : 'badge-menunggu'}">${a.status}</span></td>
                  </tr>
                `).join('')
              }
            </tbody>
          </table>
        </div>

        <div class="signature-section">
          <div class="sig-box">
            <div class="sig-title">Mengetahui,</div>
            <div class="sig-name" style="margin-top: 50px;">dr. Ahmad Pratama, Sp.PD</div>
            <div>Kepala Pelayanan Medis</div>
          </div>
          <div class="sig-box">
            <div class="sig-title">Dibuat Oleh,</div>
            <div class="sig-name" style="margin-top: 50px;">${user ? user.name : 'Azzah Lutfiyah, S.Kom'}</div>
            <div>Koordinator Keuangan & SIM RS</div>
          </div>
        </div>

        <div class="print-btn-bar">
          <button onclick="window.print()" class="print-btn">
            Selesaikan & Cetak PDF Laporan
          </button>
        </div>

        <script>
          window.onload = function() {
            setTimeout(function() {
              window.print();
            }, 600);
          }
        </script>
      </body>
      </html>
    `;

    printWindow.document.write(html);
    printWindow.document.close();
  };

  // Filter antrean hari ini
  const todayString = new Date().toISOString().split('T')[0];
  const activeAppointments = appointments.filter(
    app => app.appointment_date === todayString && app.status !== 'Batal'
  );

  const statsCards = [
    {
      title: 'Total Pasien Terdaftar',
      value: stats.totalPatients,
      icon: Users,
      wrapperClass: 'bg-indigo-600 text-white rounded-3xl p-6 shadow-md flex flex-col justify-between hover:scale-[1.02] transition-transform duration-200',
      titleClass: 'text-sm font-medium text-indigo-100 uppercase tracking-wider',
      valueClass: 'text-4xl font-extrabold text-white mt-1 font-sans',
      iconContainerClass: 'w-10 h-10 bg-indigo-550 bg-indigo-500/30 text-white rounded-xl flex items-center justify-center',
      descClass: 'text-xs text-indigo-200 mt-2',
      desc: 'Kumulatif rekam medis'
    },
    {
      title: 'Dokter Aktif Praktek',
      value: stats.activeDoctors,
      icon: UserCheck,
      wrapperClass: 'bg-white text-slate-800 rounded-3xl p-6 border border-slate-200 shadow-sm flex flex-col justify-between hover:scale-[1.02] transition-transform duration-200',
      titleClass: 'text-sm font-semibold uppercase tracking-wider text-slate-400',
      valueClass: 'text-3xl font-bold text-slate-900 mt-1',
      iconContainerClass: 'w-10 h-10 bg-emerald-50 text-emerald-605 rounded-xl flex items-center justify-center text-emerald-605 text-emerald-600',
      descClass: 'text-xs text-slate-500 mt-2',
      desc: 'Standby Poliklinik saat ini'
    },
    {
      title: 'Kunjungan Hari Ini',
      value: stats.todayAppointments,
      icon: Calendar,
      wrapperClass: 'bg-white text-slate-800 rounded-3xl p-6 border border-slate-200 shadow-sm flex flex-col justify-between hover:scale-[1.02] transition-transform duration-200',
      titleClass: 'text-sm font-semibold uppercase tracking-wider text-slate-400',
      valueClass: 'text-3xl font-bold text-slate-900 mt-1',
      iconContainerClass: 'w-10 h-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center',
      descClass: 'text-xs text-slate-500 mt-2',
      desc: `Registrasi tgl ${new Date().toLocaleDateString('id-ID', {day: 'numeric', month: 'short'})}`
    },
    {
      title: 'Pendapatan Hari Ini',
      value: new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(stats.revenueToday),
      icon: TrendingUp,
      wrapperClass: 'bg-slate-900 text-white rounded-3xl p-6 border border-slate-800 shadow-md flex flex-col justify-between hover:scale-[1.02] transition-transform duration-200',
      titleClass: 'text-sm font-medium text-slate-400 uppercase tracking-wider',
      valueClass: 'text-3xl font-extrabold text-white mt-1',
      iconContainerClass: 'w-10 h-10 bg-emerald-500 text-white rounded-xl flex items-center justify-center',
      descClass: 'text-xs text-slate-400 mt-2',
      desc: 'Kas Pelunasan Terkumpul'
    }
  ];

  const handleCreateAppointment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPatientId || !selectedDoctorId || !complaint) {
      alert('Mohon isi semua data formulir!');
      return;
    }

    try {
      setSubmitting(true);
      await onAddAppointment({
        patient_id: parseInt(selectedPatientId, 10),
        doctor_id: parseInt(selectedDoctorId, 10),
        appointment_date: todayString,
        appointment_time: appointmentTime,
        complaint: complaint
      });
      setSelectedPatientId('');
      setSelectedDoctorId('');
      setComplaint('');
      setShowAddForm(false);
      onRefresh();
    } catch (error) {
      console.error('Gagal menambah antrean:', error);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner / Welcome */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-7 rounded-3xl border border-slate-200 shadow-sm">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 font-sans tracking-tight">Ringkasan Sistem Hari Ini</h2>
          <p className="text-slate-500 text-sm mt-0.5">Sistem Informasi Manajemen Rumah Sakit Terpadu (SIM RS)</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => onRefresh()}
            className="px-4 py-2 text-sm font-medium text-slate-755 border border-slate-200 text-slate-700 rounded-xl hover:bg-slate-50 hover:text-slate-900 transition-colors"
          >
            Refresh Data
          </button>
          <button
            onClick={() => setShowAddForm(true)}
            className="flex items-center gap-2 px-4-5 px-4 py-2 bg-emerald-600 text-white rounded-xl shadow-md shadow-emerald-600/10 hover:bg-emerald-700 hover:shadow-xl hover:shadow-emerald-700/10 transition-all font-medium text-sm"
          >
            <Plus className="w-4.5 h-4.5" />
            Daftarkan Antrean Baru
          </button>
        </div>
      </div>

      {/* Grid Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {statsCards.map((card, idx) => {
          const Icon = card.icon;
          return (
            <div key={idx} className={card.wrapperClass}>
              <div className="flex justify-between items-start">
                <span className={card.titleClass}>{card.title}</span>
                <div className={card.iconContainerClass}>
                  <Icon className="w-5 h-5" />
                </div>
              </div>
              <div className="mt-4">
                <span className={card.valueClass}>
                  {card.value}
                </span>
                <p className={card.descClass}>{card.desc}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Grid Content: Antrean & Form */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left/Middle: Live Antrean Hari Ini */}
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 lg:col-span-2">
          <div className="flex justify-between items-center pb-4 border-b border-rose-50 border-slate-100">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-rose-50 rounded-lg text-rose-500">
                <Clock className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-semibold text-slate-900 font-sans">Queue Board / Antrean Poliklinik</h3>
                <p className="text-xs text-slate-400">Total {activeAppointments.length} antrean aktif tgl {todayString}</p>
              </div>
            </div>
            <div className="flex gap-1.5 bg-slate-50 p-1.5 rounded-lg border border-slate-100 text-[10px] font-mono font-medium">
              <span className="px-2 py-0.5 bg-amber-50 border border-amber-25 text-amber-600 rounded">
                Menunggu: {stats.activeQueues - stats.completedAppointments}
              </span>
              <span className="px-2 py-0.5 bg-emerald-50 border border-emerald-25 text-emerald-600 rounded">
                Selesai: {stats.completedAppointments}
              </span>
            </div>
          </div>

          <div className="mt-4 overflow-x-auto">
            {loading ? (
              <div className="py-12 text-center text-slate-400 text-sm">Menghubungkan data backend...</div>
            ) : activeAppointments.length === 0 ? (
              <div className="py-16 text-center text-slate-500">
                <ClipboardList className="w-10 h-10 text-slate-300 mx-auto stroke-1" />
                <p className="mt-3 text-sm">Belum ada antrean kunjungan pasien hari ini.</p>
                <button
                  onClick={() => setShowAddForm(true)}
                  className="mt-3 text-xs text-emerald-600 font-semibold hover:underline"
                >
                  Daftarkan kunjungan pasien &rarr;
                </button>
              </div>
            ) : (
              <table className="w-full text-left text-sm whitespace-nowrap">
                <thead>
                  <tr className="text-slate-400 text-xs uppercase tracking-wider font-semibold bg-slate-50 rounded-xl">
                    <th className="p-3 rounded-l-lg">No</th>
                    <th className="p-3">Nama Pasien / RM No</th>
                    <th className="p-3">Dokter Penerima</th>
                    <th className="p-3">Keluhan</th>
                    <th className="p-3">Status</th>
                    <th className="p-3 text-right rounded-r-lg">Aksi Urgen</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {activeAppointments.map((app) => (
                    <tr key={app.id} className="hover:bg-slate-50/40 transition-colors group">
                      <td className="p-3">
                        <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center font-bold font-mono text-slate-700 text-xs">
                          {app.queue_number}
                        </div>
                      </td>
                      <td className="p-3">
                        <p className="font-semibold text-slate-900">{app.patient_name}</p>
                        <p className="text-xs text-slate-400 font-mono">{app.rekam_medis_number}</p>
                      </td>
                      <td className="p-3">
                        <p className="font-semibold text-slate-900">{app.doctor_name}</p>
                        <p className="text-xs text-emerald-600 font-medium">{app.specialization}</p>
                      </td>
                      <td className="p-3 max-w-[200px] truncate">
                        <p className="text-slate-600 text-xs" title={app.complaint}>
                          {app.complaint}
                        </p>
                      </td>
                      <td className="p-3">
                        <span className={`inline-flex items-center px-2.5 py-1 text-xs font-semibold rounded-lg ${
                          app.status === 'Selesai' 
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' 
                            : app.status === 'Diperiksa'
                            ? 'bg-indigo-50 text-indigo-700 border border-indigo-100'
                            : 'bg-amber-50 text-amber-700 border border-amber-100'
                        }`}>
                          {app.status}
                        </span>
                      </td>
                      <td className="p-3 text-right">
                        <div className="inline-flex gap-1.5 items-center justify-end">
                          <button
                            onClick={() => handlePrintQueueTicket(app)}
                            title="Format Tiket Antrean (Barcode/PDF)"
                            className="p-1.5 border border-slate-200 hover:border-emerald-200 bg-white hover:bg-emerald-50 rounded-lg text-slate-500 hover:text-emerald-700 transition cursor-pointer flex items-center gap-1 text-xs font-semibold"
                          >
                            <Printer className="w-3.5 h-3.5" />
                            Tiket
                          </button>
                          {app.status === 'Menunggu' && (
                            <button
                              onClick={() => onUpdateAppointmentStatus(app.id, 'Diperiksa')}
                              className="px-2.5 py-1.5 text-xs font-semibold text-indigo-700 bg-indigo-50 border border-indigo-100 rounded-lg hover:bg-indigo-100 transition-colors cursor-pointer"
                            >
                              Panggil
                            </button>
                          )}
                          {app.status !== 'Selesai' && (
                            <button
                              onClick={() => {
                                if (confirm(`Batalkan antrean untuk pasien "${app.patient_name}"?`)) {
                                  onUpdateAppointmentStatus(app.id, 'Batal');
                                }
                              }}
                              className="px-2.5 py-1.5 text-xs font-medium text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                            >
                              Batal
                            </button>
                          )}
                          {app.status === 'Selesai' && (
                            <span className="text-xs text-slate-405 text-slate-500 pr-2 font-medium">Telah Diperiksa</span>
                          )}

                          {user?.role === 'admin' && (
                            <button
                              onClick={async () => {
                                if (confirm(`Apakah Anda yakin ingin menghapus antrean pasien "${app.patient_name}" dari database SIM RS?`)) {
                                  try {
                                    await onDeleteAppointment(app.id);
                                  } catch (err: any) {
                                    alert(err.message || 'Gagal menghapus antrean');
                                  }
                                }
                              }}
                              className="p-1 px-1.5 border border-transparent hover:border-rose-200 hover:bg-rose-50 rounded-lg text-slate-400 hover:text-rose-600 transition cursor-pointer"
                              title="Hapus Rekor Antrean"
                            >
                              <Trash className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Right Tab: Add Form / Info */}
        <div className="space-y-6">
          {/* Form Daftar Antrean Pasien */}
          {showAddForm ? (
            <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 space-y-4">
              <div className="flex justify-between items-center pb-3 border-b border-slate-100">
                <h3 className="font-bold text-slate-900 font-sans flex items-center gap-2">
                  <Stethoscope className="w-5 h-5 text-emerald-500" />
                  Registrasi Antrean Dokter
                </h3>
                <button
                  onClick={() => setShowAddForm(false)}
                  className="text-xs text-slate-400 hover:text-slate-600"
                >
                  Tutup [x]
                </button>
              </div>

              <form onSubmit={handleCreateAppointment} className="space-y-4">
                {/* Cari Pasien */}
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase mb-1.5">Pilih Pasien Terdaftar</label>
                  <select
                    value={selectedPatientId}
                    onChange={(e) => setSelectedPatientId(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-emerald-500"
                    required
                  >
                    <option value="">-- Pilih Pasien --</option>
                    {patients.map((pat) => (
                      <option key={pat.id} value={pat.id}>
                        {pat.name} - {pat.rekam_medis_number}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Pilih Dokter */}
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase mb-1.5">Dokter / Poliklinik</label>
                  <select
                    value={selectedDoctorId}
                    onChange={(e) => setSelectedDoctorId(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-emerald-500"
                    required
                  >
                    <option value="">-- Pilih Dokter --</option>
                    {doctors
                      .filter((doc) => doc.status === 'Aktif')
                      .map((doc) => (
                        <option key={doc.id} value={doc.id}>
                          {doc.name} ({doc.specialization}) - {doc.room}
                        </option>
                      ))}
                  </select>
                </div>

                {/* Jam Konsultasi */}
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase mb-1.5">Jam Praktek</label>
                  <select
                    value={appointmentTime}
                    onChange={(e) => setAppointmentTime(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-emerald-500"
                  >
                    <option value="09:00 - 10:00">09:00 - 10:00</option>
                    <option value="10:00 - 11:00">10:00 - 11:00</option>
                    <option value="11:00 - 12:00">11:00 - 12:00</option>
                    <option value="13:00 - 14:00">13:00 - 14:00</option>
                    <option value="14:00 - 15:00">14:00 - 15:00</option>
                  </select>
                </div>

                {/* Keluhan Utama */}
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase mb-1.5">Keluhan Utama</label>
                  <textarea
                    value={complaint}
                    onChange={(e) => setComplaint(e.target.value)}
                    placeholder="Contoh: Panas dingin sudah 3 hari, pusing kronis"
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-emerald-500 min-h-[80px]"
                    required
                  ></textarea>
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-semibold shadow-md shadow-emerald-600/10 transition-colors"
                >
                  {submitting ? 'Sedang Mendaftarkan...' : 'Konfirmasi & Cetak Antrean'}
                </button>
              </form>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Terminal Scanner Barcode Pasien (Alat Scan Pasien) */}
              <div className="bg-slate-900 text-white p-6 rounded-3xl shadow-xl border border-slate-850 space-y-4">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <ScanLine className={`w-5 h-5 text-emerald-400 ${beepActive ? 'animate-ping' : ''}`} />
                    <h4 className="font-bold text-sm tracking-tight">Terminal Alat Scan Barcode</h4>
                  </div>
                  <span className={`inline-flex items-center gap-1 text-[10px] font-mono font-bold px-2 py-0.5 rounded transition-all duration-150 ${beepActive ? 'bg-emerald-500 text-white animate-bounce' : 'bg-slate-800 text-slate-400'}`}>
                    <Volume2 className="w-3 h-3" />
                    {beepActive ? 'SCAN BEEP!' : 'ONLINE'}
                  </span>
                </div>

                <p className="text-slate-400 text-xs leading-relaxed">
                  Arahkan scanner handheld gun Anda, atau ketik kode Rekam Medis (RM) pasien (contoh: <strong className="text-emerald-400 hover:underline cursor-pointer" onClick={() => { setScanQuery('RM-0001'); triggerBeepSound(); }}>RM-0001</strong>) lalu tekan luncurkan/Enter.
                </p>

                <form onSubmit={handleBarcodeScanSubmit} className="space-y-3">
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Input RM / NIK lalu Enter..."
                      value={scanQuery}
                      onChange={(e) => setScanQuery(e.target.value)}
                      className="w-full pl-3 pr-16 py-2.5 bg-slate-800 border border-slate-700 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 rounded-xl text-xs font-mono placeholder-slate-500 focus:outline-none text-white font-bold"
                    />
                    <button
                      type="submit"
                      className="absolute right-1.5 top-1.5 bottom-1.5 px-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[10px] font-bold transition flex items-center justify-center cursor-pointer"
                    >
                      Pindai
                    </button>
                  </div>
                  {scanError && (
                    <p className="text-rose-400 text-[10px] font-semibold font-mono bg-rose-500/10 p-2 rounded-lg border border-rose-500/20">{scanError}</p>
                  )}
                </form>

                {/* Scan Result Card */}
                {scanResult && (
                  <div className="p-4 bg-slate-850/90 border border-slate-800 rounded-2xl space-y-3 text-xs animate-in fade-in duration-200">
                    <div className="pb-2 border-b border-slate-800">
                      <p className="text-[10px] text-emerald-400 font-mono">Hasil Pindai Kartu RM Pasien</p>
                      <h5 className="font-bold font-sans text-sky-400 text-sm mt-0.5">{scanResult.patient.name}</h5>
                      <p className="text-xs font-mono font-bold text-slate-300 mt-0.5">{scanResult.patient.rekam_medis_number}</p>
                      <p className="text-[10px] text-slate-500 mt-1">NIK: {scanResult.patient.nik} • HP: {scanResult.patient.phone || '-'}</p>
                    </div>

                    {scanResult.appointment ? (
                      <div className="p-2.5 bg-slate-800/60 border border-slate-750 border-slate-700 rounded-xl space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-[10px] uppercase font-bold tracking-wider text-amber-400 font-mono">Antrean Aktif Hari Ini</span>
                          <span className="font-bold font-mono text-xs text-white bg-slate-900 px-1.5 py-0.5 rounded">No: {scanResult.appointment.queue_number}</span>
                        </div>
                        <p className="text-[11px] text-slate-300 leading-relaxed">
                          Dokter: <strong>{scanResult.appointment.doctor_name}</strong><br/>
                          Keluhan: <span className="text-slate-400 italic">"{scanResult.appointment.complaint}"</span>
                        </p>
                        <div className="flex items-center gap-1.5 pt-1.5 border-t border-slate-750 border-slate-800 uppercase font-bold text-[10px]">
                          <span className="text-slate-400">Status:</span>
                          <span className={`px-1.5 rounded ${scanResult.appointment.status === 'Selesai' ? 'bg-emerald-500/25 text-emerald-400' : scanResult.appointment.status === 'Diperiksa' ? 'bg-indigo-500/25 text-indigo-400' : 'bg-amber-500/25 text-amber-400'}`}>
                            {scanResult.appointment.status}
                          </span>
                        </div>
                        
                        {/* Quick Action from Scanner */}
                        {scanResult.appointment.status === 'Menunggu' && (
                          <button
                            onClick={async () => {
                              if (scanResult.appointment) {
                                await onUpdateAppointmentStatus(scanResult.appointment.id, 'Diperiksa');
                                triggerBeepSound();
                                // update local view
                                setScanResult({
                                  ...scanResult,
                                  appointment: { ...scanResult.appointment, status: 'Diperiksa' }
                                });
                                onRefresh();
                              }
                            }}
                            className="w-full mt-1.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            Panggil Pemeriksaan Pasien
                          </button>
                        )}
                        
                        {scanResult.appointment.status === 'Diperiksa' && (
                          <div className="p-2 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-lg text-[10px] font-semibold text-center leading-relaxed">
                            Pasien ini sedang berada di ruang pemeriksaan klinik.
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="p-2.5 bg-rose-500/10 border border-rose-500/20 rounded-xl space-y-2">
                        <p className="text-slate-300 text-[11px]">Pasien terdaftar namun <strong className="text-rose-400">belum memiliki antrean aktif</strong> hari ini ({todayString}).</p>
                        <button
                          onClick={() => {
                            setSelectedPatientId(String(scanResult.patient.id));
                            setShowAddForm(true);
                          }}
                          className="w-full py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition flex items-center justify-center gap-1 cursor-pointer"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          Daftarkan Jadi Antrean Baru
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Petunjuk Operasional */}
              <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 space-y-4">
                <h4 className="font-semibold text-slate-800 text-sm">Petunjuk Operasional</h4>
                <p className="text-slate-505 text-slate-500 text-xs leading-relaxed">
                  Monitor antrean real-time SIM RS Medika. Anda dapat mendaftarkan antrean pasien yang berobat pada hari ini secara langsung.
                </p>
                <div className="border-t border-slate-100 pt-3 space-y-2">
                  <p className="text-xs text-slate-700 font-semibold font-sans">Langkah Menjalankan Pemeriksaan:</p>
                  <ul className="text-[11px] text-slate-500 list-disc list-inside space-y-1">
                    <li>Panggil pasien dengan menekan tombol <strong className="text-emerald-600">Panggil</strong> atau scan barcode-nya.</li>
                    <li>Cetak slip barcode dengan mengklik tombol <strong className="text-emerald-700">Tiket</strong> pada antrean aktif.</li>
                    <li>Setelah rekam medis terbit, antrean akan otomatis bertanda <strong className="text-emerald-700">Selesai</strong> dan tagihan lari ke menu <strong className="text-amber-700">Kasir & Billing</strong>.</li>
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* Alert Stok Tipis */}
          <div className="bg-amber-50 border border-amber-200 p-6 rounded-3xl shadow-xs">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-amber-500 rounded-xl text-white shrink-0">
                <AlertTriangle className="w-5 h-5 animate-pulse" />
              </div>
              <div>
                <h4 className="font-semibold text-slate-800 text-sm">Pemberitahuan Apotek</h4>
                <p className="text-slate-600 text-xs mt-1 leading-relaxed">
                  Terdapat <strong className="text-amber-700 font-bold">{stats.medicineShortageCount} sediaan obat</strong> dengan stok menipis (di bawah 15 unit). Mohon lakukan restock segera di menu Apotek.
                </p>
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* SECTION: Laporan Kinerja Bulanan */}
      <div id="monthly-performance-report-section" className="bg-white rounded-3xl border border-slate-200 shadow-sm p-7 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5">
          <div>
            <div className="flex items-center gap-2 text-emerald-600">
              <TrendingUp className="w-5.5 h-5.5" />
              <h3 className="text-lg font-bold text-slate-900 font-sans tracking-tight">Evaluasi Kinerja & Laporan Bulanan (PDF Summary)</h3>
            </div>
            <p className="text-slate-500 text-xs mt-1">
              Rangkuman performa operasional, kunjungan pasien (total visits), serta rekapitulasi keuangan kasir (revenue) & active patients per periode bulanan.
            </p>
          </div>
          <div className="flex shrink-0">
            <button
              onClick={() => {
                const available = getAvailableMonths();
                if (available.length > 0) {
                  handleExportPerformancePDF(available[0]);
                }
              }}
              className="flex items-center gap-2 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white transition rounded-xl text-xs font-semibold cursor-pointer shadow-sm"
            >
              <Printer className="w-4 h-4" />
              Cetak Periode Terbaru
            </button>
          </div>
        </div>

        <div className="overflow-x-auto rounded-2xl border border-slate-150">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 text-slate-500 font-bold border-b border-slate-150 uppercase tracking-wider text-[10px]">
                <th className="p-4">Periode Bulan</th>
                <th className="p-4 text-center">Registrasi Kunjungan (Visits)</th>
                <th className="p-4 text-center">Pasien Unik Aktif</th>
                <th className="p-4 text-right">Pendapatan Lunas (Revenue)</th>
                <th className="p-4 text-right">Nilai Piutang (Invoiced)</th>
                <th className="p-4 text-center">Rasio Kolektabilitas</th>
                <th className="p-4 text-right">Aksi Dokumen</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {getAvailableMonths().map((monthCode) => {
                const perf = calculateMonthlyPerformance(monthCode);
                const colRatio = Math.round((perf.revenueLunas / (perf.totalInvoiced || 1)) * 100);
                
                return (
                  <tr key={monthCode} className="hover:bg-slate-50/50 transition">
                    <td className="p-4 font-semibold text-slate-900 flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                      {formatYearMonth(monthCode)}
                    </td>
                    <td className="p-4 text-center font-semibold text-slate-800">
                      {perf.totalVisits} Kunjungan
                    </td>
                    <td className="p-4 text-center text-slate-600 font-medium">
                      {perf.activePatientsCount} Pasien
                    </td>
                    <td className="p-4 text-right font-semibold text-emerald-600 font-mono">
                      {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(perf.revenueLunas)}
                    </td>
                    <td className="p-4 text-right text-slate-500 font-mono">
                      {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(perf.totalInvoiced)}
                    </td>
                    <td className="p-4 text-center">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${colRatio >= 80 ? 'bg-emerald-50 text-emerald-700' : colRatio >= 50 ? 'bg-amber-50 text-amber-700' : 'bg-red-50 text-red-700'}`}>
                        {colRatio}% Tertagih
                      </span>
                    </td>
                    <td className="p-4 text-right" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => handleExportPerformancePDF(monthCode)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition text-[11px] font-bold cursor-pointer hover:shadow-md"
                      >
                        <Printer className="w-3.5 h-3.5" />
                        Ekspor PDF Laporan
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}

import React, { useState } from 'react';
import { 
  ReceiptText, 
  CreditCard, 
  Search, 
  Printer, 
  CheckCircle2, 
  ShieldAlert,
  ClipboardCheck,
  TrendingUp,
  Coins,
  Download,
  Plus,
  Trash2,
  Edit2,
  X
} from 'lucide-react';
import { Billing, Patient } from '../types';

interface BillingProps {
  billingList: Billing[];
  loading: boolean;
  user: { username: string; role: 'admin' | 'staff'; name: string; email: string } | null;
  onPayBilling: (id: number, paymentMethod: string) => Promise<void>;
  onRefresh: () => void;
  patients: Patient[];
  onAddBilling: (billingData: Partial<Billing>) => Promise<any>;
  onUpdateBilling: (id: number, billingData: Partial<Billing>) => Promise<void>;
  onDeleteBilling: (id: number) => Promise<void>;
}

export default function BillingPanel({
  billingList,
  loading,
  user,
  onPayBilling,
  onRefresh,
  patients,
  onAddBilling,
  onUpdateBilling,
  onDeleteBilling
 }: BillingProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<'Semua' | 'Belum Lunas' | 'Lunas'>('Semua');
  const [selectedInvoice, setSelectedInvoice] = useState<Billing | null>(null);
  const [paymentMethod, setPaymentMethod] = useState('Tunai');
  const [processing, setProcessing] = useState(false);

  // States untuk CRUD Tagihan Pasien Manual
  const [crudModal, setCrudModal] = useState<'add' | 'edit' | null>(null);
  const [editingBillId, setEditingBillId] = useState<number | null>(null);
  const [formPatientId, setFormPatientId] = useState<number>(0);
  const [formInvoiceNumber, setFormInvoiceNumber] = useState<string>('');
  const [formDoctorFee, setFormDoctorFee] = useState<number>(150000);
  const [formMedicineFee, setFormMedicineFee] = useState<number>(0);
  const [formFacilityFee, setFormFacilityFee] = useState<number>(25000);
  const [formBillingDate, setFormBillingDate] = useState<string>(new Date().toISOString().slice(0, 10));
  const [formStatus, setFormStatus] = useState<'Belum Lunas' | 'Lunas'>('Belum Lunas');
  const [formPaymentMethod, setFormPaymentMethod] = useState<string>('Tunai');
  const [savingBill, setSavingBill] = useState(false);

  const handlePrintReceipt = (invoice: Billing) => {
    const printWindow = window.open('', '_blank', 'width=800,height=600');
    if (!printWindow) {
      alert('Gagal membuka jendela cetak. Pastikan pop-up dibolehkan di browser Anda.');
      return;
    }
    
    const html = `
      <html>
      <head>
        <title>Invoice SIM RS Medika - ${invoice.invoice_number}</title>
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800&family=JetBrains+Mono:wght@400;700&display=swap" rel="stylesheet">
        <style>
          body {
            font-family: 'Inter', sans-serif;
            color: #1e293b;
            padding: 40px;
            margin: 0;
            background-color: #ffffff;
          }
          @media print {
            body { padding: 0; margin: 0; }
          }
          .header {
            display: flex;
            justify-content: space-between;
            border-bottom: 2px solid #e2e8f0;
            padding-bottom: 20px;
            margin-bottom: 20px;
            align-items: center;
          }
          .hospital-title {
            font-size: 22px;
            font-weight: 800;
            color: #059669;
          }
          .invoice-number {
            font-family: 'JetBrains Mono', monospace;
            font-weight: 700;
            font-size: 15px;
            color: #475569;
          }
          .info-box {
            background: #f8fafc;
            border-radius: 16px;
            padding: 20px;
            margin-bottom: 25px;
            border: 1px solid #e2e8f0;
            font-size: 13px;
          }
          .table {
            width: 100%;
            border-collapse: collapse;
            margin: 25px 0;
          }
          .table th {
            background: #f1f5f9;
            padding: 14px;
            font-size: 11px;
            text-transform: uppercase;
            font-weight: 700;
            text-align: left;
            border-bottom: 1.5px solid #cbd5e1;
          }
          .table td {
            padding: 14px;
            border-bottom: 1px solid #e2e8f0;
            font-size: 13px;
          }
          .font-mono {
            font-family: 'JetBrains Mono', monospace;
          }
          .grand-total {
            text-align: right;
            font-size: 19px;
            font-weight: 800;
            color: #047857;
            margin-top: 25px;
            border-top: 2px solid #e2e8f0;
            padding-top: 15px;
          }
          .footer {
            margin-top: 50px;
            text-align: center;
            font-size: 11px;
            color: #64748b;
            border-top: 1.5px dashed #cbd5e1;
            padding-top: 25px;
          }
          .signature-block {
            display: flex;
            justify-content: space-between;
            margin-top: 45px;
            padding: 0 35px;
            font-size: 13px;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div>
            <div class="hospital-title">🏥 RUMAH SAKIT MEDIKA</div>
            <div style="font-size: 12px; color: #64748b; margin-top: 4px;">Jl. Kesehatan Medika No. 101, Jakarta Pusat • Telp: (021) 555-0100</div>
          </div>
          <div style="text-align: right">
            <div class="invoice-number">${invoice.invoice_number}</div>
            <div style="font-size: 12px; color: #64748b; margin-top: 4px;">Tanggal Cetak: ${invoice.billing_date}</div>
          </div>
        </div>

        <div class="info-box">
          <table style="width: 100%; border: none;">
            <tr>
              <td style="width: 50%; padding: 0; border: none; vertical-align: top;">
                <span style="color: #64748b; font-size: 11px; font-weight: 700; text-transform: uppercase; tracking-wider">IDENTITAS PASIEN</span>
                <div style="font-weight: 700; font-size: 15px; margin-top: 6px; color: #0f172a">${invoice.patient_name}</div>
                <div style="font-family: 'JetBrains Mono', monospace; color: #059669; font-weight: 700; margin-top: 2px;">No. RM: ${invoice.rekam_medis_number}</div>
              </td>
              <td style="width: 50%; padding: 0; border: none; vertical-align: top; text-align: right;">
                <span style="color: #64748b; font-size: 11px; font-weight: 700; text-transform: uppercase; tracking-wider">STATUS TRANSAKSI</span>
                <div style="font-weight: 800; font-size: 15px; margin-top: 6px; color: ${invoice.status === 'Lunas' ? '#059669' : '#e11d48'}">${invoice.status === 'Lunas' ? 'LUNAS TERBAYAR' : 'BELUM PELUNASAN'}</div>
                <div style="font-weight: 600; font-size: 12px; color: #475569; margin-top: 2px;">Metode Pembayaran: Jaminan ${invoice.payment_method || 'Tunai'}</div>
              </td>
            </tr>
          </table>
        </div>

        <div style="font-weight: 700; font-size: 14px; margin-top: 10px; color: #0f172a">PERINCIAN LAYANAN & TARIF RS</div>
        <table class="table">
          <thead>
            <tr>
              <th style="width: 10%">No</th>
              <th style="width: 60%">Deskripsi Layanan / Tindakan Medis</th>
              <th style="width: 30%; text-align: right">Biaya Layanan</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>1</td>
              <td><b>Jasa Konsultasi Dokter Spesialis RS</b><br><span style="font-size: 11px; color:#64748b">Pemeriksaan fisik komprehensif & konsultasi resep ahli</span></td>
              <td class="font-mono" style="text-align: right">${new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(invoice.doctor_fee)}</td>
            </tr>
            <tr>
              <td>2</td>
              <td><b>Sediaan Obat-obatan / Farmasi Apotek</b><br><span style="font-size: 11px; color:#64748b">Harga paten berdasarkan Formularium RS untuk diagnosis</span></td>
              <td class="font-mono" style="text-align: right">${new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(invoice.medicine_fee)}</td>
            </tr>
            <tr>
              <td>3</td>
              <td><b>Jasa Administrasi & Sarana Sarung Klinik</b><br><span style="font-size: 11px; color:#64748b">Pemakaian ruangan bed, rekam medis elektronik, & pemeliharaan</span></td>
              <td class="font-mono" style="text-align: right">${new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(invoice.facility_fee)}</td>
            </tr>
          </tbody>
        </table>

        <div class="grand-total">
          TOTAL PEMBAYARAN: ${new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(invoice.total_amount)}
        </div>

        <div class="signature-block">
          <div>
            <p style="color: #64748b; margin-bottom: 50px">Petugas Kasir Medika</p>
            <p style="font-weight: 700;">( ${user?.name || 'Kasir Medika'} )</p>
          </div>
          <div style="text-align: right">
            <p style="color: #64748b; margin-bottom: 50px">Wali Pembayar / Pasien</p>
            <p style="font-weight: 700; text-decoration: underline;">( ___________________ )</p>
          </div>
        </div>

        <div class="footer">
          Tanda bukti pembayaran ini diterbitkan secara sah oleh SIM RS Medika.<br>
          Terima kasih atas kunjungan Anda. Semoga lekas sembuh sepenuhnya!
        </div>

        <script>
          window.onload = function() {
            window.print();
          }
        </script>
      </body>
      </html>
    `;
    printWindow.document.open();
    printWindow.document.write(html);
    printWindow.document.close();
  };

  const handleExportCSV = () => {
    try {
      if (billingList.length === 0) {
        alert("Tidak ada data tagihan untuk diekspor!");
        return;
      }
      
      const headers = [
        "Nomor Invoice",
        "Tanggal Billing",
        "Nama Pasien",
        "Nomor Rekam Medis",
        "Biaya Dokter (Rp)",
        "Biaya Obat (Rp)",
        "Biaya Fasilitas (Rp)",
        "Grand Total (Rp)",
        "Status Pembayaran",
        "Metode Pembayaran",
        "Tanggal Pembayaran"
      ];
      
      const csvRows = [
        headers.join(","),
        ...billingList.map(b => [
          `"${b.invoice_number}"`,
          `"${b.billing_date}"`,
          `"${b.patient_name}"`,
          `"${b.rekam_medis_number}"`,
          b.doctor_fee,
          b.medicine_fee,
          b.facility_fee,
          b.total_amount,
          `"${b.status}"`,
          `"${b.payment_method || '-'}"`,
          `"${b.payment_date || '-'}"`
        ].join(","))
      ];
      
      const csvContent = "\uFEFF" + csvRows.join("\n");
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.setAttribute("href", url);
      
      const dateStr = new Date().toISOString().slice(0, 10);
      link.setAttribute("download", `laporan_keuangan_billing_rs_${dateStr}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err: any) {
      alert("Gagal melakukan ekspor data: " + err.message);
    }
  };

  // Filter tagihan
  const filteredBilling = billingList.filter(b => {
    const matchesSearch = b.patient_name?.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          b.rekam_medis_number?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          b.invoice_number.toLowerCase().includes(searchQuery.toLowerCase());
    
    if (filterStatus === 'Semua') return matchesSearch;
    return matchesSearch && b.status === filterStatus;
  });

  const handleProcessPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedInvoice) return;

    try {
      setProcessing(true);
      await onPayBilling(selectedInvoice.id, paymentMethod);
      onRefresh();
      
      const updatedInvoice = { ...selectedInvoice, status: 'Lunas' as const, payment_method: paymentMethod };
      setSelectedInvoice(updatedInvoice);
        
      alert(`Pembayaran untuk Invoice ${selectedInvoice.invoice_number} berhasil divalidasi! Membuka halaman cetakan...`);
      handlePrintReceipt(updatedInvoice);
    } catch (error) {
      console.error(error);
      alert('Gagal memproses transaksi pembayaran');
    } finally {
      setProcessing(false);
    }
  };

  const calculateTotals = () => {
    let unpaidTotal = 0;
    let paidTotal = 0;
    billingList.forEach(b => {
      if (b.status === 'Lunas') {
        paidTotal += Number(b.total_amount);
      } else {
        unpaidTotal += Number(b.total_amount);
      }
    });
    return { unpaidTotal, paidTotal };
  };

  const { unpaidTotal, paidTotal } = calculateTotals();

  // CRUD Event Handlers
  const openAddBillingForm = () => {
    setCrudModal('add');
    setEditingBillId(null);
    setFormPatientId(patients[0]?.id || 0);
    setFormInvoiceNumber('');
    setFormDoctorFee(150000);
    setFormMedicineFee(0);
    setFormFacilityFee(25000);
    setFormBillingDate(new Date().toISOString().slice(0, 10));
    setFormStatus('Belum Lunas');
    setFormPaymentMethod('Tunai');
  };

  const openEditBillingForm = (bill: Billing) => {
    setCrudModal('edit');
    setEditingBillId(bill.id);
    setFormPatientId(bill.patient_id);
    setFormInvoiceNumber(bill.invoice_number);
    setFormDoctorFee(bill.doctor_fee);
    setFormMedicineFee(bill.medicine_fee);
    setFormFacilityFee(bill.facility_fee);
    setFormBillingDate(bill.billing_date);
    setFormStatus(bill.status);
    setFormPaymentMethod(bill.payment_method || 'Tunai');
  };

  const handleSaveBilling = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formPatientId) {
      alert('Pilih pasien terlebih dahulu!');
      return;
    }
    
    const billingData: Partial<Billing> = {
      patient_id: Number(formPatientId),
      invoice_number: formInvoiceNumber || undefined,
      doctor_fee: Number(formDoctorFee),
      medicine_fee: Number(formMedicineFee),
      facility_fee: Number(formFacilityFee),
      billing_date: formBillingDate,
      status: formStatus,
      payment_method: formStatus === 'Lunas' ? formPaymentMethod : undefined
    };

    try {
      setSavingBill(true);
      if (crudModal === 'edit' && editingBillId) {
        await onUpdateBilling(editingBillId, billingData);
        alert('Data tagihan berhasil diperbarui!');
      } else {
        await onAddBilling(billingData);
        alert('Data tagihan baru berhasil ditambahkan!');
      }
      setCrudModal(null);
      onRefresh();
    } catch (err: any) {
      alert(err.message || 'Gagal menyimpan data tagihan');
    } finally {
      setSavingBill(false);
    }
  };

  const handleDeleteBillingTrigger = async (id: number, invNum: string) => {
    if (confirm(`Apakah Anda yakin ingin menghapus data tagihan: "${invNum}"? Tindakan ini tidak dapat dibatalkan.`)) {
      try {
        await onDeleteBilling(id);
        if (selectedInvoice?.id === id) {
          setSelectedInvoice(null);
        }
        onRefresh();
        alert('Data tagihan berhasil dihapus!');
      } catch (err: any) {
        alert(err.message || 'Gagal menghapus data tagihan');
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 font-sans tracking-tight">Pelunasan Kasir & Billing Pembayaran</h2>
          <p className="text-slate-500 text-sm mt-0.5">Penetapan Rincian Biaya, Klaim Penjamin BPJS Kesehatan, & Cetak Transaksi Kunjungan</p>
        </div>
        <div className="flex items-center gap-3 w-full md:w-auto">
          <button
            id="billing-add-invoice-button"
            onClick={openAddBillingForm}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white transition-all rounded-xl text-sm font-semibold flex items-center gap-2 cursor-pointer shadow-md shadow-emerald-500/10"
          >
            <Plus className="w-4 h-4" />
            Tambah Tagihan Kasir
          </button>
          <button
            id="billing-export-csv-button"
            onClick={handleExportCSV}
            className="px-4 py-2 bg-emerald-55 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-700 transition-all rounded-xl text-sm font-semibold flex items-center gap-2 cursor-pointer shadow-sm"
          >
            <Download className="w-4 h-4" />
            Ekspor Data (CSV)
          </button>
          <button
            id="billing-sync-button"
            onClick={() => onRefresh()}
            className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-700 hover:text-slate-900 transition-all rounded-xl text-sm font-semibold flex items-center gap-2 cursor-pointer"
          >
            Penyelarasan Server
          </button>
        </div>
      </div>

      {/* Financial Summary Info widgets */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="p-5 rounded-3xl border border-slate-200 bg-white shadow-sm flex justify-between items-center">
          <div className="space-y-1">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider font-mono">Piutang Pelayanan</span>
            <p className="text-2xl font-black text-rose-550 text-rose-600 tracking-tight">
              {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(unpaidTotal)}
            </p>
            <p className="text-[10px] text-slate-400">Total tagihan pasien sedang dirawat/diperiksa belum bayar</p>
          </div>
          <div className="p-3 bg-rose-50 text-rose-500 rounded-2xl">
            <Coins className="w-6 h-6" />
          </div>
        </div>

        <div className="p-5 rounded-3xl border border-slate-200 bg-white shadow-sm flex justify-between items-center">
          <div className="space-y-1">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider font-mono">Kas Likuid Terkumpul</span>
            <p className="text-2xl font-black text-emerald-550 text-emerald-600 tracking-tight">
              {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(paidTotal)}
            </p>
            <p className="text-[10px] text-slate-400">Kas terkumpul lunas dari pembayaran mandiri & klaim BPJS</p>
          </div>
          <div className="p-3 bg-emerald-50 text-emerald-500 rounded-2xl">
            <TrendingUp className="w-6 h-6 animate-pulse" />
          </div>
        </div>
      </div>

      {/* Grid Layout Main */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Kolom Kiri: Tabel Tagihan Medis */}
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 lg:col-span-2 space-y-4">
          
          {/* Filter Bar */}
          <div className="flex flex-col sm:flex-row gap-3 justify-between items-start sm:items-center pb-3 border-b border-rose-50 border-slate-100">
            <h3 className="font-bold text-slate-900 font-sans flex items-center gap-2">
              <ReceiptText className="w-5 h-5 text-emerald-500" />
              Daftar Tagihan Pasien ({filteredBilling.length} Tagihan)
            </h3>

            {/* Filter Buttons & Search */}
            <div className="flex flex-wrap gap-2 items-center w-full sm:w-auto">
              <div className="flex bg-slate-50 border border-slate-200 rounded-lg p-0.5 text-[11px] font-semibold">
                {['Semua', 'Belum Lunas', 'Lunas'].map((st) => (
                  <button
                    key={st}
                    onClick={() => setFilterStatus(st as any)}
                    className={`px-2.5 py-1 rounded-md transition ${
                      filterStatus === st ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    {st}
                  </button>
                ))}
              </div>

              {/* Search Invoice */}
              <div className="relative w-full sm:w-44">
                <input
                  type="text"
                  placeholder="Nama, No RM, Invoice..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full py-1 px-7 text-[11px] bg-slate-50 border border-slate-200 rounded-lg focus:outline-none"
                />
                <Search className="w-3 h-3 text-slate-400 absolute left-2 top-1/2 -translate-y-1/2" />
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead>
                <tr className="text-slate-400 text-xs uppercase tracking-wider font-semibold bg-slate-50 rounded-xl">
                  <th className="p-3 rounded-l-lg">No Invoice / Tanggal</th>
                  <th className="p-3">Nama Pasien / RM</th>
                  <th className="p-3 text-right">Grand Total Tagihan</th>
                  <th className="p-3">Status Klaim</th>
                  <th className="p-3 text-right rounded-r-lg">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr>
                    <td colSpan={5} className="py-10 text-center text-slate-400 text-xs">Memuat billing...</td>
                  </tr>
                ) : filteredBilling.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-12 text-center text-slate-400">
                      Tidak ditemukan invoice tagihan yang cocok.
                    </td>
                  </tr>
                ) : (
                  filteredBilling.map((bill) => (
                    <tr 
                      key={bill.id}
                      onClick={() => setSelectedInvoice(bill)}
                      className={`hover:bg-slate-50/70 transition-colors group cursor-pointer ${
                        selectedInvoice?.id === bill.id ? 'bg-emerald-50/20' : ''
                      }`}
                    >
                      <td className="p-3 text-xs">
                        <p className="font-mono font-bold text-slate-700">{bill.invoice_number}</p>
                        <p className="text-[10px] text-slate-400 font-mono">{bill.billing_date}</p>
                      </td>
                      <td className="p-3">
                        <p className="font-bold text-slate-900">{bill.patient_name}</p>
                        <p className="text-xs text-emerald-600 font-bold font-mono">{bill.rekam_medis_number}</p>
                      </td>
                      <td className="p-3 text-right font-mono font-bold text-slate-800">
                        {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(bill.total_amount)}
                      </td>
                      <td className="p-3">
                        <span className={`inline-flex items-center px-2 py-0.5 text-[10px] font-bold rounded-md ${
                          bill.status === 'Lunas'
                            ? 'bg-emerald-100 text-emerald-700'
                            : 'bg-rose-100 text-rose-700'
                        }`}>
                          {bill.status}
                        </span>
                        {bill.payment_method && (
                          <p className="text-[9px] text-slate-400 mt-1 uppercase font-mono">{bill.payment_method}</p>
                        )}
                      </td>
                      <td className="p-3 text-right" onClick={(e)=>e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1.5 animate-in fade-in duration-200">
                          <button
                            onClick={() => handlePrintReceipt(bill)}
                            title="Cetak Slip Instan"
                            className="p-1.5 text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-all cursor-pointer"
                          >
                            <Printer className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => openEditBillingForm(bill)}
                            title="Ubah Rincian Tagihan"
                            className="p-1.5 text-sky-600 hover:bg-sky-50 rounded-lg transition-all cursor-pointer"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteBillingTrigger(bill.id, bill.invoice_number)}
                            title="Hapus Tagihan"
                            className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg transition-all cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => setSelectedInvoice(bill)}
                            className="px-2 py-1 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition ml-1"
                          >
                            Rincian
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Kolom Kanan: Rincian Biaya & Slip Pembayaran */}
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6">
          {!selectedInvoice ? (
            <div className="py-24 text-center text-slate-400 space-y-3">
              <ReceiptText className="w-12 h-12 text-slate-200 mx-auto stroke-1" />
              <div className="max-w-[190px] mx-auto text-xs">
                <p className="font-semibold text-slate-700">Rincian Slip Medis</p>
                <p className="text-slate-450 text-slate-400 mt-1 leading-relaxed">Pilih salah satu baris invoice di tabel samping untuk melunasi biaya, memilih metode pembayaran, atau mencetak slip tanda terima.</p>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex justify-between items-center pb-2 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono font-bold text-slate-400">Rincian Slip Invoice</span>
                  <button 
                    onClick={() => handlePrintReceipt(selectedInvoice)}
                    title="Cetak Dokumen"
                    className="p-1 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded transition-all cursor-pointer"
                  >
                    <Printer className="w-3.5 h-3.5" />
                  </button>
                </div>
                <button 
                  onClick={() => setSelectedInvoice(null)}
                  className="text-xs text-slate-400 hover:text-slate-700"
                >
                  Tutup [x]
                </button>
              </div>

              {/* Rincian Header */}
              <div className="p-4 bg-slate-50 border border-slate-100 rounded-xl space-y-1">
                <p className="text-[10px] font-mono text-slate-400 uppercase tracking-widest">{selectedInvoice.invoice_number}</p>
                <h4 className="font-bold text-slate-800 text-sm mt-1">{selectedInvoice.patient_name}</h4>
                <p className="text-xs text-emerald-600 font-bold font-mono">{selectedInvoice.rekam_medis_number}</p>
              </div>

              {/* Tabel Perincian Tarif */}
              <div className="space-y-3 pt-2 text-xs">
                <div className="flex justify-between pb-1.5 border-b border-slate-100">
                  <span className="text-slate-500">Jasa Konsultasi Spesialis</span>
                  <span className="font-mono font-medium text-slate-800">
                    {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(selectedInvoice.doctor_fee)}
                  </span>
                </div>
                <div className="flex justify-between pb-1.5 border-b border-slate-100">
                  <span className="text-slate-500">Formulasi & Obat Apotek</span>
                  <span className="font-mono font-medium text-slate-800">
                    {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(selectedInvoice.medicine_fee)}
                  </span>
                </div>
                <div className="flex justify-between pb-1.5 border-b border-slate-100 text-slate-500">
                  <span>Jasa Layanan Klinik/Sarana</span>
                  <span className="font-mono font-medium text-slate-800">
                    {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(selectedInvoice.facility_fee)}
                  </span>
                </div>

                <div className="flex justify-between pt-2 border-t border-slate-100 font-bold text-slate-900 text-sm">
                  <span>GRAND TOTAL</span>
                  <span className="font-mono text-emerald-700">
                    {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(selectedInvoice.total_amount)}
                  </span>
                </div>
              </div>

              {/* Form Bayar jika Belum Lunas */}
              {selectedInvoice.status === 'Belum Lunas' ? (
                <form onSubmit={handleProcessPayment} className="pt-4 border-t border-dashed border-slate-200 space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">Metode Pembayaran / Jaminan</label>
                    <select
                      value={paymentMethod}
                      onChange={(e) => setPaymentMethod(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-emerald-500"
                    >
                      <option value="Tunai">Tunai / Cash</option>
                      <option value="Transfer Bank Mandiri">Transfer Bank Mandiri</option>
                      <option value="Transfer Bank BCA">Transfer Bank BCA</option>
                      <option value="Jaminan BPJS Kesehatan">Klaim BPJS Kesehatan</option>
                    </select>
                  </div>

                  <button
                    type="submit"
                    disabled={processing}
                    className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-md shadow-emerald-500/10 transition flex items-center justify-center gap-2"
                  >
                    <CreditCard className="w-4 h-4" />
                    {processing ? 'Sedang Memproses...' : 'Proses Pelunasan Tagihan'}
                  </button>
                </form>
              ) : (
                <div className="pt-4 border-t border-dashed border-slate-200 space-y-3 text-center">
                  <div className="inline-flex p-2 bg-emerald-50 text-emerald-600 rounded-full">
                    <ClipboardCheck className="w-10 h-10" />
                  </div>
                  <h4 className="font-bold text-emerald-700 text-sm">Tagihan Telah Terbayar</h4>
                  <p className="text-[10px] text-slate-400 font-mono">Lunas Terbayar via {selectedInvoice.payment_method || 'Tunasi'}</p>
                  
                  <button
                    id="billing-print-receipt-button"
                    onClick={() => handlePrintReceipt(selectedInvoice)}
                    className="w-full mt-2 py-2 border border-slate-200 text-slate-700 text-xs font-bold hover:bg-slate-50 rounded-xl flex items-center justify-center gap-2 cursor-pointer transition-all duration-150"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    Cetak Nota Pembayaran (Invoice)
                  </button>
                </div>
              )}

            </div>
          )}
        </div>

      </div>

      {/* Modal Dialog CRUD Tagihan Manual */}
      {crudModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-md w-full overflow-hidden animate-in zoom-in-95 duration-150">
            <div className="bg-emerald-600 px-6 py-4 text-white flex justify-between items-center">
              <div className="flex items-center gap-2">
                <ReceiptText className="w-5 h-5" />
                <h3 className="font-bold text-sm sm:text-base font-sans leading-none">
                  {crudModal === 'add' ? 'Tambah Tagihan Baru' : 'Ubah Data Tagihan'}
                </h3>
              </div>
              <button 
                onClick={() => setCrudModal(null)}
                className="text-white/80 hover:text-white hover:bg-white/20 p-1 rounded-lg transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveBilling} className="p-6 space-y-4">
              {/* Pasien Select */}
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Nama Pasien / Rekam Medis</label>
                {crudModal === 'add' ? (
                  <select
                    value={formPatientId}
                    onChange={(e) => setFormPatientId(Number(e.target.value))}
                    required
                    className="w-full px-3 py-2 border border-slate-200 bg-white rounded-xl text-xs focus:outline-none focus:border-emerald-500 text-slate-800"
                  >
                    <option value="">-- Pilih Pasien --</option>
                    {patients && patients.map((pat) => (
                      <option key={pat.id} value={pat.id}>
                        {pat.name} - ({pat.rekam_medis_number})
                      </option>
                    ))}
                  </select>
                ) : (
                  <div className="px-3 py-2 border border-slate-100 bg-slate-50 rounded-xl text-xs font-semibold text-slate-700">
                    {patients && patients.find(p => p.id === formPatientId)?.name || 'Pasien'}
                  </div>
                )}
              </div>

              {/* No Invoice (Optional) */}
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Nomor Invoice</label>
                <input
                  type="text"
                  placeholder="Automatis (Misal: INV-202606...)"
                  value={formInvoiceNumber}
                  onChange={(e) => setFormInvoiceNumber(e.target.value)}
                  disabled={crudModal === 'edit'}
                  className="w-full px-3 py-2 border border-slate-200 bg-white disabled:bg-slate-50 rounded-xl text-xs focus:outline-none focus:border-emerald-500"
                />
              </div>

              {/* Rincian Biaya */}
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Biaya Dokter</label>
                  <input
                    type="number"
                    min="0"
                    value={formDoctorFee}
                    onChange={(e) => setFormDoctorFee(Number(e.target.value))}
                    required
                    className="w-full px-2.5 py-2 border border-slate-200 rounded-xl text-xs font-mono text-slate-800 focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Biaya Obat</label>
                  <input
                    type="number"
                    min="0"
                    value={formMedicineFee}
                    onChange={(e) => setFormMedicineFee(Number(e.target.value))}
                    required
                    className="w-full px-2.5 py-2 border border-slate-200 rounded-xl text-xs font-mono text-slate-800 focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Biaya Klinik</label>
                  <input
                    type="number"
                    min="0"
                    value={formFacilityFee}
                    onChange={(e) => setFormFacilityFee(Number(e.target.value))}
                    required
                    className="w-full px-2.5 py-2 border border-slate-200 rounded-xl text-xs font-mono text-slate-800 focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              {/* Total Summary */}
              <div className="p-3 bg-emerald-50/50 rounded-xl border border-emerald-100 flex justify-between items-center text-xs">
                <span className="font-semibold text-slate-600">Total Pembayaran:</span>
                <span className="font-mono font-extrabold text-emerald-700 text-sm">
                  {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(
                    Number(formDoctorFee) + Number(formMedicineFee) + Number(formFacilityFee)
                  )}
                </span>
              </div>

              {/* Tanggal Tagihan */}
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Tanggal Tagihan</label>
                <input
                  type="date"
                  value={formBillingDate}
                  onChange={(e) => setFormBillingDate(e.target.value)}
                  required
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-emerald-500"
                />
              </div>

              {/* Status Pembayaran */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Status Pembayaran</label>
                  <select
                    value={formStatus}
                    onChange={(e) => setFormStatus(e.target.value as any)}
                    className="w-full px-3 py-2 border border-slate-200 bg-white rounded-xl text-xs focus:outline-none focus:border-emerald-500"
                  >
                    <option value="Belum Lunas">Belum Lunas</option>
                    <option value="Lunas">Lunas</option>
                  </select>
                </div>

                {formStatus === 'Lunas' && (
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Metode Bayar</label>
                    <select
                      value={formPaymentMethod}
                      onChange={(e) => setFormPaymentMethod(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-200 bg-white rounded-xl text-xs focus:outline-none focus:border-emerald-500"
                    >
                      <option value="Tunai">Tunai / Cash</option>
                      <option value="Transfer Bank Mandiri">Transfer Mandiri</option>
                      <option value="Transfer Bank BCA">Transfer BCA</option>
                      <option value="Jaminan BPJS Kesehatan">Klaim BPJS</option>
                    </select>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setCrudModal(null)}
                  className="px-4 py-2 border border-slate-200 rounded-xl text-xs font-semibold text-slate-500 hover:text-slate-800 hover:bg-slate-50 transition cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={savingBill}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1 cursor-pointer disabled:opacity-50"
                >
                  {savingBill ? 'Menyimpan...' : 'Simpan Tagihan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}

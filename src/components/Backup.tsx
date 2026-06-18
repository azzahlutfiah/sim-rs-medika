import React, { useState, useRef } from 'react';
import { 
  Download, 
  UploadCloud, 
  AlertTriangle, 
  CheckCircle2, 
  Database,
  RefreshCw,
  Clock,
  ShieldCheck,
  Server
} from 'lucide-react';

interface BackupProps {
  user: { username: string; role: 'admin' | 'staff'; name: string; email: string } | null;
  onRefreshAllData: () => Promise<void>;
  dbType: 'mysql' | 'json';
}

export default function BackupPanel({ user, onRefreshAllData, dbType }: BackupProps) {
  const [loadingBackup, setLoadingBackup] = useState(false);
  const [loadingRestore, setLoadingRestore] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDownloadBackup = async () => {
    try {
      setLoadingBackup(true);
      setStatusMessage(null);
      
      const res = await fetch('/api/system/backup');
      if (!res.ok) {
        throw new Error('Gagal mengunduh berkas cadangan dari server');
      }
      
      const data = await res.json();
      const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(
        JSON.stringify(data, null, 2)
      )}`;
      
      const downloadAnchor = document.createElement('a');
      downloadAnchor.setAttribute('href', jsonString);
      
      const dateStr = new Date().toISOString().slice(0, 10);
      downloadAnchor.setAttribute('download', `simrs_medika_backup_${dateStr}.json`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
      
      setStatusMessage({ 
        type: 'success', 
        text: 'Pencadangan berhasil! Berkas JSON telah disimpan ke perangkat Anda.' 
      });
    } catch (err: any) {
      setStatusMessage({ 
        type: 'error', 
        text: err.message || 'Terjadi kesalahan saat mengekspor database.' 
      });
    } finally {
      setLoadingBackup(false);
    }
  };

  const handleRestoreUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!confirm('Peringatan: Proses ini akan menghapus data saat ini dan menggantinya dengan data dari file cadangan. Apakah Anda yakin ingin melanjutkan?')) {
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    try {
      setLoadingRestore(true);
      setStatusMessage(null);

      const reader = new FileReader();
      reader.onload = async (event) => {
        try {
          const parsedData = JSON.parse(event.target?.result as string);
          
          const res = await fetch('/api/system/restore', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(parsedData)
          });

          const resData = await res.json();
          if (!res.ok) {
            throw new Error(resData.error || 'Server menolak pemulihan data');
          }

          setStatusMessage({
            type: 'success',
            text: 'Database Berhasil Dipulihkan! Sinkronisasi data ulang selesai.'
          });

          // Refresh the global data structure
          await onRefreshAllData();
        } catch (innerErr: any) {
          setStatusMessage({
            type: 'error',
            text: 'Berkas JSON rusak atau tidak dikenali oleh skema sistem: ' + innerErr.message
          });
        } finally {
          setLoadingRestore(false);
          if (fileInputRef.current) fileInputRef.current.value = '';
        }
      };

      reader.readAsText(file);
    } catch (err: any) {
      setStatusMessage({
        type: 'error',
        text: 'Gagal memproses berkas unggahan: ' + err.message
      });
      setLoadingRestore(false);
    }
  };

  const triggerFileSelect = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="space-y-6">
      {/* Header Panel */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-950 font-sans">
            Backup & Pemulihan Sistem
          </h2>
          <p className="text-slate-500 text-sm mt-1">
            Ekspor seluruh basis data ke dalam file aman atau pulihkan kondisi RS dari cadangan sebelumnya.
          </p>
        </div>
      </div>

      {/* Database Connection Info Card */}
      <div className="bg-slate-900 text-white p-6 rounded-3xl relative overflow-hidden border border-slate-800 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="flex h-2.5 w-2.5 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
            </span>
            <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest font-mono">Terkoneksi</span>
          </div>
          <h3 className="text-lg font-bold font-sans">
            {dbType === 'mysql' ? 'MySQL Server Utama RS' : 'Fallback Database Relasional Lokal (simrs_db.json)'}
          </h3>
          <p className="text-slate-400 text-xs max-w-xl">
            Sistem Anda menyimpan data rekam medis, akun pengguna, apotek, transaksi kasir, dan jadwal dokter di backend server secara realtime.
          </p>
        </div>
        <div className="bg-slate-800/60 border border-slate-700/50 p-4 rounded-2xl shrink-0 flex items-center gap-3">
          <Server className="w-8 h-8 text-emerald-400 stroke-[1.5]" />
          <div>
            <div className="text-[10px] font-mono text-slate-500 uppercase">Engine Driver</div>
            <div className="text-xs font-bold text-slate-200 mt-0.5 capitalize">{dbType === 'mysql' ? 'MySQL Dev' : 'TypeScript JSON-Query'}</div>
          </div>
        </div>
      </div>

      {/* Global Toast Alerts */}
      {statusMessage && (
        <div className={`p-4 rounded-2xl border flex items-start gap-3 animate-in fade-in duration-150 ${
          statusMessage.type === 'success' 
            ? 'bg-emerald-50 border-emerald-100 text-emerald-800' 
            : 'bg-rose-50 border-rose-100 text-rose-800'
        }`}>
          {statusMessage.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
          ) : (
            <AlertTriangle className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
          )}
          <div>
            <p className="text-sm font-semibold">{statusMessage.type === 'success' ? 'Proses Berhasil' : 'Kendala Proses'}</p>
            <p className="text-xs text-slate-600 mt-1 leading-relaxed">{statusMessage.text}</p>
          </div>
        </div>
      )}

      {/* Dual Bento Grid - Action Columns */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Card 1: Ekspor Backup */}
        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs flex flex-col justify-between space-y-6">
          <div className="space-y-3">
            <div className="w-12 h-12 bg-indigo-50 border border-indigo-100 rounded-2xl flex items-center justify-center text-indigo-600">
              <Download className="w-6 h-6 stroke-[2]" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 font-sans">Ekspor Cadangan (Download Backup)</h3>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Unduh seluruh dataset dalam bentuk file tunggal <strong className="font-mono">.json</strong>. Penyimpanan mandiri sangat berguna untuk audit arsip eksternal atau sebelum pemeliharaan rutin.
              </p>
            </div>
            
            <div className="bg-slate-50 p-4 rounded-2xl space-y-2">
              <div className="flex items-center gap-2 text-xs text-slate-600">
                <Clock className="w-4 h-4 text-indigo-500 shrink-0" />
                <span>Format cadangan: <strong className="font-mono">JSON Terkompresi</strong></span>
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-600">
                <ShieldCheck className="w-4 h-4 text-indigo-500 shrink-0" />
                <span>Berisi data: Dokter, Pasien, Antrean, Resep, & Kasir</span>
              </div>
            </div>
          </div>

          <button
            onClick={handleDownloadBackup}
            disabled={loadingBackup}
            className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm py-3 px-4 rounded-xl transition shadow-md shadow-indigo-600/10 hover:shadow-indigo-600/20 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {loadingBackup ? (
              <>
                <RefreshCw className="w-4.5 h-4.5 animate-spin" />
                Mengompilasi Data...
              </>
            ) : (
              <>
                <Download className="w-4.5 h-4.5" />
                Unduh Cadangan Database (.json)
              </>
            )}
          </button>
        </div>

        {/* Card 2: Impor/Pemulihan */}
        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs flex flex-col justify-between space-y-6">
          <div className="space-y-3">
            <div className="w-12 h-12 bg-emerald-50 border border-emerald-100 rounded-2xl flex items-center justify-center text-emerald-600">
              <UploadCloud className="w-6 h-6 stroke-[2]" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 font-sans">Pulihkan Cadangan (Restore Database)</h3>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Unggah file cadangan <strong className="font-mono">.json</strong> yang valid untuk menimpa seluruh data saat ini. Sempurna jika Anda ingin membatalkan kesalahan fatal atau migrasi data cepat.
              </p>
            </div>
            
            {user?.role !== 'admin' ? (
              <div className="bg-amber-50 border border-amber-100 p-4 rounded-2xl flex gap-2.5 text-amber-800 text-[11px] leading-relaxed">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <span>Hanya pengguna dengan peran <strong className="font-semibold">Administrator (Admin)</strong> yang memiliki wewenang untuk menimpa data master rumah sakit secara keseluruhan.</span>
              </div>
            ) : (
              <div className="bg-rose-50 border border-rose-100 p-4 rounded-2xl flex gap-2.5 text-rose-800 text-[11px] leading-relaxed">
                <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <span><strong>PERINGATAN:</strong> Tindakan ini destruktif! Data real di server database relasional akan dihapus bersih (TRUNCATE) sebelum memasukkan data dari file unggahan Anda.</span>
              </div>
            )}
          </div>

          <div className="space-y-2">
            <input 
              type="file" 
              ref={fileInputRef}
              onChange={handleRestoreUpload}
              accept=".json"
              className="hidden"
            />
            <button
              onClick={triggerFileSelect}
              disabled={loadingRestore || user?.role !== 'admin'}
              className="w-full bg-slate-900 hover:bg-slate-800 text-white font-semibold text-sm py-3 px-4 rounded-xl transition shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {loadingRestore ? (
                <>
                  <RefreshCw className="w-4.5 h-4.5 animate-spin" />
                  Memulihkan Data...
                </>
              ) : (
                <>
                  <UploadCloud className="w-4.5 h-4.5" />
                  Unggah & Pulihkan Database (.json)
                </>
              )}
            </button>
          </div>
        </div>

      </div>

      {/* Structural integrity schema notice footer */}
      <div className="bg-slate-100/70 rounded-2xl p-5 border border-slate-200/60 leading-relaxed text-xs text-slate-600 space-y-2">
        <h4 className="font-bold text-slate-800">Skema Standar Terpadu SIM RS Medika:</h4>
        <p>Prosedur ekspor ini secara otomatis mengemas model relasi multi-tabel menjadi satu struktur logis yang dapat dipertukarkan. Ketika cadangan dipulihkan, integritas data dan relasi foreign key antara rekam medis dokter, kuitansi billing kasir, dan sediaan obat apotek tetap dipertahankan dengan urutan insert yang aman.</p>
      </div>

    </div>
  );
}

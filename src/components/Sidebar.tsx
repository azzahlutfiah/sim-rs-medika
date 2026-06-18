import React from 'react';
import { 
  LayoutDashboard, 
  Users, 
  UserCheck, 
  ReceiptText, 
  Pill, 
  Database,
  HeartPulse, 
  Activity,
  LogOut
} from 'lucide-react';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  dbType: 'mysql' | 'json';
  user: { username: string; role: 'admin' | 'staff'; name: string; email: string } | null;
  onLogout: () => void;
}

export default function Sidebar({ activeTab, setActiveTab, dbType, user, onLogout }: SidebarProps) {
  const menuItems = [
    { id: 'dashboard', name: 'Dashboard', icon: LayoutDashboard, desc: 'Metrik & Info Antrean' },
    { id: 'patients', name: 'Pasien & Rekam Medis', icon: Users, desc: 'Pendaftaran & Riwayat Klinis' },
    { id: 'doctors', name: 'Jadwal Dokter', icon: UserCheck, desc: 'Manajemen Spesialis & Ruang' },
    { id: 'pharmacy', name: 'Apotek & Obat', icon: Pill, desc: 'Stok Obat & Resep Pasien' },
    { id: 'billing', name: 'Kasir & Billing', icon: ReceiptText, desc: 'Pelunasan & Invoice Tagihan' },
    { id: 'backup', name: 'Backup & Pemulihan', icon: Database, desc: 'Pencadangan Berkas Database' },
  ];

  return (
    <aside className="w-80 bg-slate-900 text-white min-h-screen flex flex-col justify-between border-r border-slate-800 shadow-xl">
      <div>
        {/* Header Branding */}
        <div className="p-6 border-b border-slate-800 flex items-center gap-3 bg-slate-950/40">
          <div className="p-2.5 bg-emerald-500 rounded-xl text-slate-950 shadow-md shadow-emerald-500/20">
            <HeartPulse className="w-6 h-6" />
          </div>
          <div>
            <h1 className="font-sans font-bold tracking-tight text-white text-lg">SIM RS Medika</h1>
            <p className="text-xs text-slate-400 font-mono">Sistem Manajemen Klinik</p>
          </div>
        </div>

        {/* Database Status Alert Badge */}
        <div className="mx-4 mt-5 p-3.5 rounded-2xl bg-slate-850 bg-slate-800/60 border border-slate-700/50 flex items-center gap-2.5">
          <div className={`w-3 h-3 rounded-full animate-pulse shrink-0 ${dbType === 'mysql' ? 'bg-emerald-400' : 'bg-amber-400'}`}></div>
          <div className="min-w-0">
            <p className="text-[11px] uppercase font-mono text-slate-400 tracking-wider">Database Terkoneksi</p>
            <p className="text-xs font-semibold text-slate-200 capitalize truncate">
              {dbType === 'mysql' ? 'MySQL Database (Aktif)' : 'JSON Relasional (Fallback)'}
            </p>
          </div>
        </div>

        {/* Menu Navigation */}
        <nav className="px-3 mt-6 space-y-1">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center gap-4 px-4 py-3.5 rounded-2xl transition-all duration-200 group text-left ${
                  isActive 
                    ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/10 font-medium' 
                    : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-100'
                }`}
              >
                <Icon className={`w-5 h-5 shrink-0 transition-transform duration-200 group-hover:scale-105 ${
                  isActive ? 'text-white' : 'text-slate-400 group-hover:text-slate-100'
                }`} />
                <div className="min-w-0">
                  <p className="text-sm font-sans leading-tight">{item.name}</p>
                  <p className={`text-[10px] leading-tight truncate mt-0.5 ${isActive ? 'text-emerald-100/80': 'text-slate-500 group-hover:text-slate-400'}`}>{item.desc}</p>
                </div>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Footer User Profile & Logout section */}
      <div className="p-4 border-t border-slate-800 bg-slate-950/20 flex flex-col gap-3.5">
        {user && (
          <div className="flex flex-col gap-2.5 p-3 rounded-2xl bg-slate-800/40 border border-slate-800/80">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-xl bg-slate-800/80 border border-slate-700 font-bold text-slate-200 flex items-center justify-center font-sans tracking-wide shrink-0">
                {user.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-bold text-slate-100 truncate leading-tight">{user.name}</p>
                <div className="flex items-center gap-1.5 mt-1">
                  <span className={`text-[9px] font-extrabold uppercase tracking-widest px-1.5 py-0.5 rounded-md ${
                    user.role === 'admin' 
                      ? 'bg-indigo-500/25 text-indigo-400 border border-indigo-500/30' 
                      : 'bg-emerald-500/25 text-emerald-400 border border-emerald-500/30'
                  }`}>
                    {user.role}
                  </span>
                  <span className="text-[10px] text-slate-500 font-mono">@{user.username}</span>
                </div>
              </div>
            </div>

            <button
              id="sidebar-logout-button"
              onClick={onLogout}
              className="w-full py-2 px-3 hover:bg-rose-500/10 border border-transparent hover:border-rose-500/20 text-slate-400 hover:text-rose-400 rounded-xl transition-all duration-150 text-[11px] font-bold flex items-center justify-center gap-2 cursor-pointer mt-1"
            >
              <LogOut className="w-3.5 h-3.5" />
              Keluar Sesi
            </button>
          </div>
        )}

        <div className="flex items-center justify-between px-1 text-[10px] text-slate-500 font-mono">
          <div className="flex items-center gap-1.5">
            <Activity className="w-3.5 h-3.5 text-emerald-500 animate-pulse" />
            <span>v1.3.0 Standard</span>
          </div>
          <span>SIM RS Medika</span>
        </div>
      </div>
    </aside>
  );
}

import React, { useState } from 'react';
import { Shield, Users, Lock, ChevronRight, Activity, AlertCircle } from 'lucide-react';

interface LoginProps {
  onLoginSuccess: (user: { username: string; role: 'admin' | 'staff'; name: string; email: string }) => void;
}

export default function Login({ onLoginSuccess }: LoginProps) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
      setError('Harap lengkapi semua bidang!');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Autentikasi gagal');
      }

      onLoginSuccess(data.user);
    } catch (err: any) {
      setError(err.message || 'Koneksi ke server gagal. Pastikan server aktif.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = (role: 'admin' | 'staff') => {
    if (role === 'admin') {
      setUsername('admin');
      setPassword('admin');
    } else {
      setUsername('staf');
      setPassword('staf');
    }
    setError('');
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8 font-sans transition-all duration-300">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center space-y-2">
        <div className="inline-flex items-center justify-center p-3.5 bg-emerald-50 rounded-3xl text-emerald-600 shadow-sm border border-emerald-100 mb-2">
          <Activity className="w-8 h-8 animate-pulse stroke-[2.5]" />
        </div>
        <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">
          Medika SIM RS
        </h2>
        <p className="text-slate-500 text-sm max-w-xs mx-auto">
          Sistem Informasi Manajemen Rumah Sakit Terpadu & Rekam Medis Digital
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-xl">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 bg-white sm:rounded-3xl shadow-xl border border-slate-200/60 overflow-hidden">
          
          {/* Main Login Form Area */}
          <div className="p-8 md:col-span-12 space-y-6">
            <div className="space-y-1">
              <h3 className="text-lg font-bold text-slate-800">Selamat Datang Kembali</h3>
              <p className="text-xs text-slate-500">Silakan masukkan akun Anda untuk mengakses sistem medis terintegrasi.</p>
            </div>

            {error && (
              <div id="login-error-alert" className="p-4 bg-rose-50 border border-rose-100 rounded-2xl flex items-start gap-3 text-rose-700 text-xs leading-relaxed animate-shake">
                <AlertCircle className="w-4.5 h-4.5 text-rose-500 shrink-0 mt-0.5" />
                <span className="font-medium">{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Username</label>
                <div className="relative">
                  <input
                    id="username-input"
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Contoh: admin atau staf"
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-3 px-4 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all font-sans"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Password</label>
                <div className="relative">
                  <input
                    id="password-input"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Masukkan sandi..."
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-3 px-4 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all font-sans"
                    required
                  />
                </div>
              </div>

              <button
                id="login-submit-button"
                type="submit"
                disabled={loading}
                className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white font-medium rounded-2xl text-sm transition-all duration-150 shadow-md shadow-emerald-600/10 hover:shadow-emerald-600/20 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed mt-2"
              >
                {loading ? 'Memvalidasi Sesi...' : 'Masuk ke Dashboard'}
                <ChevronRight className="w-4.5 h-4.5" />
              </button>
            </form>

            <div className="relative flex py-2 items-center">
              <div className="flex-grow border-t border-slate-100"></div>
              <span className="flex-shrink mx-4 text-slate-400 text-[10px] uppercase font-mono tracking-wider">Metode Akses Demo</span>
              <div className="flex-grow border-t border-slate-100"></div>
            </div>

            {/* Quick Demo Access (Bento Style Sub-cards) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Card Admin */}
              <button
                id="quick-login-admin"
                type="button"
                onClick={() => handleQuickLogin('admin')}
                className="group p-4 rounded-2xl border border-indigo-100 bg-indigo-50/20 hover:bg-indigo-50/50 hover:border-indigo-200 transition-all text-left flex flex-col justify-between h-40 relative overflow-hidden cursor-pointer"
              >
                <div className="w-8 h-8 rounded-xl bg-indigo-500/10 text-indigo-600 flex items-center justify-center group-hover:scale-105 transition-transform">
                  <Shield className="w-4.5 h-4.5 stroke-[2]" />
                </div>
                <div className="mt-4">
                  <h4 className="text-xs font-bold text-slate-800 uppercase tracking-widest font-mono">Akses Administrator</h4>
                  <p className="text-[11px] text-slate-500 leading-normal mt-1">Gunakan akun ini untuk hak akses penuh: <strong className="text-indigo-600 font-semibold font-mono">CRUD penuh</strong> (Create, Read, Update, Delete) di semua modul.</p>
                </div>
                <div className="absolute right-3 top-3 text-[10px] font-semibold text-indigo-600 uppercase tracking-wider bg-indigo-50 px-2 py-0.5 rounded-full">
                  Admin
                </div>
              </button>

              {/* Card Staff */}
              <button
                id="quick-login-staff"
                type="button"
                onClick={() => handleQuickLogin('staff')}
                className="group p-4 rounded-2xl border border-emerald-100 bg-emerald-50/10 hover:bg-emerald-50/30 hover:border-emerald-200 transition-all text-left flex flex-col justify-between h-40 relative overflow-hidden cursor-pointer"
              >
                <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center group-hover:scale-105 transition-transform">
                  <Users className="w-4.5 h-4.5 stroke-[2]" />
                </div>
                <div className="mt-4">
                  <h4 className="text-xs font-bold text-slate-800 uppercase tracking-widest font-mono">Akses Operator Staf</h4>
                  <p className="text-[11px] text-slate-500 leading-normal mt-1">Diberikan untuk operasional medis: <strong className="text-emerald-600 font-semibold font-mono">Registrasi & Rekam</strong>, namun dibatasi dari menghapus data.</p>
                </div>
                <div className="absolute right-3 top-3 text-[10px] font-semibold text-emerald-600 uppercase tracking-wider bg-emerald-50 px-2 py-0.5 rounded-full">
                  Staf
                </div>
              </button>
            </div>
            
            <div className="text-center">
              <span className="text-[10px] font-mono text-slate-400">
                Pintu Keamanan Terenkripsi SIM RS Medika • Hak Cipta &copy; {new Date().getFullYear()}
              </span>
            </div>

          </div>

        </div>
      </div>
    </div>
  );
}

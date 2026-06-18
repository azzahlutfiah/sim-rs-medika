import React, { useState } from 'react';
import { 
  Pill, 
  Plus, 
  AlertTriangle, 
  Package, 
  ArrowUpRight, 
  ShoppingBag,
  TrendingDown,
  Activity,
  Tag,
  Edit,
  Trash,
  X
} from 'lucide-react';
import { Medicine } from '../types';

interface PharmacyProps {
  medicines: Medicine[];
  loading: boolean;
  user: { username: string; role: 'admin' | 'staff'; name: string; email: string } | null;
  onAddMedicine: (medicineData: Partial<Medicine>) => Promise<any>;
  onRestockMedicine: (id: number, qty: number) => Promise<void>;
  onUpdateMedicine: (id: number, medicineData: Partial<Medicine>) => Promise<void>;
  onDeleteMedicine: (id: number) => Promise<void>;
  onRefresh: () => void;
}

export default function Pharmacy({
  medicines,
  loading,
  user,
  onAddMedicine,
  onRestockMedicine,
  onUpdateMedicine,
  onDeleteMedicine,
  onRefresh
}: PharmacyProps) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [restockItemId, setRestockItemId] = useState<number | null>(null);
  const [restockQty, setRestockQty] = useState('50');

  // States Edit Obat
  const [editingMedicine, setEditingMedicine] = useState<Medicine | null>(null);
  const [editMedName, setEditMedName] = useState('');
  const [editMedCategory, setEditMedCategory] = useState('Analgesik/Antipiretik');
  const [editMedStock, setEditMedStock] = useState('100');
  const [editMedPrice, setEditMedPrice] = useState('5000');
  const [editMedUnit, setEditMedUnit] = useState('Tablet');
  const [isSavingEdit, setIsSavingEdit] = useState(false);

  const startEditMedicine = (med: Medicine) => {
    setEditingMedicine(med);
    setEditMedName(med.name);
    setEditMedCategory(med.category);
    setEditMedStock(String(med.stock));
    setEditMedPrice(String(med.price));
    setEditMedUnit(med.unit);
  };

  const handleSaveEditMedicine = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingMedicine) return;
    try {
      setIsSavingEdit(true);
      await onUpdateMedicine(editingMedicine.id, {
        name: editMedName,
        category: editMedCategory,
        stock: parseInt(editMedStock) || 0,
        price: parseInt(editMedPrice) || 0,
        unit: editMedUnit
      });
      setEditingMedicine(null);
    } catch (err: any) {
      alert(err.message || 'Gagal memperbarui data obat');
    } finally {
      setIsSavingEdit(false);
    }
  };

  const handleDeleteMedicineTrigger = async (id: number, name: string) => {
    if (confirm(`Apakah Anda yakin ingin menghapus sediaan obat: "${name}"? Tindakan ini tidak dapat dibatalkan.`)) {
      try {
        await onDeleteMedicine(id);
      } catch (err: any) {
        alert(err.message || 'Gagal menghapus data obat');
      }
    }
  };

  // Input states obat baru
  const [medName, setMedName] = useState('');
  const [medCategory, setMedCategory] = useState('Analgesik/Antipiretik');
  const [medStock, setMedStock] = useState('100');
  const [medPrice, setMedPrice] = useState('5000');
  const [medUnit, setMedUnit] = useState('Tablet');
  const [submitting, setSubmitting] = useState(false);

  const categories = [
    'Analgesik/Antipiretik',
    'Antibiotik',
    'Antasida',
    'Anti-Sekresi',
    'Antihipertensi',
    'Antihistamin',
    'Vitamin & Suplemen'
  ];

  const units = ['Tablet', 'Kapsul', 'Botol (Sirup)', 'Tube (Salep)', 'Sachet', 'Ampul'];

  const handleCreateMedicine = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!medName || !medPrice || !medStock) {
      alert('Nama, Harga, dan Stok awal wajib diisi!');
      return;
    }

    try {
      setSubmitting(true);
      await onAddMedicine({
        name: medName,
        category: medCategory,
        stock: parseInt(medStock, 10),
        price: parseFloat(medPrice),
        unit: medUnit
      });

      // Clear
      setMedName('');
      setMedStock('100');
      setMedPrice('5000');
      setMedCategory('Analgesik/Antipiretik');
      setMedUnit('Tablet');
      setShowAddForm(false);
      onRefresh();
      alert('Sediaan Obat baru berhasil dicatatkan!');
    } catch (e) {
      console.error(e);
      alert('Gagal mencatat obat baru');
    } finally {
      setSubmitting(false);
    }
  };

  const handleRestock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (restockItemId === null || !restockQty) return;

    try {
      await onRestockMedicine(restockItemId, parseInt(restockQty, 10));
      setRestockItemId(null);
      setRestockQty('50');
      onRefresh();
      alert('Stok sediaan obat berhasil disesuaikan!');
    } catch (error) {
      console.error(error);
      alert('Gagal menambah restock obat');
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex justify-between items-center bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 font-sans tracking-tight">Gudang Farmasi & Apotek Medika</h2>
          <p className="text-slate-500 text-sm mt-0.5">Stok Sediaan Obat, Daftar Satuan unit, Pengendalian Resep & Pengisian Ulang Stok</p>
        </div>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-xl text-sm font-semibold hover:bg-emerald-700 transition shadow-md shadow-emerald-500/10"
        >
          <Pill className="w-4.5 h-4.5" />
          {showAddForm ? 'Tutup Formulir' : 'Catat Sediaan Obat Baru'}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Kolom Kiri/Tengah: Daftar Sediaan Apotek */}
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 lg:col-span-2 space-y-4">
          <h3 className="font-bold text-slate-900 font-sans flex items-center gap-2 pb-3 border-b border-rose-50 border-slate-100">
            <Package className="w-5 h-5 text-emerald-500" />
            Katalog Formularium & sediaan Obat Aktif ({medicines.length} Obat)
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
            {loading ? (
              <div className="col-span-2 py-12 text-center text-slate-400 text-sm">Menghubungkan data apotek...</div>
            ) : medicines.length === 0 ? (
              <div className="col-span-2 py-16 text-center text-slate-400 text-sm">Belum ada sediaan obat terdaftar.</div>
            ) : (
              medicines.map((med) => {
                const isShortage = med.stock <= 15;
                return (
                  <div 
                    key={med.id}
                    className={`p-5 rounded-3xl border transition-all flex flex-col justify-between ${
                      isShortage 
                        ? 'bg-rose-50/10 border-rose-200 hover:border-rose-300' 
                        : 'bg-slate-50/30 border-slate-150 hover:border-slate-200'
                    }`}
                  >
                    <div>
                      {/* Code, category & Status */}
                      <div className="flex justify-between items-center">
                        <span className="font-mono text-[10px] text-slate-400 uppercase tracking-widest">{med.code}</span>
                        <span className="text-[10px] font-semibold text-slate-500 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded-md">
                          {med.category}
                        </span>
                      </div>

                      {/* Name & ID */}
                      <div className="mt-2.5">
                        <h4 className="font-bold text-slate-900 text-base font-sans">{med.name}</h4>
                        <p className="text-emerald-700 text-xs font-semibold mt-1">
                          {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(med.price)} / {med.unit}
                        </p>
                      </div>

                      {/* Stock Indicator */}
                      <div className="mt-4 flex items-center gap-2.5">
                        <div className={`px-3 py-1 rounded-lg text-xs font-mono font-bold ${
                          isShortage 
                            ? 'bg-rose-100 text-rose-700 animate-pulse' 
                            : 'bg-emerald-50 text-emerald-700'
                        }`}>
                          Stok: {med.stock} {med.unit}
                        </div>
                        {isShortage && (
                          <span className="text-[10px] text-red-500 font-semibold flex items-center gap-1">
                            <AlertTriangle className="w-3 h-3 shrink-0" />
                            Stok Kritis!
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Actions Restock */}
                    <div className="mt-5 pt-3 border-t border-slate-100 flex gap-2 justify-end" onClick={(e)=>e.stopPropagation()}>
                      {restockItemId === med.id ? (
                        <form onSubmit={handleRestock} className="w-full flex items-center gap-1.5 pt-1">
                          <input
                            type="number"
                            min="1"
                            value={restockQty}
                            onChange={(e) => setRestockQty(e.target.value)}
                            className="w-16 px-2 py-1 text-xs border border-slate-200 rounded font-mono text-center focus:outline-none focus:border-emerald-500 text-slate-800"
                            placeholder="Qty"
                            required
                          />
                          <button
                            type="submit"
                            className="bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-bold px-2.5 py-1.5 rounded transition cursor-pointer"
                          >
                            Tambah
                          </button>
                          <button
                            type="button"
                            onClick={() => setRestockItemId(null)}
                            className="text-slate-400 hover:text-slate-600 text-[10px] px-1 py-1 cursor-pointer"
                          >
                            Batal
                          </button>
                        </form>
                      ) : (
                        <div className="flex gap-1.5 items-center justify-between w-full flex-wrap sm:flex-nowrap">
                          {/* Inner edit/delete buttons */}
                          <div className="flex gap-1.5">
                            <button
                              type="button"
                              onClick={() => startEditMedicine(med)}
                              className="px-2 py-1.5 text-[10px] font-bold uppercase text-sky-700 bg-sky-50 hover:bg-sky-100 rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
                              title="Edit Detail Obat"
                            >
                              <Edit className="w-3 h-3" />
                              Edit
                            </button>

                            {user?.role === 'admin' && (
                              <button
                                type="button"
                                onClick={() => handleDeleteMedicineTrigger(med.id, med.name)}
                                className="px-2 py-1.5 text-[10px] font-bold uppercase text-rose-700 bg-rose-50 hover:bg-rose-100 rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
                                title="Hapus Sediaan Obat"
                              >
                                <Trash className="w-3 h-3" />
                                Hapus
                              </button>
                            )}
                          </div>

                          <button
                            type="button"
                            onClick={() => setRestockItemId(med.id)}
                            className="px-2.5 py-1.5 text-[10px] uppercase font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-lg transition-colors flex items-center gap-1 shrink-0 cursor-pointer"
                          >
                            <ArrowUpRight className="w-3.5 h-3.5" />
                            Stok
                          </button>
                        </div>
                      )}
                    </div>

                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Kolom Kanan: Tambah Obat */}
        <div className="space-y-6">
          {showAddForm ? (
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
              <h3 className="font-bold text-slate-900 border-b border-slate-100 pb-3 flex items-center gap-2">
                <Plus className="w-4.5 h-4.5 text-emerald-500" />
                Tambah Obat Baru
              </h3>

              <form onSubmit={handleCreateMedicine} className="space-y-4">
                {/* Nama Obat */}
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Nama Dagang Obat</label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: Amoxicillin 500mg"
                    value={medName}
                    onChange={(e) => setMedName(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-emerald-500 text-slate-800 font-medium"
                  />
                </div>

                {/* Kategori */}
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Kategori Terapi</label>
                  <select
                    value={medCategory}
                    onChange={(e) => setMedCategory(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-emerald-500 text-slate-705"
                  >
                    {categories.map((cat, i) => (
                      <option key={i} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>

                {/* Unit Sediaan */}
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Satuan Unit Sediaan</label>
                  <select
                    value={medUnit}
                    onChange={(e) => setMedUnit(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-emerald-500 text-slate-725"
                  >
                    {units.map((unit, i) => (
                      <option key={i} value={unit}>{unit}</option>
                    ))}
                  </select>
                </div>

                {/* Grid Harga & Stok */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Stok Awal</label>
                    <input
                      type="number"
                      required
                      min="1"
                      placeholder="e.g. 100"
                      value={medStock}
                      onChange={(e) => setMedStock(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-emerald-500 font-mono text-center"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Harga Jual (Rp)</label>
                    <input
                      type="number"
                      required
                      min="1"
                      placeholder="e.g. 5000"
                      value={medPrice}
                      onChange={(e) => setMedPrice(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-emerald-500 font-mono text-center"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-semibold shadow-md shadow-emerald-500/10 transition-colors"
                >
                  {submitting ? 'Sedang Memproses...' : 'Catat ke Formularium'}
                </button>
              </form>
            </div>
          ) : (
            <div className="bg-slate-900 text-white p-6 rounded-3xl border border-slate-800 space-y-4">
              <h4 className="font-semibold text-sm">Automasi Alur Resep</h4>
              <p className="text-slate-400 text-xs leading-relaxed">
                SIM RS Medika mengadopsi integrasi resep otomatis. Ketika dokter poliklinik menginput diagnoses dan mengeluarkan resep rekam medis:
              </p>
              <ul className="list-disc list-inside text-[11px] text-slate-400 leading-normal space-y-1">
                <li>Sistem otomatis memotong stok sediaan obat di sini secara instan.</li>
                <li>Jika jumlah sediaan obat di bawah atau sama dengan 15, indikator stok kritis akan memancar di dashboard poliklinik.</li>
                <li>Biaya obat-obatan akan dihitung akurat berdasarkan tarif per unit dan dikirimkan ke modul Keuangan Kasir sebagai invoice belum terbayar.</li>
              </ul>
            </div>
          )}
        </div>
      </div>

      {/* Modal Edit Obat */}
      {editingMedicine && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-md w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150 text-left">
            <div className="px-6 py-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-amber-50 rounded-xl text-amber-600 border border-amber-100">
                  <Edit className="w-5 h-5 text-amber-600" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-950 font-sans">Ubah Detail Sediaan Obat</h3>
                  <p className="text-slate-400 text-xs mt-0.5">Ubah stok, harga jual, dan nama obat</p>
                </div>
              </div>
              <button 
                type="button"
                onClick={() => setEditingMedicine(null)}
                className="p-1.5 hover:bg-slate-100 rounded-full text-slate-400 hover:text-slate-600 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEditMedicine} className="p-6 space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Nama Paten / Obat</label>
                <input
                  type="text"
                  required
                  value={editMedName}
                  onChange={(e) => setEditMedName(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:border-emerald-500 focus:outline-none font-medium text-slate-800"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Golongan / Kategori</label>
                <select
                  value={editMedCategory}
                  onChange={(e) => setEditMedCategory(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 bg-white rounded-xl text-sm focus:border-emerald-500 focus:outline-none text-slate-800"
                >
                  {categories.map((cat, i) => (
                    <option key={i} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Satuan Unit</label>
                <select
                  value={editMedUnit}
                  onChange={(e) => setEditMedUnit(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 bg-white rounded-xl text-sm focus:border-emerald-500 focus:outline-none text-slate-800"
                >
                  {units.map((unit, i) => (
                    <option key={i} value={unit}>{unit}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Stok Tersedia</label>
                  <input
                    type="number"
                    required
                    min="0"
                    value={editMedStock}
                    onChange={(e) => setEditMedStock(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:border-emerald-500 focus:outline-none font-mono text-center text-slate-800"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Harga Jual (Rp)</label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={editMedPrice}
                    onChange={(e) => setEditMedPrice(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:border-emerald-500 focus:outline-none font-mono text-center text-slate-800"
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingMedicine(null)}
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

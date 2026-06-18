import express from "express";
import path from "path";
import dotenv from "dotenv";
import { createServer as createViteServer } from "vite";
import {
  initializeDatabase,
  getDoctors,
  addDoctor,
  updateDoctorStatus,
  getPatients,
  addPatient,
  getAppointments,
  addAppointment,
  updateAppointmentStatus,
  getMedicalRecords,
  addMedicalRecord,
  getMedicines,
  addMedicine,
  restockMedicine,
  getBilling,
  processPayment,
  addBilling,
  updateBilling,
  deleteBilling,
  getDashboardStats,
  updateDoctor,
  deleteDoctor,
  updatePatient,
  deletePatient,
  updateAppointment,
  deleteAppointment,
  updateMedicine,
  deleteMedicine,
  importBackupData
} from "./src/backend/db.ts";

// Muat variabel lingkungan
dotenv.config();

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Middleware wajib untuk parse body
  app.use(express.json());

  // Inisialisasi Database
  await initializeDatabase();

  // -------------------------------------------------------------
  // API ENDPOINTS (Diletakkan SEBELUM middleware Vite)
  // -------------------------------------------------------------

  // Endpoint Login Admin & User (Staff)
  app.post("/api/auth/login", (req, res) => {
    const { username, password } = req.body;
    
    if (!username || !password) {
      return res.status(400).json({ error: "Username dan password wajib diisi" });
    }

    const uLower = username.toLowerCase();
    
    // Check Admin credentials
    if (uLower === "admin" && password === "admin") {
      return res.json({
        success: true,
        user: {
          username: "admin",
          role: "admin",
          name: "Administrator Medika",
          email: "admin@medika.com"
        }
      });
    }
    
    // Check User / Staff credentials
    if ((uLower === "staf" || uLower === "staff" || uLower === "user") && (password === "staf" || password === "staff" || password === "staf123" || password === "user123")) {
      return res.json({
        success: true,
        user: {
          username: "staf",
          role: "staff",
          name: "Staf Medika",
          email: "staf@medika.com"
        }
      });
    }

    return res.status(401).json({ error: "Username atau password yang Anda masukkan salah!" });
  });

  // 1. Endpoint Statistik Dashboard
  app.get("/api/stats", async (req, res) => {
    try {
      const stats = await getDashboardStats();
      res.json(stats);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // 2. Endpoint Dokter
  app.get("/api/doctors", async (req, res) => {
    try {
      const docs = await getDoctors();
      res.json(docs);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/doctors", async (req, res) => {
    try {
      const newDoc = await addDoctor(req.body);
      res.status(201).json(newDoc);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.put("/api/doctors/:id/status", async (req, res) => {
    try {
      const id = parseInt(req.params.id, 10);
      const { status } = req.body;
      const success = await updateDoctorStatus(id, status);
      if (success) {
        res.json({ message: "Status dokter berhasil diperbarui" });
      } else {
        res.status(404).json({ error: "Dokter tidak ditemukan" });
      }
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.put("/api/doctors/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id, 10);
      const success = await updateDoctor(id, req.body);
      if (success) {
        res.json({ message: "Data dokter berhasil diperbarui" });
      } else {
        res.status(404).json({ error: "Dokter tidak ditemukan" });
      }
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.delete("/api/doctors/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id, 10);
      const success = await deleteDoctor(id);
      if (success) {
        res.json({ message: "Dokter berhasil dihapus" });
      } else {
        res.status(404).json({ error: "Dokter tidak ditemukan" });
      }
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // 3. Endpoint Pasien
  app.get("/api/patients", async (req, res) => {
    try {
      const pats = await getPatients();
      res.json(pats);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/patients", async (req, res) => {
    try {
      const newPat = await addPatient(req.body);
      res.status(201).json(newPat);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.put("/api/patients/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id, 10);
      const success = await updatePatient(id, req.body);
      if (success) {
        res.json({ message: "Data pasien berhasil diperbarui" });
      } else {
        res.status(404).json({ error: "Pasien tidak ditemukan" });
      }
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.delete("/api/patients/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id, 10);
      const success = await deletePatient(id);
      if (success) {
        res.json({ message: "Pasien berhasil dihapus" });
      } else {
        res.status(404).json({ error: "Pasien tidak ditemukan" });
      }
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // 4. Endpoint Antrean / Appointments
  app.get("/api/appointments", async (req, res) => {
    try {
      const apps = await getAppointments();
      res.json(apps);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/appointments", async (req, res) => {
    try {
      const newApp = await addAppointment(req.body);
      res.status(201).json(newApp);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.put("/api/appointments/:id/status", async (req, res) => {
    try {
      const id = parseInt(req.params.id, 10);
      const { status } = req.body;
      const success = await updateAppointmentStatus(id, status);
      if (success) {
        res.json({ message: "Status antrean berhasil diperbarui" });
      } else {
        res.status(404).json({ error: "Antrean tidak ditemukan" });
      }
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.put("/api/appointments/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id, 10);
      const success = await updateAppointment(id, req.body);
      if (success) {
        res.json({ message: "Antrean berhasil diperbarui" });
      } else {
        res.status(404).json({ error: "Antrean tidak ditemukan" });
      }
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.delete("/api/appointments/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id, 10);
      const success = await deleteAppointment(id);
      if (success) {
        res.json({ message: "Antrean berhasil dihapus" });
      } else {
        res.status(404).json({ error: "Antrean tidak ditemukan" });
      }
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // 5. Endpoint Rekam Medis (Medical Records)
  app.get("/api/medical-records", async (req, res) => {
    try {
      const records = await getMedicalRecords();
      res.json(records);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/medical-records", async (req, res) => {
    try {
      const newRec = await addMedicalRecord(req.body);
      res.status(201).json(newRec);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // 6. Endpoint Apotek / Medicines
  app.get("/api/medicines", async (req, res) => {
    try {
      const meds = await getMedicines();
      res.json(meds);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/medicines", async (req, res) => {
    try {
      const newMed = await addMedicine(req.body);
      res.status(201).json(newMed);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.put("/api/medicines/:id/restock", async (req, res) => {
    try {
      const id = parseInt(req.params.id, 10);
      const { qty } = req.body;
      const success = await restockMedicine(id, qty);
      if (success) {
        res.json({ message: "Stok obat berhasil ditambah" });
      } else {
        res.status(404).json({ error: "Obat tidak ditemukan" });
      }
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.put("/api/medicines/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id, 10);
      const success = await updateMedicine(id, req.body);
      if (success) {
        res.json({ message: "Data obat berhasil diperbarui" });
      } else {
        res.status(404).json({ error: "Obat tidak ditemukan" });
      }
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.delete("/api/medicines/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id, 10);
      const success = await deleteMedicine(id);
      if (success) {
        res.json({ message: "Obat berhasil dihapus" });
      } else {
        res.status(404).json({ error: "Obat tidak ditemukan" });
      }
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // 7. Endpoint Keuangan / Billing / Kasir
  app.get("/api/billing", async (req, res) => {
    try {
      const billings = await getBilling();
      res.json(billings);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/billing", async (req, res) => {
    try {
      const newBill = await addBilling(req.body);
      res.status(201).json(newBill);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.put("/api/billing/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id, 10);
      const success = await updateBilling(id, req.body);
      if (success) {
        res.json({ message: "Invoices berhasil updated" });
      } else {
        res.status(404).json({ error: "Tagihan tidak ditemukan" });
      }
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.delete("/api/billing/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id, 10);
      const success = await deleteBilling(id);
      if (success) {
        res.json({ message: "Invoice tagihan berhasil dihapus" });
      } else {
        res.status(404).json({ error: "Invoice tidak ditemukan" });
      }
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.put("/api/billing/:id/pay", async (req, res) => {
    try {
      const id = parseInt(req.params.id, 10);
      const { paymentMethod } = req.body;
      const success = await processPayment(id, paymentMethod);
      if (success) {
        res.json({ message: "Pembayaran berhasil diproses" });
      } else {
        res.status(404).json({ error: "Tagihan tidak ditemukan" });
      }
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // 8. Backup & Restore Data System
  app.get("/api/system/backup", async (req, res) => {
    try {
      const backupObj = {
        doctors: await getDoctors(),
        patients: await getPatients(),
        appointments: await getAppointments(),
        medical_records: await getMedicalRecords(),
        medicines: await getMedicines(),
        billing: await getBilling(),
        backup_date: new Date().toISOString(),
        version: "v2.0"
      };
      res.json(backupObj);
    } catch (error: any) {
      res.status(500).json({ error: "Gagal membuat backup data: " + error.message });
    }
  });

  app.post("/api/system/restore", async (req, res) => {
    try {
      const backupData = req.body;
      if (!backupData || !backupData.doctors || !backupData.patients) {
        return res.status(400).json({ error: "Format berkas backup tidak valid!" });
      }
      await importBackupData(backupData);
      res.json({ message: "Data berhasil dipulihkan dari salinan cadangan!" });
    } catch (error: any) {
      res.status(500).json({ error: "Gagal memulihkan database: " + error.message });
    }
  });

  // -------------------------------------------------------------
  // PROSES VITE ATAU ASSET STATIC MIDDLEWARE
  // -------------------------------------------------------------
  if (process.env.NODE_ENV !== "production") {
    // Jalankan Vite Dev Server middleware
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    // Mode Produksi: Sajikan file terkompilasi dari folder dist
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  // Listening Port
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`🚀 SIM RS Server running on http://localhost:${PORT}`);
  });
}

startServer();

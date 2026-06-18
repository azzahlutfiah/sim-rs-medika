import fs from 'fs';
import path from 'path';
import mysql from 'mysql2/promise';

const JSON_DB_PATH = path.join(process.cwd(), 'data', 'simrs_db.json');

// Interface untuk data database lokal (fallback JSON)
interface LocalDbData {
  doctors: any[];
  patients: any[];
  appointments: any[];
  medical_records: any[];
  medicines: any[];
  billing: any[];
}

// Global MySQL connection pool reference
let mysqlPool: mysql.Pool | null = null;
let useMySQL = false;

// Kredensial MySQL dari environment (.env)
const mysqlConfig = {
  host: process.env.MYSQL_HOST || '',
  user: process.env.MYSQL_USER || '',
  password: process.env.MYSQL_PASSWORD || '',
  database: process.env.MYSQL_DATABASE || 'simrs_db',
  port: parseInt(process.env.MYSQL_PORT || '3306', 10),
};

// Inisialisasi Database (bisa MySQL atau fallback JSON)
export async function initializeDatabase() {
  if (mysqlConfig.host && mysqlConfig.user) {
    try {
      console.log(`Connecting to MySQL database at ${mysqlConfig.host}:${mysqlConfig.port}...`);
      mysqlPool = mysql.createPool({
        host: mysqlConfig.host,
        user: mysqlConfig.user,
        password: mysqlConfig.password,
        database: mysqlConfig.database,
        port: mysqlConfig.port,
        waitForConnections: true,
        connectionLimit: 10,
        queueLimit: 0
      });
      
      // Test the connection
      const connection = await mysqlPool.getConnection();
      console.log('✅ Real MySQL connection established successfully!');
      connection.release();
      useMySQL = true;

      // Check and add schedule column if not exists in MySQL
      try {
        const [columns]: any = await mysqlPool.query("SHOW COLUMNS FROM doctors LIKE 'schedule'");
        if (columns.length === 0) {
          await mysqlPool.query("ALTER TABLE doctors ADD COLUMN schedule TEXT NULL");
          console.log('✅ Added "schedule" column to doctors table');
        }
      } catch (colErr) {
        console.error('Failed to check or add schedule column to doctors table:', colErr);
      }
    } catch (err: any) {
      console.error('❌ Failed to connect to MySQL database:', err.message);
      console.log('🔄 Switched to high-availability local JSON database fallback.');
      useMySQL = false;
    }
  } else {
    console.log('ℹ️ MySQL environment variables not defined. Using high-availability local JSON database.');
    useMySQL = false;
  }

  // Ensure JSON DB exists as directory and file if MySQL is not active
  try {
    const dir = path.dirname(JSON_DB_PATH);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    if (!fs.existsSync(JSON_DB_PATH)) {
      // Create empty db file if missing
      fs.writeFileSync(JSON_DB_PATH, JSON.stringify({
        doctors: [],
        patients: [],
        appointments: [],
        medical_records: [],
        medicines: [],
        billing: []
      }, null, 2));
    }
  } catch (error) {
    console.error('Failed to prepare local JSON data directories:', error);
  }
}

// -------------------------------------------------------------
// HELPER BACA/TULIS DARI JSON FALLBACK
// -------------------------------------------------------------
function readJsonDb(): LocalDbData {
  try {
    if (!fs.existsSync(JSON_DB_PATH)) {
      return { doctors: [], patients: [], appointments: [], medical_records: [], medicines: [], billing: [] };
    }
    const raw = fs.readFileSync(JSON_DB_PATH, 'utf-8');
    return JSON.parse(raw);
  } catch (err) {
    console.error('Error reading JSON DB file:', err);
    return { doctors: [], patients: [], appointments: [], medical_records: [], medicines: [], billing: [] };
  }
}

function writeJsonDb(data: LocalDbData) {
  try {
    fs.writeFileSync(JSON_DB_PATH, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error writing to JSON DB file:', err);
  }
}

// Helper untuk format tanggal hari ini (YYYY-MM-DD)
function getTodayString(): string {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// -------------------------------------------------------------
// APIS: DOKTER (DOCTORS)
// -------------------------------------------------------------
export async function getDoctors(): Promise<any[]> {
  if (useMySQL && mysqlPool) {
    try {
      const [rows]: any = await mysqlPool.query('SELECT * FROM doctors');
      return rows.map((row: any) => {
        if (row.schedule && typeof row.schedule === 'string') {
          try {
            row.schedule = JSON.parse(row.schedule);
          } catch (e) {
            row.schedule = [];
          }
        }
        return row;
      });
    } catch (err) {
      console.error('MySQL query error (getDoctors):', err);
    }
  }
  return readJsonDb().doctors;
}

export async function addDoctor(doctor: any): Promise<any> {
  if (useMySQL && mysqlPool) {
    try {
      const scheduleVal = doctor.schedule ? (typeof doctor.schedule === 'string' ? doctor.schedule : JSON.stringify(doctor.schedule)) : '[]';
      const [result]: any = await mysqlPool.query(
        'INSERT INTO doctors (name, specialization, status, contact, gender, room, schedule) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [doctor.name, doctor.specialization, doctor.status || 'Aktif', doctor.contact, doctor.gender, doctor.room, scheduleVal]
      );
      return { id: result.insertId, ...doctor };
    } catch (err) {
      console.error('MySQL insert error (addDoctor):', err);
    }
  }
  
  const db = readJsonDb();
  const newId = db.doctors.reduce((max, d) => d.id > max ? d.id : max, 0) + 1;
  const newDoc = { id: newId, status: 'Aktif', ...doctor };
  db.doctors.push(newDoc);
  writeJsonDb(db);
  return newDoc;
}

export async function updateDoctorStatus(id: number, status: string): Promise<boolean> {
  if (useMySQL && mysqlPool) {
    try {
      await mysqlPool.query('UPDATE doctors SET status = ? WHERE id = ?', [status, id]);
      return true;
    } catch (err) {
      console.error('MySQL update error (updateDoctorStatus):', err);
    }
  }

  const db = readJsonDb();
  const idx = db.doctors.findIndex(d => d.id === id);
  if (idx !== -1) {
    db.doctors[idx].status = status;
    writeJsonDb(db);
    return true;
  }
  return false;
}

// -------------------------------------------------------------
// APIS: PASIEN (PATIENTS)
// -------------------------------------------------------------
export async function getPatients(): Promise<any[]> {
  if (useMySQL && mysqlPool) {
    try {
      const [rows] = await mysqlPool.query('SELECT * FROM patients ORDER BY id DESC');
      return rows as any[];
    } catch (err) {
      console.error('MySQL query error (getPatients):', err);
    }
  }
  // Fallback
  return [...readJsonDb().patients].reverse();
}

export async function addPatient(patient: any): Promise<any> {
  const rmNumber = 'RM-' + String(Math.floor(100000 + Math.random() * 900000));
  
  if (useMySQL && mysqlPool) {
    try {
      const [result]: any = await mysqlPool.query(
        'INSERT INTO patients (nik, rekam_medis_number, name, birth_date, gender, address, phone, bpjs_number) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
        [patient.nik, rmNumber, patient.name, patient.birth_date, patient.gender, patient.address, patient.phone, patient.bpjs_number || null]
      );
      return { id: result.insertId, rekam_medis_number: rmNumber, ...patient };
    } catch (err) {
      console.error('MySQL insert error (addPatient):', err);
    }
  }

  const db = readJsonDb();
  const newId = db.patients.reduce((max, p) => p.id > max ? p.id : max, 0) + 1;
  const newPatient = {
    id: newId,
    rekam_medis_number: rmNumber,
    ...patient,
    created_at: new Date().toISOString()
  };
  db.patients.push(newPatient);
  writeJsonDb(db);
  return newPatient;
}

// -------------------------------------------------------------
// APIS: ANTREAN (APPOINTMENTS)
// -------------------------------------------------------------
export async function getAppointments(): Promise<any[]> {
  if (useMySQL && mysqlPool) {
    try {
      const query = `
        SELECT a.*, p.name as patient_name, p.rekam_medis_number, d.name as doctor_name, d.specialization
        FROM appointments a
        JOIN patients p ON a.patient_id = p.id
        JOIN doctors d ON a.doctor_id = d.id
        ORDER BY a.appointment_date DESC, a.queue_number ASC
      `;
      const [rows] = await mysqlPool.query(query);
      return rows as any[];
    } catch (err) {
      console.error('MySQL query error (getAppointments):', err);
    }
  }

  const db = readJsonDb();
  return db.appointments.map(app => {
    const patient = db.patients.find(p => p.id === app.patient_id);
    const doctor = db.doctors.find(d => d.id === app.doctor_id);
    return {
      ...app,
      patient_name: patient ? patient.name : 'Unknown Pasien',
      rekam_medis_number: patient ? patient.rekam_medis_number : '',
      doctor_name: doctor ? doctor.name : 'Unknown Dokter',
      specialization: doctor ? doctor.specialization : ''
    };
  });
}

export async function addAppointment(app: any): Promise<any> {
  const today = getTodayString();
  const appointmentDate = app.appointment_date || today;

  if (useMySQL && mysqlPool) {
    try {
      // Generate queue number
      const [qRow]: any = await mysqlPool.query(
        'SELECT COALESCE(MAX(queue_number), 0) + 1 as next_q FROM appointments WHERE doctor_id = ? AND appointment_date = ?',
        [app.doctor_id, appointmentDate]
      );
      const nextQ = qRow[0]?.next_q || 1;

      const [result]: any = await mysqlPool.query(
        'INSERT INTO appointments (patient_id, doctor_id, appointment_date, appointment_time, queue_number, status, complaint) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [app.patient_id, app.doctor_id, appointmentDate, app.appointment_time, nextQ, 'Menunggu', app.complaint]
      );
      return { id: result.insertId, queue_number: nextQ, status: 'Menunggu', ...app };
    } catch (err) {
      console.error('MySQL insert error (addAppointment):', err);
    }
  }

  const db = readJsonDb();
  const nextQ = db.appointments
    .filter(a => a.doctor_id === Number(app.doctor_id) && a.appointment_date === appointmentDate)
    .reduce((max, a) => a.queue_number > max ? a.queue_number : max, 0) + 1;

  const newId = db.appointments.reduce((max, a) => a.id > max ? a.id : max, 0) + 1;
  const newApp = {
    id: newId,
    patient_id: Number(app.patient_id),
    doctor_id: Number(app.doctor_id),
    appointment_date: appointmentDate,
    appointment_time: app.appointment_time,
    queue_number: nextQ,
    status: 'Menunggu',
    complaint: app.complaint
  };
  db.appointments.push(newApp);
  writeJsonDb(db);
  return newApp;
}

export async function updateAppointmentStatus(id: number, status: string): Promise<boolean> {
  if (useMySQL && mysqlPool) {
    try {
      await mysqlPool.query('UPDATE appointments SET status = ? WHERE id = ?', [status, id]);
      return true;
    } catch (err) {
      console.error('MySQL update error (updateAppointmentStatus):', err);
    }
  }

  const db = readJsonDb();
  const idx = db.appointments.findIndex(a => a.id === id);
  if (idx !== -1) {
    db.appointments[idx].status = status;
    writeJsonDb(db);
    return true;
  }
  return false;
}

// -------------------------------------------------------------
// APIS: REKAM MEDIS (MEDICAL RECORDS)
// -------------------------------------------------------------
export async function getMedicalRecords(): Promise<any[]> {
  if (useMySQL && mysqlPool) {
    try {
      const query = `
        SELECT mr.*, p.name as patient_name, p.rekam_medis_number, d.name as doctor_name, d.specialization
        FROM medical_records mr
        JOIN patients p ON mr.patient_id = p.id
        JOIN doctors d ON mr.doctor_id = d.id
        ORDER BY mr.check_date DESC, mr.id DESC
      `;
      const [rows]: any[] = await mysqlPool.query(query);
      return rows.map((row: any) => ({
        ...row,
        // MySQL stores json strings usually, parse if needed
        prescription: typeof row.prescription === 'string' ? JSON.parse(row.prescription) : row.prescription
      }));
    } catch (err) {
      console.error('MySQL query error (getMedicalRecords):', err);
    }
  }

  const db = readJsonDb();
  return db.medical_records.map(mr => {
    const patient = db.patients.find(p => p.id === mr.patient_id);
    const doctor = db.doctors.find(d => d.id === mr.doctor_id);
    return {
      ...mr,
      patient_name: patient ? patient.name : 'Unknown Pasien',
      rekam_medis_number: patient ? patient.rekam_medis_number : '',
      doctor_name: doctor ? doctor.name : 'Unknown Dokter',
      specialization: doctor ? doctor.specialization : ''
    };
  });
}

export async function addMedicalRecord(mr: any): Promise<any> {
  const checkDate = mr.check_date || getTodayString();
  const prescriptionJson = JSON.stringify(mr.prescription || []);

  if (useMySQL && mysqlPool) {
    const connection = await mysqlPool.getConnection();
    try {
      await connection.beginTransaction();

      // 1. Insert rekam medis
      const [result]: any = await connection.query(
        'INSERT INTO medical_records (patient_id, doctor_id, check_date, blood_pressure, heart_rate, temperature, symptoms, diagnosis, prescription, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [mr.patient_id, mr.doctor_id, checkDate, mr.blood_pressure, mr.heart_rate, mr.temperature, mr.symptoms, mr.diagnosis, prescriptionJson, mr.notes]
      );
      const newMRId = result.insertId;

      // 2. Potong stok obat-obatan di apotek
      if (mr.prescription && Array.isArray(mr.prescription)) {
        for (const item of mr.prescription) {
          await connection.query(
            'UPDATE medicines SET stock = GREATEST(stock - ?, 0) WHERE name = ?',
            [item.qty, item.name]
          );
        }
      }

      // 3. Update status antrean / appointment hari ini ke Selesai
      await connection.query(
        'UPDATE appointments SET status = "Selesai" WHERE patient_id = ? AND doctor_id = ? AND appointment_date = ?',
        [mr.patient_id, mr.doctor_id, checkDate]
      );

      // 4. Hitung harga obat
      let totalObat = 0;
      if (mr.prescription && Array.isArray(mr.prescription)) {
        for (const item of mr.prescription) {
          const [medRows]: any = await connection.query('SELECT price FROM medicines WHERE name = ?', [item.name]);
          const medPrice = medRows[0]?.price || 0;
          totalObat += Number(medPrice) * Number(item.qty);
        }
      }

      // 5. Buat invoice tagihan baru
      const randInv = 'INV-' + getTodayString().replace(/-/g, '') + '-' + String(Math.floor(100 + Math.random() * 900));
      const doctorFee = 150000.00; // Flat fee dokter spesialis
      const facilityFee = 25000.00; // Jasa pelayanan/klinik
      const grandTotal = doctorFee + totalObat + facilityFee;

      await connection.query(
        'INSERT INTO billing (patient_id, invoice_number, doctor_fee, medicine_fee, facility_fee, total_amount, status, billing_date) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
        [mr.patient_id, randInv, doctorFee, totalObat, facilityFee, grandTotal, 'Belum Lunas', checkDate]
      );

      await connection.commit();
      connection.release();
      return { id: newMRId, ...mr };
    } catch (err) {
      await connection.rollback();
      connection.release();
      console.error('MySQL Transaction error (addMedicalRecord & automation):', err);
    }
  }

  // FALLBACK JSON DATABASE (WITH FULL AUTOMATION LIKE REAL RELATIONAL RDBMS)
  const db = readJsonDb();
  const newMRId = db.medical_records.reduce((max, r) => r.id > max ? r.id : max, 0) + 1;
  const newMr = {
    id: newMRId,
    patient_id: Number(mr.patient_id),
    doctor_id: Number(mr.doctor_id),
    check_date: checkDate,
    blood_pressure: mr.blood_pressure,
    heart_rate: mr.heart_rate ? Number(mr.heart_rate) : undefined,
    temperature: mr.temperature ? Number(mr.temperature) : undefined,
    symptoms: mr.symptoms,
    diagnosis: mr.diagnosis,
    prescription: mr.prescription || [],
    notes: mr.notes
  };
  db.medical_records.push(newMr);

  // Potong stok obat
  if (mr.prescription && Array.isArray(mr.prescription)) {
    mr.prescription.forEach((pItem: any) => {
      const med = db.medicines.find(m => m.name.toLowerCase() === pItem.name.toLowerCase());
      if (med) {
        med.stock = Math.max(0, med.stock - Number(pItem.qty));
      }
    });
  }

  // Update appointment status to Selesai
  const appointmentsToFinish = db.appointments.filter(
    a => a.patient_id === Number(mr.patient_id) && a.doctor_id === Number(mr.doctor_id)
  );
  appointmentsToFinish.forEach(a => {
    a.status = 'Selesai';
  });

  // Buat tagihan kasir otomatis
  let totalObat = 0;
  if (mr.prescription && Array.isArray(mr.prescription)) {
    mr.prescription.forEach((pItem: any) => {
      const med = db.medicines.find(m => m.name.toLowerCase() === pItem.name.toLowerCase());
      const medPrice = med ? med.price : 10000;
      totalObat += medPrice * Number(pItem.qty);
    });
  }

  const randInv = 'INV-' + getTodayString().replace(/-/g, '') + '-' + String(Math.floor(100 + Math.random() * 900));
  const docFee = 150000;
  const clinicFee = 25000;
  const grandTotal = docFee + totalObat + clinicFee;

  const newBill = {
    id: db.billing.reduce((max, b) => b.id > max ? b.id : max, 0) + 1,
    patient_id: Number(mr.patient_id),
    invoice_number: randInv,
    doctor_fee: docFee,
    medicine_fee: totalObat,
    facility_fee: clinicFee,
    total_amount: grandTotal,
    status: 'Belum Lunas' as const,
    billing_date: checkDate
  };
  db.billing.push(newBill);

  writeJsonDb(db);
  return newMr;
}

// -------------------------------------------------------------
// APIS: APOTEK / OBAT (MEDICINES)
// -------------------------------------------------------------
export async function getMedicines(): Promise<any[]> {
  if (useMySQL && mysqlPool) {
    try {
      const [rows] = await mysqlPool.query('SELECT * FROM medicines ORDER BY name ASC');
      return rows as any[];
    } catch (err) {
      console.error('MySQL query error (getMedicines):', err);
    }
  }
  return [...readJsonDb().medicines].sort((a,b)=> a.name.localeCompare(b.name));
}

export async function addMedicine(med: any): Promise<any> {
  const code = 'OBT-' + String(Math.floor(100 + Math.random() * 900));
  if (useMySQL && mysqlPool) {
    try {
      const [result]: any = await mysqlPool.query(
        'INSERT INTO medicines (name, category, stock, price, unit, code) VALUES (?, ?, ?, ?, ?, ?)',
        [med.name, med.category, med.stock, med.price, med.unit, code]
      );
      return { id: result.insertId, code, ...med };
    } catch (err) {
      console.error('MySQL insert error (addMedicine):', err);
    }
  }

  const db = readJsonDb();
  const newId = db.medicines.reduce((max, m) => m.id > max ? m.id : max, 0) + 1;
  const newMed = {
    id: newId,
    code,
    name: med.name,
    category: med.category,
    stock: Number(med.stock),
    price: Number(med.price),
    unit: med.unit
  };
  db.medicines.push(newMed);
  writeJsonDb(db);
  return newMed;
}

export async function restockMedicine(id: number, addQty: number): Promise<boolean> {
  if (useMySQL && mysqlPool) {
    try {
      await mysqlPool.query('UPDATE medicines SET stock = stock + ? WHERE id = ?', [addQty, id]);
      return true;
    } catch (err) {
      console.error('MySQL update error (restockMedicine):', err);
    }
  }

  const db = readJsonDb();
  const idx = db.medicines.findIndex(m => m.id === id);
  if (idx !== -1) {
    db.medicines[idx].stock += Number(addQty);
    writeJsonDb(db);
    return true;
  }
  return false;
}

// -------------------------------------------------------------
// APIS: FINANCIAL BILLING (KASIR)
// -------------------------------------------------------------
export async function getBilling(): Promise<any[]> {
  if (useMySQL && mysqlPool) {
    try {
      const query = `
        SELECT b.*, p.name as patient_name, p.rekam_medis_number
        FROM billing b
        JOIN patients p ON b.patient_id = p.id
        ORDER BY b.billing_date DESC, b.id DESC
      `;
      const [rows] = await mysqlPool.query(query);
      return rows as any[];
    } catch (err) {
      console.error('MySQL query error (getBilling):', err);
    }
  }

  const db = readJsonDb();
  return [...db.billing].reverse().map(b => {
    const patient = db.patients.find(p => p.id === b.patient_id);
    return {
      ...b,
      patient_name: patient ? patient.name : 'Unknown Pasien',
      rekam_medis_number: patient ? patient.rekam_medis_number : ''
    };
  });
}

export async function processPayment(id: number, pMethod: string): Promise<boolean> {
  if (useMySQL && mysqlPool) {
    try {
      await mysqlPool.query(
        'UPDATE billing SET status = "Lunas", payment_method = ? WHERE id = ?',
        [pMethod, id]
      );
      return true;
    } catch (err) {
      console.error('MySQL update error (processPayment):', err);
    }
  }

  const db = readJsonDb();
  const idx = db.billing.findIndex(b => b.id === id);
  if (idx !== -1) {
    db.billing[idx].status = 'Lunas';
    db.billing[idx].payment_method = pMethod;
    writeJsonDb(db);
    return true;
  }
  return false;
}

export async function addBilling(b: any): Promise<any> {
  const invoice_num = b.invoice_number || ('INV-' + getTodayString().replace(/-/g, '') + '-' + String(Math.floor(100 + Math.random() * 900)));
  const docFee = Number(b.doctor_fee || 0);
  const medFee = Number(b.medicine_fee || 0);
  const facFee = Number(b.facility_fee || 0);
  const totalAmount = docFee + medFee + facFee;
  const bDate = b.billing_date || getTodayString();
  const bStatus = b.status || 'Belum Lunas';
  const pMethod = b.payment_method || null;

  if (useMySQL && mysqlPool) {
    try {
      const [result]: any = await mysqlPool.query(
        'INSERT INTO billing (patient_id, invoice_number, doctor_fee, medicine_fee, facility_fee, total_amount, status, billing_date, payment_method) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [Number(b.patient_id), invoice_num, docFee, medFee, facFee, totalAmount, bStatus, bDate, pMethod]
      );
      return { id: result.insertId, patient_id: Number(b.patient_id), invoice_number: invoice_num, doctor_fee: docFee, medicine_fee: medFee, facility_fee: facFee, total_amount: totalAmount, status: bStatus, billing_date: bDate, payment_method: pMethod };
    } catch (err) {
      console.error('MySQL insert error (addBilling):', err);
    }
  }

  const db = readJsonDb();
  const newId = db.billing.reduce((max, x) => x.id > max ? x.id : max, 0) + 1;
  const newBill = {
    id: newId,
    patient_id: Number(b.patient_id),
    invoice_number: invoice_num,
    doctor_fee: docFee,
    medicine_fee: medFee,
    facility_fee: facFee,
    total_amount: totalAmount,
    status: bStatus as 'Belum Lunas' | 'Lunas',
    billing_date: bDate,
    payment_method: pMethod
  };
  db.billing.push(newBill);
  writeJsonDb(db);
  return newBill;
}

export async function updateBilling(id: number, b: any): Promise<boolean> {
  const docFee = Number(b.doctor_fee || 0);
  const medFee = Number(b.medicine_fee || 0);
  const facFee = Number(b.facility_fee || 0);
  const totalAmount = docFee + medFee + facFee;
  const bDate = b.billing_date || getTodayString();
  const bStatus = b.status || 'Belum Lunas';
  const pMethod = b.payment_method || null;

  if (useMySQL && mysqlPool) {
    try {
      await mysqlPool.query(
        'UPDATE billing SET patient_id = ?, doctor_fee = ?, medicine_fee = ?, facility_fee = ?, total_amount = ?, status = ?, billing_date = ?, payment_method = ? WHERE id = ?',
        [Number(b.patient_id), docFee, medFee, facFee, totalAmount, bStatus, bDate, pMethod, id]
      );
      return true;
    } catch (err) {
      console.error('MySQL update error (updateBilling):', err);
    }
  }

  const db = readJsonDb();
  const idx = db.billing.findIndex(x => x.id === id);
  if (idx !== -1) {
    db.billing[idx] = {
      ...db.billing[idx],
      patient_id: Number(b.patient_id),
      doctor_fee: docFee,
      medicine_fee: medFee,
      facility_fee: facFee,
      total_amount: totalAmount,
      status: bStatus as 'Belum Lunas' | 'Lunas',
      billing_date: bDate,
      payment_method: pMethod
    };
    writeJsonDb(db);
    return true;
  }
  return false;
}

export async function deleteBilling(id: number): Promise<boolean> {
  if (useMySQL && mysqlPool) {
    try {
      await mysqlPool.query('DELETE FROM billing WHERE id = ?', [id]);
      return true;
    } catch (err) {
      console.error('MySQL delete error (deleteBilling):', err);
    }
  }

  const db = readJsonDb();
  const idx = db.billing.findIndex(x => x.id === id);
  if (idx !== -1) {
    db.billing.splice(idx, 1);
    writeJsonDb(db);
    return true;
  }
  return false;
}

// -------------------------------------------------------------
// APIS: DASHBOARD STATS
// -------------------------------------------------------------
export async function getDashboardStats(): Promise<any> {
  const today = getTodayString();
  
  if (useMySQL && mysqlPool) {
    try {
      const connection = await mysqlPool.getConnection();
      
      const [[patientsCount]]: any = await connection.query('SELECT COUNT(*) as cnt FROM patients');
      const [[activeDocs]]: any = await connection.query('SELECT COUNT(*) as cnt FROM doctors WHERE status = "Aktif"');
      const [[todayAppCount]]: any = await connection.query('SELECT COUNT(*) as cnt FROM appointments WHERE appointment_date = ?', [today]);
      const [[doneAppCount]]: any = await connection.query('SELECT COUNT(*) as cnt FROM appointments WHERE appointment_date = ? AND status = "Selesai"', [today]);
      const [[waitQueueCount]]: any = await connection.query('SELECT COUNT(*) as cnt FROM appointments WHERE appointment_date = ? AND status = "Menunggu"', [today]);
      const [[shortageCount]]: any = await connection.query('SELECT COUNT(*) as cnt FROM medicines WHERE stock <= 15');
      const [[revenue]]: any = await connection.query('SELECT COALESCE(SUM(total_amount), 0) as total FROM billing WHERE billing_date = ? AND status = "Lunas"', [today]);

      connection.release();

      return {
        totalPatients: patientsCount.cnt,
        activeDoctors: activeDocs.cnt,
        todayAppointments: todayAppCount.cnt,
        completedAppointments: doneAppCount.cnt,
        activeQueues: waitQueueCount.cnt,
        medicineShortageCount: shortageCount.cnt,
        revenueToday: Number(revenue.total),
        dbType: 'mysql'
      };
    } catch (err) {
      console.error('MySQL stats query failed:', err);
    }
  }

  // Fallback JSON-based aggregation
  const db = readJsonDb();
  
  const totalPatients = db.patients.length;
  const activeDoctors = db.doctors.filter(d => d.status === 'Aktif').length;
  const todayApps = db.appointments.filter(a => a.appointment_date === today);
  const todayAppointments = todayApps.length;
  const completedAppointments = todayApps.filter(a => a.status === 'Selesai').length;
  const activeQueues = todayApps.filter(a => a.status === 'Menunggu' || a.status === 'Diperiksa').length;
  const medicineShortageCount = db.medicines.filter(m => m.stock <= 15).length;
  
  const revenueToday = db.billing
    .filter(b => b.billing_date === today && b.status === 'Lunas')
    .reduce((sum, b) => sum + Number(b.total_amount), 0);

  return {
    totalPatients,
    activeDoctors,
    todayAppointments,
    completedAppointments,
    activeQueues,
    medicineShortageCount,
    revenueToday,
    dbType: 'json'
  };
}

// -------------------------------------------------------------
// APIS: CRUD UTILITIES (EDIT & DELETE ENHANCEMENTS)
// -------------------------------------------------------------

export async function updateDoctor(id: number, doc: any): Promise<boolean> {
  if (useMySQL && mysqlPool) {
    try {
      const scheduleVal = doc.schedule ? (typeof doc.schedule === 'string' ? doc.schedule : JSON.stringify(doc.schedule)) : '[]';
      await mysqlPool.query(
        'UPDATE doctors SET name = ?, specialization = ?, contact = ?, gender = ?, room = ?, schedule = ? WHERE id = ?',
        [doc.name, doc.specialization, doc.contact, doc.gender, doc.room, scheduleVal, id]
      );
      return true;
    } catch (err) {
      console.error('MySQL update error (updateDoctor):', err);
    }
  }

  const db = readJsonDb();
  const idx = db.doctors.findIndex(d => d.id === id);
  if (idx !== -1) {
    db.doctors[idx] = { ...db.doctors[idx], ...doc, id };
    writeJsonDb(db);
    return true;
  }
  return false;
}

export async function deleteDoctor(id: number): Promise<boolean> {
  if (useMySQL && mysqlPool) {
    try {
      await mysqlPool.query('DELETE FROM doctors WHERE id = ?', [id]);
      return true;
    } catch (err) {
      console.error('MySQL delete error (deleteDoctor):', err);
    }
  }

  const db = readJsonDb();
  const idx = db.doctors.findIndex(d => d.id === id);
  if (idx !== -1) {
    db.doctors.splice(idx, 1);
    writeJsonDb(db);
    return true;
  }
  return false;
}

export async function updatePatient(id: number, pat: any): Promise<boolean> {
  if (useMySQL && mysqlPool) {
    try {
      await mysqlPool.query(
        'UPDATE patients SET name = ?, nik = ?, birth_date = ?, gender = ?, address = ?, phone = ?, bpjs_number = ? WHERE id = ?',
        [pat.name, pat.nik, pat.birth_date, pat.gender, pat.address, pat.phone, pat.bpjs_number || null, id]
      );
      return true;
    } catch (err) {
      console.error('MySQL update error (updatePatient):', err);
    }
  }

  const db = readJsonDb();
  const idx = db.patients.findIndex(p => p.id === id);
  if (idx !== -1) {
    db.patients[idx] = { ...db.patients[idx], ...pat, id };
    writeJsonDb(db);
    return true;
  }
  return false;
}

export async function deletePatient(id: number): Promise<boolean> {
  if (useMySQL && mysqlPool) {
    try {
      await mysqlPool.query('DELETE FROM patients WHERE id = ?', [id]);
      return true;
    } catch (err) {
      console.error('MySQL delete error (deletePatient):', err);
    }
  }

  const db = readJsonDb();
  const idx = db.patients.findIndex(p => p.id === id);
  if (idx !== -1) {
    db.patients.splice(idx, 1);
    writeJsonDb(db);
    return true;
  }
  return false;
}

export async function updateAppointment(id: number, app: any): Promise<boolean> {
  if (useMySQL && mysqlPool) {
    try {
      await mysqlPool.query(
        'UPDATE appointments SET appointment_date = ?, appointment_time = ?, complaint = ? WHERE id = ?',
        [app.appointment_date, app.appointment_time, app.complaint, id]
      );
      return true;
    } catch (err) {
      console.error('MySQL update error (updateAppointment):', err);
    }
  }

  const db = readJsonDb();
  const idx = db.appointments.findIndex(a => a.id === id);
  if (idx !== -1) {
    db.appointments[idx] = { ...db.appointments[idx], ...app, id };
    writeJsonDb(db);
    return true;
  }
  return false;
}

export async function deleteAppointment(id: number): Promise<boolean> {
  if (useMySQL && mysqlPool) {
    try {
      await mysqlPool.query('DELETE FROM appointments WHERE id = ?', [id]);
      return true;
    } catch (err) {
      console.error('MySQL delete error (deleteAppointment):', err);
    }
  }

  const db = readJsonDb();
  const idx = db.appointments.findIndex(a => a.id === id);
  if (idx !== -1) {
    db.appointments.splice(idx, 1);
    writeJsonDb(db);
    return true;
  }
  return false;
}

export async function updateMedicine(id: number, med: any): Promise<boolean> {
  if (useMySQL && mysqlPool) {
    try {
      await mysqlPool.query(
        'UPDATE medicines SET name = ?, category = ?, stock = ?, price = ?, unit = ? WHERE id = ?',
        [med.name, med.category, Number(med.stock), Number(med.price), med.unit, id]
      );
      return true;
    } catch (err) {
      console.error('MySQL update error (updateMedicine):', err);
    }
  }

  const db = readJsonDb();
  const idx = db.medicines.findIndex(m => m.id === id);
  if (idx !== -1) {
    db.medicines[idx] = { ...db.medicines[idx], ...med, id };
    writeJsonDb(db);
    return true;
  }
  return false;
}

export async function deleteMedicine(id: number): Promise<boolean> {
  if (useMySQL && mysqlPool) {
    try {
      await mysqlPool.query('DELETE FROM medicines WHERE id = ?', [id]);
      return true;
    } catch (err) {
      console.error('MySQL delete error (deleteMedicine):', err);
    }
  }

  const db = readJsonDb();
  const idx = db.medicines.findIndex(m => m.id === id);
  if (idx !== -1) {
    db.medicines.splice(idx, 1);
    writeJsonDb(db);
    return true;
  }
  return false;
}

export async function importBackupData(data: any): Promise<boolean> {
  if (useMySQL && mysqlPool) {
    try {
      // Clean previous tables in order of foreign key dependency
      await mysqlPool.query('DELETE FROM billing');
      await mysqlPool.query('DELETE FROM medical_records');
      await mysqlPool.query('DELETE FROM appointments');
      await mysqlPool.query('DELETE FROM patients');
      await mysqlPool.query('DELETE FROM doctors');
      await mysqlPool.query('DELETE FROM medicines');

      // Re-insert medicines
      if (Array.isArray(data.medicines)) {
        for (const item of data.medicines) {
          await mysqlPool.query(
            'INSERT INTO medicines (id, name, category, stock, price, unit) VALUES (?, ?, ?, ?, ?, ?)',
            [item.id, item.name, item.category, item.stock, item.price, item.unit]
          );
        }
      }

      // Re-insert doctors
      if (Array.isArray(data.doctors)) {
        for (const item of data.doctors) {
          await mysqlPool.query(
            'INSERT INTO doctors (id, name, specialization, status, contact, gender, room) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [item.id, item.name, item.specialization, item.status, item.contact, item.gender, item.room]
          );
        }
      }

      // Re-insert patients
      if (Array.isArray(data.patients)) {
        for (const item of data.patients) {
          await mysqlPool.query(
            'INSERT INTO patients (id, nik, name, birth_date, gender, address, phone, bpjs_number, rekam_medis_number, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
            [item.id, item.nik, item.name, item.birth_date, item.gender, item.address || '', item.phone || '', item.bpjs_number || null, item.rekam_medis_number, item.created_at]
          );
        }
      }

      // Re-insert appointments
      if (Array.isArray(data.appointments)) {
        for (const item of data.appointments) {
          await mysqlPool.query(
            'INSERT INTO appointments (id, ticket_number, patient_name, doctor_name, specialization, room, status, session_date, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
            [item.id, item.ticket_number, item.patient_name, item.doctor_name, item.specialization, item.room, item.status, item.session_date, item.created_at]
          );
        }
      }

      // Re-insert medical records
      const records = data.medical_records || data.medicalRecords;
      if (Array.isArray(records)) {
        for (const item of records) {
          await mysqlPool.query(
            'INSERT INTO medical_records (id, rekam_medis_number, patient_name, doctor_name, diagnosis, symptoms, therapy, notes, record_date, prescriptions, billing_status, billing_amount) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
            [item.id, item.rekam_medis_number, item.patient_name, item.doctor_name, item.diagnosis, item.symptoms, item.therapy, item.notes || '', item.record_date, typeof item.prescriptions === 'string' ? item.prescriptions : JSON.stringify(item.prescriptions), item.billing_status, item.billing_amount]
          );
        }
      }

      // Re-insert billing
      if (Array.isArray(data.billing)) {
        for (const item of data.billing) {
          await mysqlPool.query(
            'INSERT INTO billing (id, invoice_number, patient_name, record_id, treatment_fee, medicine_fee, total_fee, bpjs_coverage, final_patient_bill, payment_status, payment_date, payment_method, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
            [item.id, item.invoice_number, item.patient_name, item.record_id, item.treatment_fee, item.medicine_fee, item.total_fee, item.bpjs_coverage, item.final_patient_bill, item.payment_status, item.payment_date || null, item.payment_method || null, item.created_at]
          );
        }
      }

      return true;
    } catch (err) {
      console.error('MySQL backup import error:', err);
      throw err;
    }
  }

  // Fallback JSON-file
  try {
    const rawData: LocalDbData = {
      doctors: Array.isArray(data.doctors) ? data.doctors : [],
      patients: Array.isArray(data.patients) ? data.patients : [],
      appointments: Array.isArray(data.appointments) ? data.appointments : [],
      medical_records: Array.isArray(data.medical_records || data.medicalRecords) ? (data.medical_records || data.medicalRecords) : [],
      medicines: Array.isArray(data.medicines) ? data.medicines : [],
      billing: Array.isArray(data.billing) ? data.billing : [],
    };
    writeJsonDb(rawData);
    return true;
  } catch (err) {
    console.error('JSON backup import error:', err);
    throw err;
  }
}

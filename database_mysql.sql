-- SQL Script untuk membuat Database SIM RS (Sistem Informasi Manajemen Rumah Sakit)
-- Anda dapat men-import script ini ke MySQL Server Anda.

CREATE DATABASE IF NOT EXISTS `simrs_db`;
USE `simrs_db`;

-- 1. Tabel Dokter
CREATE TABLE IF NOT EXISTS `doctors` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(100) NOT NULL,
  `specialization` VARCHAR(100) NOT NULL,
  `status` VARCHAR(20) NOT NULL DEFAULT 'Aktif', -- 'Aktif', 'Cuti', 'Tidak Aktif'
  `contact` VARCHAR(20) NOT NULL,
  `gender` VARCHAR(20) NOT NULL,
  `room` VARCHAR(20) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 2. Tabel Pasien
CREATE TABLE IF NOT EXISTS `patients` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `nik` VARCHAR(20) UNIQUE NOT NULL,
  `rekam_medis_number` VARCHAR(20) UNIQUE NOT NULL,
  `name` VARCHAR(100) NOT NULL,
  `birth_date` DATE NOT NULL,
  `gender` VARCHAR(20) NOT NULL,
  `address` TEXT NOT NULL,
  `phone` VARCHAR(20) NOT NULL,
  `bpjs_number` VARCHAR(50) DEFAULT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 3. Tabel Kunjungan / Antrean (Appointments)
CREATE TABLE IF NOT EXISTS `appointments` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `patient_id` INT NOT NULL,
  `doctor_id` INT NOT NULL,
  `appointment_date` DATE NOT NULL,
  `appointment_time` VARCHAR(20) NOT NULL,
  `queue_number` INT NOT NULL,
  `status` VARCHAR(25) NOT NULL DEFAULT 'Menunggu', -- 'Menunggu', 'Diperiksa', 'Selesai', 'Batal'
  `complaint` TEXT NOT NULL,
  FOREIGN KEY (`patient_id`) REFERENCES `patients`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`doctor_id`) REFERENCES `doctors`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 4. Tabel Rekam Medis (Medical Records)
CREATE TABLE IF NOT EXISTS `medical_records` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `patient_id` INT NOT NULL,
  `doctor_id` INT NOT NULL,
  `check_date` DATE NOT NULL,
  `blood_pressure` VARCHAR(20) DEFAULT NULL, -- e.g. "120/80"
  `heart_rate` INT DEFAULT NULL,              -- e.g. 80 bpm
  `temperature` DECIMAL(4,1) DEFAULT NULL,    -- e.g. 36.5 C
  `symptoms` TEXT NOT NULL,
  `diagnosis` TEXT NOT NULL,
  `prescription` TEXT NOT NULL,               -- Format JSON atau Text
  `notes` TEXT,
  FOREIGN KEY (`patient_id`) REFERENCES `patients`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`doctor_id`) REFERENCES `doctors`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 5. Tabel Obat (Pharmacy Inventory)
CREATE TABLE IF NOT EXISTS `medicines` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(100) NOT NULL,
  `category` VARCHAR(50) NOT NULL, -- e.g. 'Analgesik', 'Antibiotik'
  `stock` INT NOT NULL DEFAULT 0,
  `price` DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  `unit` VARCHAR(20) NOT NULL DEFAULT 'Tablet', -- e.g. 'Tablet', 'Botol', 'Kapsul'
  `code` VARCHAR(20) UNIQUE NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 6. Tabel Invoice / Tagihan (Billing)
CREATE TABLE IF NOT EXISTS `billing` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `patient_id` INT NOT NULL,
  `invoice_number` VARCHAR(50) UNIQUE NOT NULL,
  `doctor_fee` DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  `medicine_fee` DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  `facility_fee` DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  `total_amount` DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  `status` VARCHAR(20) NOT NULL DEFAULT 'Belum Lunas', -- 'Belum Lunas', 'Lunas'
  `billing_date` DATE NOT NULL,
  `payment_method` VARCHAR(50) DEFAULT NULL, -- 'Tunai', 'Transfer', 'BPJS'
  FOREIGN KEY (`patient_id`) REFERENCES `patients`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- INSERT SEED DATA (BIAR LANGSUNG ADA ISI SAAT DI-IMPORT)
INSERT INTO `doctors` (`id`, `name`, `specialization`, `status`, `contact`, `gender`, `room`) VALUES
(1, 'dr. Ahmad Pratama, Sp.PD', 'Penyakit Dalam', 'Aktif', '08123456789', 'Laki-laki', 'Poli A01'),
(2, 'dr. Siti Rahma, Sp.A', 'Spesialis Anak', 'Aktif', '08123456790', 'Perempuan', 'Poli B02'),
(3, 'dr. Budi Santoso, Sp.JP', 'Jantung dan Pembuluh Darah', 'Aktif', '08123456791', 'Laki-laki', 'Poli C05'),
(4, 'dr. Maria Angela, Sp.OG', 'Kandungan & Kebidanan', 'Cuti', '08123456792', 'Perempuan', 'Poli D01'),
(5, 'dr. Hendra Wijaya, Sp.M', 'Spesialis Mata', 'Aktif', '08123456793', 'Laki-laki', 'Poli E03');

INSERT INTO `patients` (`id`, `nik`, `rekam_medis_number`, `name`, `birth_date`, `gender`, `address`, `phone`, `bpjs_number`) VALUES
(1, '3171012345670001', 'RM-000001', 'Budi Purwanto', '1985-05-12', 'Laki-laki', 'Jl. Merdeka No. 45, Jakarta', '08561122334', '0001234567890'),
(2, '3171012345670002', 'RM-000002', 'Dewi Lestari', '1992-09-22', 'Perempuan', 'Sleman Residence Block B, Yogyakarta', '08561122335', NULL),
(3, '3171012345670003', 'RM-000003', 'Ade Kartika', '2015-01-08', 'Perempuan', 'Jl. Gajah Mada 12, Semarang', '08561122336', '0001234567892'),
(4, '3171012345670004', 'RM-000004', 'Fajar Ramadhan', '2001-11-30', 'Laki-laki', 'Kp. Melati RT 03/05, Bandung', '08561122337', NULL);

INSERT INTO `appointments` (`id`, `patient_id`, `doctor_id`, `appointment_date`, `appointment_time`, `queue_number`, `status`, `complaint`) VALUES
(1, 1, 1, CURDATE(), '09:00 - 10:00', 1, 'Selesai', 'Nyeri lambung kronis sejak 3 hari lalu'),
(2, 2, 3, CURDATE(), '10:00 - 11:00', 1, 'Diperiksa', 'Dada sering berdebar kencang saat istirahat'),
(3, 3, 2, CURDATE(), '11:00 - 12:00', 1, 'Menunggu', 'Anak demam tinggi disertai batuk pilek'),
(4, 4, 5, CURDATE(), '13:00 - 14:00', 1, 'Menunggu', 'Pandangan mengabur di mata kanan setelah terkena debu');

INSERT INTO `medical_records` (`id`, `patient_id`, `doctor_id`, `check_date`, `blood_pressure`, `heart_rate`, `temperature`, `symptoms`, `diagnosis`, `prescription`, `notes`) VALUES
(1, 1, 1, CURDATE(), '120/80', 78, 36.8, 'Nyeri ulu hati, mual, perut kembung, lidah terasa pahit.', 'Dyspepsia Syndrome (Maag)', '[{\"name\":\"Antasida Doen\",\"qty\":10,\"dosage\":\"3x1 tablet sebelum makan\"},{\"name\":\"Omeprazole 20mg\",\"qty\":7,\"dosage\":\"1x1 kapsul sebelum makan\"}]', 'Edukasi: Kurangi makanan pedas, asam, kafein, dan makan tepat waktu.');

INSERT INTO `medicines` (`id`, `name`, `category`, `stock`, `price`, `unit`, `code`) VALUES
(1, 'Antasida Doen', 'Antasida', 500, 1500.00, 'Tablet', 'OBT-001'),
(2, 'Omeprazole 20mg', 'Anti-Sekresi', 320, 5000.00, 'Kapsul', 'OBT-002'),
(3, 'Amoxicillin 500mg', 'Antibiotik', 450, 2000.00, 'Tablet', 'OBT-003'),
(4, 'Paracetamol 500mg', 'Analgesik/Antipiretik', 1000, 1200.00, 'Tablet', 'OBT-004'),
(5, 'Amlodipine 5mg', 'Antihipertensi', 280, 3000.00, 'Tablet', 'OBT-005'),
(6, 'Captopril 25mg', 'Antihipertensi', 150, 2500.00, 'Tablet', 'OBT-006');

INSERT INTO `billing` (`id`, `patient_id`, `invoice_number`, `doctor_fee`, `medicine_fee`, `facility_fee`, `total_amount`, `status`, `billing_date`, `payment_method`) VALUES
(1, 1, 'INV-20260617-001', 150000.00, 50000.00, 25000.00, 225000.00, 'Lunas', CURDATE(), 'Transfer BCA'),
(2, 2, 'INV-20260617-002', 200000.00, 0.00, 25000.00, 225000.00, 'Belum Lunas', CURDATE(), NULL),
(3, 3, 'INV-20260617-003', 100000.00, 50000.00, 25000.00, 175000.00, 'Belum Lunas', CURDATE(), NULL);

Searched for files: *
Viewed package.json:1-38
Listed directory src
Listed directory components
Listed directory utils
Viewed types.ts:1-70
Viewed budgetLogic.ts:1-100

Berikut adalah rancangan lengkap **`README.md`** yang terstruktur, komprehensif, dan siap langsung disalin untuk repository GitHub proyek **MyBox**.

```markdown
# 📦 MyBox — Smart Financial & Daily Life Ecosystem

> **Aplikasi All-in-One Manajemen Anggaran Berbasis Metode Amplop Dinamis, AI Assistant, Visual Daily Tracker, dan Sistem Push Notification Terjadwal.**

[![Vite](https://img.shields.io/badge/Vite-6.x-646CFF?style=flat-square&logo=vite&logoColor=white)](https://vitejs.dev/)
[![React](https://img.shields.io/badge/React-19-61DAFB?style=flat-square&logo=react&logoColor=black)](https://react.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-v4-38B2AC?style=flat-square&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![Appwrite](https://img.shields.io/badge/Backend-Appwrite-FD366E?style=flat-square&logo=appwrite&logoColor=white)](https://appwrite.io/)
[![Firebase](https://img.shields.io/badge/Push_Notification-FCM-FFCA28?style=flat-square&logo=firebase&logoColor=black)](https://firebase.google.com/)
[![Google Gemini](https://img.shields.io/badge/AI_Engine-Gemini_GenAI-8E75C2?style=flat-square&logo=google&logoColor=white)](https://ai.google.dev/)

---

## 🌟 Tentang MyBox

**MyBox** adalah platform finansial personal dan pencatatan produktivitas modern yang dibangun untuk mengatasi masalah overspending bulanan. Menggabungkan filosofi *envelope budgeting* klasik dengan teknologi otomatisasi canggih seperti **4-Phase Monthly Rollover**, **Auto-Debt Allowance**, **Wastefulness Analysis Engine** (deteksi pemborosan frekuensi & nominal), serta **Smart AI Text Parsing**.

Selain modul finansial, MyBox dilengkapi dengan **DailyCam** (jurnal visual keseharian), **TextPaste AI** (catatan pintar), dan ekosistem background scheduling berbasis **Appwrite Cloud Functions** & **Firebase Cloud Messaging (FCM)**.

---

## ✨ Fitur Unggulan

### 1. ✉️ Dynamic Envelope Budgeting (Amplop Keuangan)
- **Metode Pembagian Bulanan (Monthly Split)**: Alokasi anggaran bulanan dibagi ke dalam saldo aktif mingguan/fase dan saldo cadangan (*reserve*).
- **Siklus 4 Fase (Tanggal 1, 8, 15, 22)**:
  - Fase 1: Tanggal 1 – 7
  - Fase 2: Tanggal 8 – 14
  - Fase 3: Tanggal 15 – 21
  - Fase 4: Tanggal 22 – Akhir Bulan
- **Auto-Debt (Pencairan Cadangan Otomatis)**: Setiap pergantian fase, sisa cadangan otomatis dialokasikan ke saldo aktif.
- **Smart Daily Recommendation**: Rekomendasi limit belanja harian yang dihitung secara dinamis berdasarkan sisa hari di fase berjalan.
- **24-Hour Transaction Rollback**: Kesempatan membatalkan transaksi yang salah input dalam waktu 24 jam dengan pemulihan saldo amplop.
- **In-Memory EOM Simulation Mode**: Uji coba simulasi tutup buku akhir bulan dan pembagian saldo tanpa merusak database asli.

### 2. 📊 Arsip Laporan Bulanan & Wastefulness Engine
- **Halaman Dedicated Sub-Page Arsip**: Tampilan detail laporan per bulan dengan ringkasan uang masuk, total belanja, sisa saldo, dan daftar riwayat arsip transaksi.
- **Analisa Pemborosan Cerdas (Waste Risk Engine)**:
  - Menilai risiko pengeluaran (**HIGH**, **MEDIUM**, **LOW**) bukan hanya dari nominal besar, melainkan dari **frekuensi jeda hari transaksi**.
  - *Contoh Kasus*: Pembelian bensin 12k/hari berulang dalam rentang ≤ 2 hari langsung ditandai berisiko tinggi karena idealnya dilakukan 3–4 hari sekali.

### 3. 📸 DailyCam (Visual Day-to-Day Tracker)
- Pencatatan jurnal harian berbasis foto/kamera (Day 1 s/d Day 31).
- Integrasi penyimpanan gambar ke Appwrite Storage dengan fallback Base64 storage offline.
- Penambahan catatan/memo harian di setiap dokumentasi foto.

### 4. 📝 TextPaste & Smart Gemini AI Parsing
- Area cepat untuk menempelkan catatan, list belanja, atau draft rencana.
- Didukung Google Gemini AI (`@google/genai`) untuk mengekstrak, mengkategorikan, atau menganalisis catatan secara instan.

### 5. 🔔 Push Notification & Reminder Ecosystem
- **Multi-Device Sync**: Satu akun dapat login di berbagai perangkat (Desktop Chrome, HP Android, iPad, dll) dengan pendaftaran target unik per perangkat.
- **Firebase Cloud Messaging (FCM) v1 Integration**: Memanfaatkan Service Worker Web Push resmi dengan VAPID certificate key.
- **Automated Cron Reminder (Appwrite Cloud Function)**:
  - Berjalan terjadwal 2x sehari (Pagi 08:00 WIB & Malam 20:00 WIB).
  - Mengecek aktivitas transaksi hari ini: jika sudah mencatat, notifikasi di-*skip*; jika belum, sistem mengirimkan dorongan notifikasi pengingat.

### 6. 🎨 Antarmuka Modern & Dinamis
- **Motion Navigation**: Animasi transisi geser antar tab menggunakan `motion/react`.
- **Icon Scale Feedback**: Ikon tab membesar dinamis ketika aktif.
- **Slide-up Bottom Sheet & Smooth Sidebar**: Modal dan drawer yang tidak muncul tiba-tiba melainkan meluncur mulus.

---

## 🏗️ Arsitektur & Teknologi

| Layer | Teknologi |
|---|---|
| **Frontend Framework** | [React 19](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/) |
| **Build Tool** | [Vite 6](https://vitejs.dev/) |
| **Styling** | [Tailwind CSS v4](https://tailwindcss.com/) + [Lucide Icons](https://lucide.dev/) |
| **Animation** | [Motion (Framer Motion)](https://motion.dev/) |
| **Backend as a Service** | [Appwrite Cloud (Singapore)](https://appwrite.io/) |
| **Database & Auth** | Appwrite Databases & Account Services |
| **Background Cron Job** | Appwrite Cloud Functions (Node.js runtime) |
| **Push Gateway** | Firebase Cloud Messaging (FCM) + Service Worker |
| **Artificial Intelligence** | Google Gemini API (`@google/genai`) |

---

## 📁 Struktur Direktori

```text
MyBox/
├── public/
│   ├── firebase-messaging-sw.js   # Service worker resmi Firebase FCM
│   ├── sw.js                      # Fallback service worker push browser
│   ├── icon.svg                   # Icon default aplikasi
│   └── icon.png                   # Custom favicon & app icon
├── reminder/                      # Paket Appwrite Cloud Function
│   ├── src/
│   │   └── main.js                # Entry point logika cron reminder 2x sehari
│   ├── package.json
│   ├── README.md                  # Panduan deploy fungsi reminder
│   └── reminder.tar.gz            # Arsip siap upload ke Appwrite Console
├── src/
│   ├── components/
│   │   ├── ArchiveView.tsx        # Tampilan riwayat arsip
│   │   ├── BottomNav.tsx          # Navigasi bawah beranimasi
│   │   ├── DailyCamView.tsx       # Modul kamera harian visual
│   │   ├── DashboardView.tsx      # Dashboard amplop & saldo keseluruhan
│   │   ├── EnvelopeModal.tsx      # Modal tambah/edit amplop
│   │   ├── HeaderNav.tsx          # Header & indikator tanggal/fase
│   │   ├── HistoryView.tsx        # Riwayat transaksi aktif & rollback
│   │   ├── LaporanView.tsx        # Sub-page laporan & analisa pemborosan
│   │   ├── LoginView.tsx          # Autentikasi akun Appwrite
│   │   ├── SidebarDrawer.tsx      # Drawer pengaturan & push notification
│   │   ├── TextPasteView.tsx      # Editor catatan pintar & integrasi AI
│   │   └── TransactionView.tsx    # Formulir pencatatan transaksi
│   ├── services/
│   │   └── appwrite.ts            # Client SDK, database CRUD, target push
│   ├── utils/
│   │   ├── budgetLogic.ts         # Inti algoritma amplop, fase, & pemborosan
│   │   ├── dateHelper.ts          # Utilitas tanggal & format IDR
│   │   ├── firebaseMessaging.ts   # Pendaftaran FCM Token via Firebase SDK
│   │   └── notificationHelper.ts  # Web Push helper & device detector
│   ├── types.ts                   # Interface TypeScript seluruh entitas
│   ├── App.tsx                    # Root component & orkestrasi data
│   └── main.tsx                   # Entry point React
├── index.html
├── package.json
└── vite.config.ts
```

---

## 🗄️ Model Data (Appwrite Collections)

### 1. `col_envelopes` (Amplop Anggaran)
* `user_id` (string): ID pemilik akun
* `name` (string): Nama amplop (misal: "Makan", "Bensin")
* `type` (string): `monthly_split` | `standard`
* `target_monthly` (integer): Target dana 1 bulan
* `weekly_allowance` (integer): Jatah per fase
* `active_balance` (integer): Saldo yang bisa dibelanjakan saat ini
* `reserve_balance` (integer): Saldo cadangan tersimpan
* `is_smart_rec` (boolean): Fitur limit harian aktif
* `is_auto_debt` (boolean): Pencairan cadangan otomatis tiap fase

### 2. `col_transactions` (Transaksi Berjalan)
* `user_id` (string): ID pemilik akun
* `envelope_id` (string): Relasi ke amplop
* `amount` (integer): Nominal pengeluaran
* `note` (string): Catatan keperluan transaksi
* `timestamp` (string): Format ISO8601 (WIB)

### 3. `col_reports` (Arsip Laporan Bulanan)
* `user_id` (string): ID pemilik akun
* `month_year` (string): Label bulan (contoh: "Agustus 2026")
* `total_saved` (integer): Sisa tabungan di akhir bulan
* `details` (string / JSON): Rincian transaksi arsip dan matriks amplop

### 4. `col_push_subscribers` (Multi-Device Subscriptions)
* `user_id` (string): ID akun pengguna
* `endpoint` (string): Token FCM / Web Push Endpoint
* `device_name` (string): Label perangkat (contoh: "Chrome on Windows")
* `subscription_json` (string): Kunci enkripsi Web Push

---

## 🚀 Panduan Memulai (Instalasi Lokal)

### Prasyarat
- [Node.js](https://nodejs.org/) v18 atau v20+
- Akun [Appwrite Cloud](https://cloud.appwrite.io/) & Proyek aktif
- Akun [Firebase Console](https://console.firebase.google.com/) untuk konfigurasi FCM

### 1. Kloning Repository
```bash
git clone https://github.com/username/MyBox.git
cd MyBox
```

### 2. Pasang Dependensi
```bash
npm install
```

### 3. Konfigurasi Environment
Buat file `.env` di root direktori atau sesuaikan konfigurasi di `src/services/appwrite.ts` dan `src/utils/firebaseMessaging.ts`:

```env
# Appwrite Config
VITE_APPWRITE_ENDPOINT=https://sgp.cloud.appwrite.io/v1
VITE_APPWRITE_PROJECT_ID=mybox
VITE_APPWRITE_DATABASE_ID=db_mybox

# Google Gemini API
VITE_GEMINI_API_KEY=your_gemini_api_key
```

### 4. Jalankan Aplikasi
```bash
npm run dev
```
Aplikasi akan aktif dan dapat diakses di: `http://localhost:3000`.

### 5. Build Produksi
```bash
npm run build
```

---

## ⏰ Deploy Reminder Function (Appwrite Function)

Untuk mengaktifkan fitur pengingat otomatis 2x sehari:
1. Buka [Appwrite Console](https://cloud.appwrite.io/) $\rightarrow$ **Functions** $\rightarrow$ **Create Function**.
2. Pilih runtime **Node.js (18 atau 20)**.
3. Masuk ke tab **Deployments** dan upload arsip **`reminder/reminder.tar.gz`**.
4. Di tab **Settings**:
   - Atur jadwal Cron: `0 1,13 * * *` *(setara 08:00 WIB & 20:00 WIB)*.
   - Masukkan variable `APPWRITE_API_KEY`, `APPWRITE_DATABASE_ID`, dan `APPWRITE_COL_TRANSACTIONS`.
5. Klik **Deploy**.

---

## 📄 Lisensi
Didistribusikan di bawah lisensi MIT. Lihat file `LICENSE` untuk informasi lebih lanjut.
```

---

Teks di atas dapat langsung Anda salin ke dalam file **`README.md`** di repository GitHub Anda.

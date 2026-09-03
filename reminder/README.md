# ⏰ MyBox Daily Reminder Function (Appwrite Cloud Function)

Fungsi ini berjalan otomatis **2x sehari (Pagi & Malam)** untuk memeriksa setiap akun pengguna:
1. Jika pengguna **BELUM** mencatat transaksi hari ini $\rightarrow$ Kirim Push Notification pengingat.
2. Jika pengguna **SUDAH** mencatat transaksi hari ini $\rightarrow$ Melewati (*skip*) pengiriman agar tidak mengganggu pengguna.

---

## 🚀 Panduan Manual Deployment di Appwrite Console

### 1. Buat Function Baru
1. Buka [Appwrite Console](https://cloud.appwrite.io/) $\rightarrow$ Pilih project `mybox`.
2. Buka menu **Functions** $\rightarrow$ Klik **Create function** $\rightarrow$ Pilih **Node.js (versi 18 atau 20)**.
3. Beri nama: `Daily Transaction Reminder`.

### 2. Upload File Kode (`reminder.tar.gz`)
1. Di halaman Function, buka tab **Deployments** $\rightarrow$ Klik **Create deployment** (atau **Manual deployment**).
2. Upload file **`reminder.tar.gz`** yang sudah disediakan.
3. Entrypoint: `src/main.js` (default).
4. Klik **Deploy** dan tunggu build selesai (status *Ready*).

### 3. Konfigurasi Jadwal Otomatis (Cron Schedule)
1. Masuk ke tab **Settings** pada Function Anda.
2. Pada bagian **Schedule (Cron syntax)**, masukkan:
   ```cron
   0 1,13 * * *
   ```
   *(Penjelasan: Server UTC berjalan 7 jam lebih lambat dari WIB. `01:00 UTC` = `08:00 WIB` pagi, dan `13:00 UTC` = `20:00 WIB` malam).*
3. Simpan perubahan.

### 4. Tambahkan Environment Variables
Di tab **Settings** $\rightarrow$ Bagian **Variables**, tambahkan:
* `APPWRITE_API_KEY`: API Key Server Appwrite Anda
* `APPWRITE_DATABASE_ID`: `db_mybox`
* `APPWRITE_COL_TRANSACTIONS`: `col_transactions`

---

## 🧪 Uji Coba Manual
Anda bisa mengklik tombol **Execute now** kapan saja di Appwrite Console untuk melakukan uji coba pengiriman pengingat langsung.

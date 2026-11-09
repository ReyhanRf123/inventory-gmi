# 🚀 Panduan Deployment Online Gratis — Inventori GMI

Panduan langkah demi langkah untuk men-deploy aplikasi web **Inventori GMI** ke internet secara **100% gratis**.

---

## ⚠️ Karakteristik Penyimpanan Database SQLite

Aplikasi saat ini menggunakan database **SQLite lokal** (`data/inventory.db`).

> [!IMPORTANT]
> Pada platform serverless gratis seperti **Vercel** atau **Netlify**, sistem penyimpanan disk bersifat *ephemeral* (sementara). File SQLite lokal akan terhapus atau kembali ke awal setiap kali server *restart* atau redeploy.

Untuk itu, berikut adalah opsi terbaik untuk deploy gratis:

---

## 🌟 Opsi 1: Render.com (Paling Mudah — Tanpa Mengubah Kode)

Render.com menyediakan paket *Free Web Service* yang dapat menjalankan aplikasi Next.js langsung dari GitHub Anda.

### 1. Buat Akun & Sambungkan GitHub
1. Buka [https://render.com](https://render.com) dan login menggunakan akun GitHub Anda.
2. Di dashboard, klik tombol **New +** lalu pilih **Web Service**.
3. Pilih repositori **`ReyhanRf123/inventory-gmi`**.

### 2. Atur Konfigurasi Layanan
- **Name**: `inventory-gmi`
- **Region**: Singapore (terdekat dengan Indonesia untuk latensi rendah)
- **Branch**: `main`
- **Runtime**: `Node`
- **Build Command**:
  ```bash
  pnpm install && pnpm db:seed && pnpm build
  ```
- **Start Command**:
  ```bash
  pnpm start
  ```
- **Instance Type**: Pilih **Free**

### 3. Tambahkan Environment Variable
Di bagian **Environment Variables**, tambahkan:
- `SESSION_SECRET`: Masukkan string acak yang aman (contoh: `gmi-secret-key-prod-super-secure-2026-xyz`)
- `NODE_ENV`: `production`

### 4. Selesai
Klik **Create Web Service**. Dalam waktu 2–3 menit, aplikasi akan live dengan URL publik, misalnya:  
`https://inventory-gmi.onrender.com`

---

## 🌟 Opsi 2: Vercel + Turso (Performa Global Serverless)

Jika Anda ingin men-deploy ke **Vercel** (platform resmi pembuat Next.js):

1. **Buat Database SQLite Cloud Gratis di Turso**:
   - Buka [https://turso.tech](https://turso.tech) dan login via GitHub.
   - Buat database `inventory-gmi` (gratis hingga 9 GB penyimpanan).
   - Dapatkan `TURSO_DATABASE_URL` dan `TURSO_AUTH_TOKEN`.
2. **Deploy di Vercel**:
   - Buka [https://vercel.com](https://vercel.com) dan import `ReyhanRf123/inventory-gmi`.
   - Pasang Environment Variable dan klik **Deploy**.

---

## 📋 Checklist Setelah Live

1. Buka URL publik yang diberikan dan login menggunakan akun bawaan:
   - **Email**: `admin@globalmedika.co.id`
   - **Password**: `Inventori2026!`
2. Masuk ke menu **/users** untuk membuat akun baru staf gudang.
3. Masuk ke menu **/settings** untuk menyesuaikan KOP surat dan identitas perusahaan.

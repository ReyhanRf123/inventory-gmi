# 📦 Sistem Manajemen Inventori — PT Global Medika Indonesia (Inventori GMI)

> **Dokumentasi Proyek & Status Progres**  
> Proyek ini adalah aplikasi web manajemen stok alat kesehatan yang ringkas, cepat, dan zero-configuration untuk Admin Gudang dan pelaporan manajemen PT Global Medika Indonesia.

---

## 📌 Ringkasan Status Progres Proyek

| Komponen | Status | Keterangan |
|---|---|---|
| **PRD (Product Requirements Document)** | ✅ Selesai & Disetujui | PRD v1.0 disetujui pengguna (skop minimalis 8 tabel & 14 rute) |
| **Milestone 0: Fondasi & Setup** | ✅ 100% Selesai | Next.js 16 + Tailwind v4 + SQLite (`node:sqlite`) + Auth JWT + Proxy |
| **Milestone 1: Master Data & Mutasi Stok** | ✅ 100% Selesai | CRUD Produk, Stok Masuk (+), Stok Keluar (-) dengan validasi saldo |
| **Milestone 2: Opname & Laporan Eksekutif**| ✅ 100% Selesai | Rekonsiliasi fisik opname otomatis, 5 jenis laporan, Cetak/PDF, Export Excel (CSV) |
| **Milestone 3: Manajemen User & Pengaturan**| ✅ 100% Selesai | Kelola akun (admin/gudang/viewer), KOP Laporan, Master Kategori & Satuan |
| **Verifikasi Produksi (`pnpm build`)** | ✅ 100% Sukses | 14 Rute App Router + Next.js 16 `proxy.ts` terkompilasi tanpa error |

---

## 🛠️ Tech Stack & Konvensi Teknis

- **Framework**: Next.js 16.4.5 (App Router, Turbopack)
- **Database**: **SQLite** via modul bawaan Node.js 22 (`node:sqlite` + `DatabaseSync`), dibungkus dengan `drizzle-orm/sqlite-proxy`.
  - **Zero-Configuration**: Tidak memerlukan install/menjalankan database server eksternal (PostgreSQL tidak diperlukan).
  - **Lokasi File Database**: `data/inventory.db` (otomatis dibuat dan diproteksi dengan WAL mode).
- **Styling**: Tailwind CSS v4 + `@tailwindcss/postcss`
- **Autentikasi & Session**:
  - Stateless JWT Session via HttpOnly cookie (`jose` + `bcryptjs`).
  - Proteksi route menggunakan konvensi Next.js 16: `src/proxy.ts` (menggantikan `middleware.ts`).
  - Proteksi brute force: 5x gagal login mengunci akun selama 15 menit.
- **Ikon**: Lucide React (`lucide-react`)
- **Node.js**: v22.16.0+

---

## 🔑 Kredensial Akun Bawaan (Seed Data)

Semua akun menggunakan password bawaan yang sama: `Inventori2026!`

| Peran (Role) | Email | Password | Hak Akses |
|---|---|---|---|
| **Admin Gudang** | `gudang@globalmedika.co.id` | `Inventori2026!` | Catat Barang Masuk, Barang Keluar, Stok Opname, Lihat Master & Laporan |
| **Administrator** | `admin@globalmedika.co.id` | `Inventori2026!` | Hak akses penuh: Tambah/Edit Produk, Kelola Pengguna, Pengaturan KOP, Kategori, Satuan |
| **Viewer (Manajemen)** | `viewer@globalmedika.co.id` | `Inventori2026!` | Read-only: Dashboard eksekutif dan seluruh laporan & export |

---

## 🗂️ Struktur Direktori & Rute Aplikasi

```text
inventory-gmi/
├── data/
│   └── inventory.db               # Database SQLite lokal (otomatis dibuat saat seed)
├── src/
│   ├── app/
│   │   ├── (dashboard)/           # Layout bersama (Sidebar navigasi, header status)
│   │   │   ├── page.tsx           # (/) Dashboard: KPI Ringkasan, Alert Stok Rendah, Alert Expired, Aktivitas
│   │   │   ├── products/          # (/products) Daftar Master Produk dengan pencarian & filter kategori
│   │   │   │   ├── new/page.tsx   # (/products/new) Form Tambah Produk Baru
│   │   │   │   └── [id]/edit/page.tsx # (/products/[id]/edit) Form Edit Produk
│   │   │   ├── stock-in/          # (/stock-in) Riwayat Barang Masuk
│   │   │   │   └── new/page.tsx   # (/stock-in/new) Form Penerimaan Barang (Auto +Stok)
│   │   │   ├── stock-out/         # (/stock-out) Riwayat Pengeluaran Barang
│   │   │   │   └── new/page.tsx   # (/stock-out/new) Form Distribusi/Pengiriman (Auto -Stok & Validasi)
│   │   │   ├── opname/            # (/opname) Riwayat Pemeriksaan Fisik & Selisih
│   │   │   │   └── new/page.tsx   # (/opname/new) Form Hitung Fisik Massal (Auto Adjustment)
│   │   │   ├── reports/           # (/reports) 5 Jenis Laporan, Cetak/PDF & Export CSV (Excel)
│   │   │   ├── users/             # (/users) Kelola Akun Staf & Role (Admin Only)
│   │   │   └── settings/          # (/settings) KOP Perusahaan, Master Kategori & Satuan (Admin Only)
│   │   ├── login/page.tsx         # (/login) Halaman Login dengan informasi demo
│   │   ├── globals.css            # Desain token Tailwind CSS v4
│   │   └── layout.tsx             # Root layout HTML
│   ├── components/
│   │   └── sidebar.tsx            # Komponen Sidebar navigasi dinamis berbasis role
│   ├── db/
│   │   ├── index.ts               # Koneksi database SQLite (node:sqlite + drizzle sqlite-proxy)
│   │   ├── schema.ts              # 8 tabel: users, categories, units, products, stock_in, stock_out, opname, settings
│   │   └── seed.ts                # Inisialisasi DDL tabel & 10 produk demo, 18 transaksi, 3 user
│   ├── lib/
│   │   ├── actions/               # Server Actions (products, stock-in, stock-out, opname, users, settings)
│   │   ├── auth/                  # Logika login, logout, session cookie (session.ts, actions.ts)
│   │   └── utils.ts               # Formatter mata uang IDR, tanggal bahasa Indonesia
│   └── proxy.ts                   # Next.js 16 Proxy Authentication Guard
├── pnpm-workspace.yaml            # Konfigurasi build pnpm
├── package.json                   # Dependensi proyek
└── tsconfig.json                  # Konfigurasi TypeScript
```

---

## ⚡ Cara Menjalankan di Local

### 1. Masuk ke folder proyek
```powershell
cd d:\anti-gravity\inventory-gmi
```

### 2. Jalankan Inisialisasi & Seed Database (Jika diperlukan reset/pertama kali)
```powershell
pnpm db:seed
```

### 3. Jalankan Server Development
```powershell
pnpm dev
```
Buka browser pada: **http://localhost:3000**

### 4. Menjalankan Suite Pengujian (Automated Tests)
```powershell
pnpm test
```
Menjalankan 16 skenario pengujian otomatis mencakup autentikasi JWT, verifikasi akun demo, penambahan/pengurangan stok, validasi defisit stok, rekonsiliasi opname fisik, serta proteksi foreign key.

### 5. Menjalankan Build Produksi
```powershell
pnpm build
pnpm start
```

---

## 📝 Catatan Penting untuk AI Agent di Conversation Baru

Jika Anda adalah agen AI yang melanjutkan proyek ini di conversation baru:
1. **Konvensi Next.js 16**: Proyek ini menggunakan `src/proxy.ts` (bukan `middleware.ts`). Jangan membuat file `middleware.ts` karena akan memicu konflik di Next.js 16.
2. **Database Engine**: Menggunakan modul bawaan `node:sqlite` yang dihubungkan ke Drizzle ORM via `drizzle-orm/sqlite-proxy` di `src/db/index.ts`. **Jangan mengganti ke `better-sqlite3`** karena `better-sqlite3` membutuhkan Visual Studio C++ build tools yang tidak tersedia di environment Windows pengguna.
3. **Eksekusi Server Actions**: Selalu gunakan direktif `"use server"` di bagian atas file actions.
4. **Data Mutasi**:
   - Penambahan barang masuk di `src/lib/actions/stock-in.ts` otomatis menambahkan saldo `products.currentStock`.
   - Pengeluaran barang di `src/lib/actions/stock-out.ts` melakukan validasi stok tersedia sebelum mengurangi saldo `products.currentStock`.
   - Stok opname di `src/lib/actions/opname.ts` otomatis menyesuaikan saldo `products.currentStock` sesuai fisik aktual yang dimasukkan.

import { DatabaseSync } from "node:sqlite";
import bcrypt from "bcryptjs";

export function autoInitDatabase(sqlite: DatabaseSync) {
  // Check if tables already exist
  const tableCheck = sqlite
    .prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='users'")
    .get() as { name?: string } | undefined;

  if (tableCheck && tableCheck.name === "users") {
    // Tables exist, check if seeded
    const userCount = sqlite
      .prepare("SELECT count(*) as count FROM users")
      .get() as { count?: number } | undefined;

    if (userCount && (userCount.count || 0) > 0) {
      return; // Already initialized and seeded
    }
  }

  // 1. Create tables
  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL,
      is_active INTEGER DEFAULT 1,
      failed_login_attempts INTEGER DEFAULT 0,
      locked_until TEXT,
      created_at TEXT,
      updated_at TEXT
    );

    CREATE TABLE IF NOT EXISTS categories (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL UNIQUE,
      created_at TEXT
    );

    CREATE TABLE IF NOT EXISTS units (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL UNIQUE,
      created_at TEXT
    );

    CREATE TABLE IF NOT EXISTS products (
      id TEXT PRIMARY KEY,
      code TEXT NOT NULL UNIQUE,
      name TEXT NOT NULL,
      category_id TEXT REFERENCES categories(id),
      unit_id TEXT REFERENCES units(id),
      min_stock INTEGER DEFAULT 0,
      price REAL DEFAULT 0,
      description TEXT,
      image_url TEXT,
      current_stock INTEGER DEFAULT 0,
      is_deleted INTEGER DEFAULT 0,
      created_at TEXT,
      updated_at TEXT
    );

    CREATE TABLE IF NOT EXISTS stock_in (
      id TEXT PRIMARY KEY,
      product_id TEXT NOT NULL REFERENCES products(id),
      quantity INTEGER NOT NULL,
      date TEXT NOT NULL,
      batch_number TEXT,
      expired_at TEXT,
      supplier TEXT,
      reference_number TEXT,
      notes TEXT,
      created_by TEXT REFERENCES users(id),
      created_at TEXT
    );

    CREATE TABLE IF NOT EXISTS stock_out (
      id TEXT PRIMARY KEY,
      product_id TEXT NOT NULL REFERENCES products(id),
      quantity INTEGER NOT NULL,
      date TEXT NOT NULL,
      destination TEXT,
      reference_number TEXT,
      notes TEXT,
      created_by TEXT REFERENCES users(id),
      created_at TEXT
    );

    CREATE TABLE IF NOT EXISTS stock_opname (
      id TEXT PRIMARY KEY,
      date TEXT NOT NULL,
      notes TEXT,
      status TEXT DEFAULT 'draft',
      created_by TEXT REFERENCES users(id),
      created_at TEXT
    );

    CREATE TABLE IF NOT EXISTS stock_opname_items (
      id TEXT PRIMARY KEY,
      opname_id TEXT NOT NULL REFERENCES stock_opname(id),
      product_id TEXT NOT NULL REFERENCES products(id),
      system_stock INTEGER NOT NULL,
      physical_stock INTEGER NOT NULL,
      difference INTEGER NOT NULL,
      reason TEXT
    );

    CREATE TABLE IF NOT EXISTS company_settings (
      id TEXT PRIMARY KEY,
      company_name TEXT DEFAULT 'PT Global Medika Indonesia',
      address TEXT,
      phone TEXT,
      logo_url TEXT,
      updated_at TEXT
    );
  `);

  // 2. Seed Users
  const now = new Date().toISOString();
  const hash = bcrypt.hashSync("Inventori2026!", 10);
  const insertUser = sqlite.prepare(`
    INSERT INTO users (id, name, email, password_hash, role, is_active, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, 1, ?, ?)
  `);

  insertUser.run("usr-admin", "Administrator", "admin@globalmedika.co.id", hash, "admin", now, now);
  insertUser.run("usr-gudang", "Budi Santoso", "gudang@globalmedika.co.id", hash, "gudang", now, now);
  insertUser.run("usr-viewer", "Farrel Nouvaleo", "viewer@globalmedika.co.id", hash, "viewer", now, now);

  // 3. Seed Categories
  const categoryNames = [
    { id: "cat-1", name: "Radiologi" },
    { id: "cat-2", name: "Elektromedik" },
    { id: "cat-3", name: "IVD" },
    { id: "cat-4", name: "Bedah & Ortopedi" },
    { id: "cat-5", name: "Rehabilitasi" },
    { id: "cat-6", name: "Laboratorium" },
    { id: "cat-7", name: "Umum" },
  ];
  const insertCat = sqlite.prepare("INSERT INTO categories (id, name, created_at) VALUES (?, ?, ?)");
  categoryNames.forEach((c) => insertCat.run(c.id, c.name, now));

  // 4. Seed Units
  const unitNames = [
    { id: "unt-1", name: "pcs" },
    { id: "unt-2", name: "box" },
    { id: "unt-3", name: "unit" },
    { id: "unt-4", name: "pack" },
    { id: "unt-5", name: "set" },
    { id: "unt-6", name: "roll" },
    { id: "unt-7", name: "botol" },
  ];
  const insertUnit = sqlite.prepare("INSERT INTO units (id, name, created_at) VALUES (?, ?, ?)");
  unitNames.forEach((u) => insertUnit.run(u.id, u.name, now));

  // 5. Seed Products
  const productsList = [
    { id: "prd-1", code: "PRD-001", name: "Stetoskop Digital SD-700", cat: "cat-2", unit: "unt-1", min: 10, stock: 25, price: 2500000 },
    { id: "prd-2", code: "PRD-002", name: "Pulse Oximeter PO-300", cat: "cat-2", unit: "unt-1", min: 15, stock: 40, price: 1800000 },
    { id: "prd-3", code: "PRD-003", name: "Infus Set Macro 20tpm", cat: "cat-7", unit: "unt-2", min: 50, stock: 120, price: 85000 },
    { id: "prd-4", code: "PRD-004", name: "Masker N95 3M 9501+", cat: "cat-7", unit: "unt-2", min: 30, stock: 85, price: 350000 },
    { id: "prd-5", code: "PRD-005", name: "Sarung Tangan Nitrile M", cat: "cat-7", unit: "unt-2", min: 100, stock: 200, price: 95000 },
    { id: "prd-6", code: "PRD-006", name: "Rapid Test Kit Antigen", cat: "cat-3", unit: "unt-2", min: 20, stock: 60, price: 125000 },
    { id: "prd-7", code: "PRD-007", name: "Film X-Ray 35x43cm", cat: "cat-1", unit: "unt-2", min: 10, stock: 30, price: 750000 },
    { id: "prd-8", code: "PRD-008", name: "Thermometer Digital DT-01", cat: "cat-2", unit: "unt-1", min: 20, stock: 50, price: 150000 },
    { id: "prd-9", code: "PRD-009", name: "Nebulizer Compressor NB-10", cat: "cat-5", unit: "unt-3", min: 15, stock: 12, price: 3200000 },
    { id: "prd-10", code: "PRD-010", name: "Surgical Blade No. 15", cat: "cat-4", unit: "unt-2", min: 25, stock: 70, price: 45000 },
  ];
  const insertProd = sqlite.prepare(`
    INSERT INTO products (id, code, name, category_id, unit_id, min_stock, current_stock, price, is_deleted, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0, ?, ?)
  `);
  productsList.forEach((p) => insertProd.run(p.id, p.code, p.name, p.cat, p.unit, p.min, p.stock, p.price, now, now));

  // 6. Seed Stock In
  const insertIn = sqlite.prepare(`
    INSERT INTO stock_in (id, product_id, quantity, date, batch_number, expired_at, supplier, reference_number, notes, created_by, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'usr-gudang', ?)
  `);

  const daysAgoStr = (days: number) => {
    const d = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    return d.toISOString().split("T")[0];
  };

  insertIn.run("in-1", "prd-1", 15, daysAgoStr(25), "BATCH-SD700-A", null, "PT Medika Utama", "PO-2026-001", "Pengadaan awal", now);
  insertIn.run("in-2", "prd-1", 13, daysAgoStr(8), "BATCH-SD700-B", null, "PT Medika Utama", "PO-2026-008", "Restock", now);
  insertIn.run("in-3", "prd-2", 25, daysAgoStr(24), "BATCH-PO300-A", null, "PT Oksigen Nusantara", "PO-2026-002", "Pengadaan awal", now);
  insertIn.run("in-4", "prd-2", 20, daysAgoStr(10), "BATCH-PO300-B", null, "PT Oksigen Nusantara", "PO-2026-009", "Tambahan stok", now);
  insertIn.run("in-5", "prd-3", 80, daysAgoStr(22), "BATCH-INF-A", "2026-12-25", "CV Suplai Medis Jaya", "PO-2026-003", "Batch segera kadaluarsa", now);
  insertIn.run("in-6", "prd-3", 60, daysAgoStr(6), "BATCH-INF-B", "2027-06-30", "CV Suplai Medis Jaya", "PO-2026-010", "Batch baru", now);
  insertIn.run("in-7", "prd-4", 95, daysAgoStr(18), "BATCH-N95-A", "2027-01-20", "PT Kasa Husada", "PO-2026-011", "Masker N95 batch Q4", now);
  insertIn.run("in-8", "prd-5", 130, daysAgoStr(20), "BATCH-STN-A", null, "PT Sarung Tangan Indonesia", "PO-2026-004", "Bulk purchase", now);
  insertIn.run("in-9", "prd-5", 100, daysAgoStr(7), "BATCH-STN-B", null, "PT Sarung Tangan Indonesia", "PO-2026-005", "Restock", now);
  insertIn.run("in-10", "prd-6", 75, daysAgoStr(15), "BATCH-RTK-A", "2027-01-30", "PT Diagnostic Sejahtera", "PO-2026-012", "Kit Antigen batch klinis", now);
  insertIn.run("in-11", "prd-7", 30, daysAgoStr(14), "BATCH-XR-A", "2027-10-15", "PT Fuji Medical Indonesia", "PO-2026-006", "Film X-Ray", now);
  insertIn.run("in-12", "prd-8", 60, daysAgoStr(16), "BATCH-DT01-A", null, "PT Omron Healthcare Indonesia", "PO-2026-013", "Termometer", now);
  insertIn.run("in-13", "prd-9", 12, daysAgoStr(12), "BATCH-NB10-A", null, "PT Omron Healthcare Indonesia", "PO-2026-007", "Nebulizer", now);
  insertIn.run("in-14", "prd-10", 78, daysAgoStr(11), "BATCH-SB15-A", "2027-11-20", "PT Meditech Surgika", "PO-2026-014", "Pisau bedah steril", now);

  // 7. Seed Stock Out
  const insertOut = sqlite.prepare(`
    INSERT INTO stock_out (id, product_id, quantity, date, destination, reference_number, notes, created_by, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, 'usr-gudang', ?)
  `);

  insertOut.run("out-1", "prd-1", 3, daysAgoStr(5), "RS Harapan Kita Jakarta", "SO-2026-001", "Permintaan rutin", now);
  insertOut.run("out-2", "prd-2", 5, daysAgoStr(4), "Klinik Sehat Sentosa Bekasi", "SO-2026-002", "Pesanan klinik", now);
  insertOut.run("out-3", "prd-3", 20, daysAgoStr(7), "RS Medistra Jakarta Selatan", "SO-2026-003", "Distribusi bulanan", now);
  insertOut.run("out-4", "prd-4", 10, daysAgoStr(3), "RS Pondok Indah", "SO-2026-004", "Permintaan darurat", now);
  insertOut.run("out-5", "prd-5", 30, daysAgoStr(6), "RS Hermina Depok", "SO-2026-005", "Kontrak tahunan", now);
  insertOut.run("out-6", "prd-6", 15, daysAgoStr(2), "Puskesmas Kecamatan Jatinegara", "SO-2026-006", "Program pemerintah", now);
  insertOut.run("out-7", "prd-8", 10, daysAgoStr(4), "Klinik Pratama Ceria Tangerang", "SO-2026-007", "Pesanan klinik", now);
  insertOut.run("out-8", "prd-10", 8, daysAgoStr(2), "RS Persahabatan Jakarta Timur", "SO-2026-008", "Kebutuhan operasi", now);

  // 8. Seed Company Settings
  sqlite.prepare(`
    INSERT INTO company_settings (id, company_name, address, phone, updated_at)
    VALUES ('settings-1', 'PT Global Medika Indonesia', 'Kawasan Industri & Pergudangan Medika Square Blok B No. 7, Jakarta Timur', '+62 21 8901 2345', ?)
  `).run(now);
}

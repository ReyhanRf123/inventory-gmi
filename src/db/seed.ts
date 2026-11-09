import { eq, count } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { db, sqlite } from "./index";
import {
  users,
  categories,
  units,
  products,
  stockIn,
  stockOut,
  companySettings,
} from "./schema";

function initTables() {
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
}

function daysAgo(days: number): string {
  const d = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
  return d.toISOString().split("T")[0];
}

async function seed() {
  console.log("⏳ Menginisialisasi tabel database...");
  initTables();

  const isReset = process.argv.includes("--reset");
  if (isReset) {
    console.log("🧹 Mereset data tabel ke kondisi awal...");
    sqlite.exec(`
      DELETE FROM stock_opname_items;
      DELETE FROM stock_opname;
      DELETE FROM stock_out;
      DELETE FROM stock_in;
      DELETE FROM products;
      DELETE FROM categories;
      DELETE FROM units;
      DELETE FROM users;
      DELETE FROM company_settings;
    `);
  }
  console.log("✅ Tabel siap.\n");

  // 1. Users
  const [existingUsers] = await db.select({ total: count() }).from(users);
  if (!existingUsers || existingUsers.total === 0) {
    console.log("🌱 Menanam data pengguna...");
    const hash = bcrypt.hashSync("Inventori2026!", 10);

    await db.insert(users).values([
      {
        name: "Administrator",
        email: "admin@globalmedika.co.id",
        passwordHash: hash,
        role: "admin",
      },
      {
        name: "Budi Santoso",
        email: "gudang@globalmedika.co.id",
        passwordHash: hash,
        role: "gudang",
      },
      {
        name: "Farrel Nouvaleo",
        email: "viewer@globalmedika.co.id",
        passwordHash: hash,
        role: "viewer",
      },
    ]);
    console.log("   ✅ 3 pengguna ditambahkan.");
  } else {
    console.log("ℹ️  Data pengguna sudah ada, dilewati.");
  }

  // 2. Categories
  const [existingCats] = await db.select({ total: count() }).from(categories);
  if (!existingCats || existingCats.total === 0) {
    console.log("🌱 Menanam data kategori...");
    const categoryNames = [
      "Radiologi",
      "Elektromedik",
      "IVD",
      "Bedah & Ortopedi",
      "Rehabilitasi",
      "Laboratorium",
      "Umum",
    ];
    for (const name of categoryNames) {
      await db.insert(categories).values({ name });
    }
    console.log(`   ✅ ${categoryNames.length} kategori ditambahkan.`);
  } else {
    console.log("ℹ️  Data kategori sudah ada, dilewati.");
  }

  // 3. Units
  const [existingUnits] = await db.select({ total: count() }).from(units);
  if (!existingUnits || existingUnits.total === 0) {
    console.log("🌱 Menanam data satuan...");
    const unitNames = ["pcs", "box", "unit", "pack", "set", "roll", "botol"];
    for (const name of unitNames) {
      await db.insert(units).values({ name });
    }
    console.log(`   ✅ ${unitNames.length} satuan ditambahkan.`);
  } else {
    console.log("ℹ️  Data satuan sudah ada, dilewati.");
  }

  // 4. Products
  const [existingProducts] = await db.select({ total: count() }).from(products);
  if (!existingProducts || existingProducts.total === 0) {
    console.log("🌱 Menanam data produk...");

    const allCategories = await db.select().from(categories);
    const allUnits = await db.select().from(units);
    const catMap = Object.fromEntries(allCategories.map((c) => [c.name, c.id]));
    const unitMap = Object.fromEntries(allUnits.map((u) => [u.name, u.id]));

    // PRD Section 11 - 10 Produk Demo
    const productData = [
      { code: "PRD-001", name: "Stetoskop Digital SD-700", category: "Elektromedik", unit: "pcs", minStock: 10, currentStock: 25, price: 2500000 },
      { code: "PRD-002", name: "Pulse Oximeter PO-300", category: "Elektromedik", unit: "pcs", minStock: 15, currentStock: 40, price: 1800000 },
      { code: "PRD-003", name: "Infus Set Macro 20tpm", category: "Umum", unit: "box", minStock: 50, currentStock: 120, price: 85000 },
      { code: "PRD-004", name: "Masker N95 3M 9501+", category: "Umum", unit: "box", minStock: 30, currentStock: 85, price: 350000 },
      { code: "PRD-005", name: "Sarung Tangan Nitrile M", category: "Umum", unit: "box", minStock: 100, currentStock: 200, price: 95000 },
      { code: "PRD-006", name: "Rapid Test Kit Antigen", category: "IVD", unit: "box", minStock: 20, currentStock: 60, price: 125000 },
      { code: "PRD-007", name: "Film X-Ray 35x43cm", category: "Radiologi", unit: "box", minStock: 10, currentStock: 30, price: 750000 },
      { code: "PRD-008", name: "Thermometer Digital DT-01", category: "Elektromedik", unit: "pcs", minStock: 20, currentStock: 50, price: 150000 },
      { code: "PRD-009", name: "Nebulizer Compressor NB-10", category: "Rehabilitasi", unit: "unit", minStock: 15, currentStock: 12, price: 3200000 }, // Low stock: 12 <= 15
      { code: "PRD-010", name: "Surgical Blade No. 15", category: "Bedah & Ortopedi", unit: "box", minStock: 25, currentStock: 70, price: 45000 },
    ];

    for (const p of productData) {
      await db.insert(products).values({
        code: p.code,
        name: p.name,
        categoryId: catMap[p.category],
        unitId: unitMap[p.unit],
        minStock: p.minStock,
        currentStock: p.currentStock,
        price: p.price,
      });
    }
    console.log(`   ✅ ${productData.length} produk ditambahkan.`);
  } else {
    console.log("ℹ️  Data produk sudah ada, dilewati.");
  }

  // 5. Stock In (Barang Masuk)
  const [existingStockIn] = await db.select({ total: count() }).from(stockIn);
  if (!existingStockIn || existingStockIn.total === 0) {
    console.log("🌱 Menanam data barang masuk...");

    const gudangUser = await db.query.users.findFirst({
      where: eq(users.email, "gudang@globalmedika.co.id"),
    });
    const allProducts = await db.select().from(products);
    const prodMap = Object.fromEntries(allProducts.map((p) => [p.code, p.id]));

    // Accurate stock in matching stock out
    const stockInData = [
      { productCode: "PRD-001", qty: 15, supplier: "PT Medika Utama", batch: "BATCH-SD700-A", exp: null, days: 25, ref: "PO-2026-001", notes: "Pengadaan awal" },
      { productCode: "PRD-001", qty: 13, supplier: "PT Medika Utama", batch: "BATCH-SD700-B", exp: null, days: 8, ref: "PO-2026-008", notes: "Restock" },
      { productCode: "PRD-002", qty: 25, supplier: "PT Oksigen Nusantara", batch: "BATCH-PO300-A", exp: null, days: 24, ref: "PO-2026-002", notes: "Pengadaan awal" },
      { productCode: "PRD-002", qty: 20, supplier: "PT Oksigen Nusantara", batch: "BATCH-PO300-B", exp: null, days: 10, ref: "PO-2026-009", notes: "Tambahan stok" },
      { productCode: "PRD-003", qty: 80, supplier: "CV Suplai Medis Jaya", batch: "BATCH-INF-A", exp: "2026-12-25", days: 22, ref: "PO-2026-003", notes: "Pengadaan bulanan (Batch segera kadaluarsa)" },
      { productCode: "PRD-003", qty: 60, supplier: "CV Suplai Medis Jaya", batch: "BATCH-INF-B", exp: "2027-06-30", days: 6, ref: "PO-2026-010", notes: "Tambahan stok batch baru" },
      { productCode: "PRD-004", qty: 95, supplier: "PT Kasa Husada", batch: "BATCH-N95-A", exp: "2027-01-20", days: 18, ref: "PO-2026-011", notes: "Masker N95 batch Q4" },
      { productCode: "PRD-005", qty: 130, supplier: "PT Sarung Tangan Indonesia", batch: "BATCH-STN-A", exp: null, days: 20, ref: "PO-2026-004", notes: "Pembelian bulk" },
      { productCode: "PRD-005", qty: 100, supplier: "PT Sarung Tangan Indonesia", batch: "BATCH-STN-B", exp: null, days: 7, ref: "PO-2026-005", notes: "Restock" },
      { productCode: "PRD-006", qty: 75, supplier: "PT Diagnostic Sejahtera", batch: "BATCH-RTK-A", exp: "2027-01-30", days: 15, ref: "PO-2026-012", notes: "Kit Antigen batch klinis" },
      { productCode: "PRD-007", qty: 30, supplier: "PT Fuji Medical Indonesia", batch: "BATCH-XR-A", exp: "2027-10-15", days: 14, ref: "PO-2026-006", notes: "Film X-Ray bulan ini" },
      { productCode: "PRD-008", qty: 60, supplier: "PT Omron Healthcare Indonesia", batch: "BATCH-DT01-A", exp: null, days: 16, ref: "PO-2026-013", notes: "Pengadaan termometer" },
      { productCode: "PRD-009", qty: 12, supplier: "PT Omron Healthcare Indonesia", batch: "BATCH-NB10-A", exp: null, days: 12, ref: "PO-2026-007", notes: "Pengadaan nebulizer" },
      { productCode: "PRD-010", qty: 78, supplier: "PT Meditech Surgika", batch: "BATCH-SB15-A", exp: "2027-11-20", days: 11, ref: "PO-2026-014", notes: "Pisau bedah steril" },
    ];

    for (const s of stockInData) {
      await db.insert(stockIn).values({
        productId: prodMap[s.productCode],
        quantity: s.qty,
        date: daysAgo(s.days),
        batchNumber: s.batch,
        expiredAt: s.exp,
        supplier: s.supplier,
        referenceNumber: s.ref,
        notes: s.notes,
        createdBy: gudangUser?.id,
      });
    }
    console.log(`   ✅ ${stockInData.length} transaksi barang masuk ditambahkan.`);
  } else {
    console.log("ℹ️  Data barang masuk sudah ada, dilewati.");
  }

  // 6. Stock Out (Barang Keluar)
  const [existingStockOut] = await db.select({ total: count() }).from(stockOut);
  if (!existingStockOut || existingStockOut.total === 0) {
    console.log("🌱 Menanam data barang keluar...");

    const gudangUser = await db.query.users.findFirst({
      where: eq(users.email, "gudang@globalmedika.co.id"),
    });
    const allProducts = await db.select().from(products);
    const prodMap = Object.fromEntries(allProducts.map((p) => [p.code, p.id]));

    const stockOutData = [
      { productCode: "PRD-001", qty: 3, destination: "RS Harapan Kita Jakarta", days: 5, ref: "SO-2026-001", notes: "Permintaan rutin" },
      { productCode: "PRD-002", qty: 5, destination: "Klinik Sehat Sentosa Bekasi", days: 4, ref: "SO-2026-002", notes: "Pesanan klinik" },
      { productCode: "PRD-003", qty: 20, destination: "RS Medistra Jakarta Selatan", days: 7, ref: "SO-2026-003", notes: "Distribusi bulanan" },
      { productCode: "PRD-004", qty: 10, destination: "RS Pondok Indah", days: 3, ref: "SO-2026-004", notes: "Permintaan darurat" },
      { productCode: "PRD-005", qty: 30, destination: "RS Hermina Depok", days: 6, ref: "SO-2026-005", notes: "Kontrak tahunan" },
      { productCode: "PRD-006", qty: 15, destination: "Puskesmas Kecamatan Jatinegara", days: 2, ref: "SO-2026-006", notes: "Program pemerintah" },
      { productCode: "PRD-008", qty: 10, destination: "Klinik Pratama Ceria Tangerang", days: 4, ref: "SO-2026-007", notes: "Pesanan klinik" },
      { productCode: "PRD-010", qty: 8, destination: "RS Persahabatan Jakarta Timur", days: 2, ref: "SO-2026-008", notes: "Kebutuhan operasi" },
    ];

    for (const s of stockOutData) {
      await db.insert(stockOut).values({
        productId: prodMap[s.productCode],
        quantity: s.qty,
        date: daysAgo(s.days),
        destination: s.destination,
        referenceNumber: s.ref,
        notes: s.notes,
        createdBy: gudangUser?.id,
      });
    }
    console.log(`   ✅ ${stockOutData.length} transaksi barang keluar ditambahkan.`);
  } else {
    console.log("ℹ️  Data barang keluar sudah ada, dilewati.");
  }

  // 7. Company Settings
  const [existingSettings] = await db.select({ total: count() }).from(companySettings);
  if (!existingSettings || existingSettings.total === 0) {
    console.log("🌱 Menanam data pengaturan perusahaan...");
    await db.insert(companySettings).values({
      companyName: "PT Global Medika Indonesia",
      address:
        "Kawasan Industri & Pergudangan Medika Square Blok B No. 7, Jakarta Timur",
      phone: "+62 21 8901 2345",
    });
    console.log("   ✅ Pengaturan perusahaan ditambahkan.");
  } else {
    console.log("ℹ️  Data pengaturan perusahaan sudah ada, dilewati.");
  }

  console.log("\n🎉 Seed selesai!");
}

seed().catch((err) => {
  console.error("❌ Seed gagal:", err);
  process.exit(1);
});

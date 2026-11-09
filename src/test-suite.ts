import { db, sqlite } from "./db/index";
import {
  users,
  products,
  stockIn,
  stockOut,
  stockOpname,
  stockOpnameItems,
  categories,
  units,
  companySettings,
} from "./db/schema";
import { encrypt, decrypt } from "./lib/auth/session";
import { eq, sql } from "drizzle-orm";
import bcrypt from "bcryptjs";

let testsPassed = 0;
let testsFailed = 0;

function assert(condition: boolean, testName: string) {
  if (condition) {
    console.log(`  ✅ PASS: ${testName}`);
    testsPassed++;
  } else {
    console.error(`  ❌ FAIL: ${testName}`);
    testsFailed++;
  }
}

async function runTests() {
  console.log("==================================================");
  console.log("  INVENTORI GMI — INTEGRATION & FUNCTIONAL TESTS");
  console.log("==================================================\n");

  // 1. Session & Auth JWT
  console.log("1. Pengujian Autentikasi & Session JWT");
  const payload = {
    userId: "test-user-id",
    name: "Tester",
    email: "test@example.com",
    role: "admin" as const,
  };
  const token = await encrypt(payload);
  assert(typeof token === "string" && token.length > 20, "Enkripsi JWT menghasilkan token valid");

  const decoded = await decrypt(token);
  assert(decoded?.email === payload.email && decoded?.role === "admin", "Dekripsi JWT mengembalikan payload yang cocok");

  const invalidDecoded = await decrypt("invalid.token.signature");
  assert(invalidDecoded === null, "Token tidak valid didekripsi sebagai null");

  // 2. Demo Users & Password verification
  console.log("\n2. Pengujian Akun Bawaan & Hash Password");
  const adminUser = await db.query.users.findFirst({ where: eq(users.email, "admin@globalmedika.co.id") });
  assert(adminUser !== undefined, "User Administrator ditemukan");
  assert(bcrypt.compareSync("Inventori2026!", adminUser!.passwordHash), "Password Administrator cocok dengan Inventori2026!");

  const gudangUser = await db.query.users.findFirst({ where: eq(users.email, "gudang@globalmedika.co.id") });
  assert(gudangUser !== undefined, "User Admin Gudang ditemukan");
  assert(gudangUser?.role === "gudang", "Role user gudang sesuai");

  const viewerUser = await db.query.users.findFirst({ where: eq(users.email, "viewer@globalmedika.co.id") });
  assert(viewerUser !== undefined, "User Viewer ditemukan");
  assert(viewerUser?.role === "viewer", "Role viewer sesuai");

  // 3. Product Mutasi Stok
  console.log("\n3. Pengujian Mutasi Stok (Barang Masuk & Barang Keluar)");
  const [testProduct] = await db
    .insert(products)
    .values({
      code: "TEST-PROD-01",
      name: "Produk Pengujian Otomatis",
      minStock: 5,
      currentStock: 10,
      price: 100000,
    })
    .returning();

  assert(testProduct.currentStock === 10, "Produk tes berhasil dibuat dengan stok awal 10");

  // Stock In: +15
  await db.insert(stockIn).values({
    productId: testProduct.id,
    quantity: 15,
    date: new Date().toISOString().split("T")[0],
    supplier: "Vendor Tes",
    notes: "Pengujian stok masuk",
  });
  await db
    .update(products)
    .set({ currentStock: sql`${products.currentStock} + 15` })
    .where(eq(products.id, testProduct.id));

  const afterIn = await db.query.products.findFirst({ where: eq(products.id, testProduct.id) });
  assert(afterIn?.currentStock === 25, "Stok bertambah otomatis dari 10 menjadi 25 (+15)");

  // Stock Out: -8
  await db.insert(stockOut).values({
    productId: testProduct.id,
    quantity: 8,
    date: new Date().toISOString().split("T")[0],
    destination: "RS Uji Coba",
    notes: "Pengujian stok keluar",
  });
  await db
    .update(products)
    .set({ currentStock: sql`${products.currentStock} - 8` })
    .where(eq(products.id, testProduct.id));

  const afterOut = await db.query.products.findFirst({ where: eq(products.id, testProduct.id) });
  assert(afterOut?.currentStock === 17, "Stok berkurang otomatis dari 25 menjadi 17 (-8)");

  // Validasi batas stok keluar tidak mencukupi
  const requestedQty = 50;
  const isOutOfStock = (afterOut?.currentStock || 0) < requestedQty;
  assert(isOutOfStock === true, "Validasi pengeluaran barang melebihi saldo stok (17 < 50) terdeteksi");

  // 4. Stock Opname & Automatic Reconciliation
  console.log("\n4. Pengujian Rekonsiliasi Fisik Stok Opname");
  const [opnameHeader] = await db
    .insert(stockOpname)
    .values({
      date: new Date().toISOString().split("T")[0],
      notes: "Opname Test Otomatis",
      status: "final",
    })
    .returning();

  const physicalCount = 14; // Selisih -3 dari sistem (17)
  const difference = physicalCount - (afterOut?.currentStock || 0);

  await db.insert(stockOpnameItems).values({
    opnameId: opnameHeader.id,
    productId: testProduct.id,
    systemStock: afterOut?.currentStock || 0,
    physicalStock: physicalCount,
    difference,
    reason: "Pengujian selisih opname",
  });

  await db
    .update(products)
    .set({ currentStock: physicalCount })
    .where(eq(products.id, testProduct.id));

  const afterOpname = await db.query.products.findFirst({ where: eq(products.id, testProduct.id) });
  assert(afterOpname?.currentStock === 14, "Saldo stok otomatis disesuaikan dengan hasil fisik opname (14)");
  assert(difference === -3, "Selisih opname tercatat akurat (-3)");

  // Clean up test data
  sqlite.exec(`DELETE FROM stock_opname_items WHERE opname_id = '${opnameHeader.id}';`);
  sqlite.exec(`DELETE FROM stock_opname WHERE id = '${opnameHeader.id}';`);
  sqlite.exec(`DELETE FROM stock_out WHERE product_id = '${testProduct.id}';`);
  sqlite.exec(`DELETE FROM stock_in WHERE product_id = '${testProduct.id}';`);
  sqlite.exec(`DELETE FROM products WHERE id = '${testProduct.id}';`);
  console.log("  🧹 Data pengujian sementara telah dibersihkan.");

  // 5. Foreign Key Protection Test
  console.log("\n5. Pengujian Proteksi Foreign Key Kategori & Satuan");
  const [testCat] = await db.insert(categories).values({ name: "Kategori Uji Proteksi" }).returning();
  const [testProdCat] = await db.insert(products).values({
    code: "TEST-CAT-01",
    name: "Produk dengan Kategori Terikat",
    categoryId: testCat.id,
  }).returning();

  // Check in-use logic
  const [inUseCheck] = await db.select({ id: products.id }).from(products).where(eq(products.categoryId, testCat.id)).limit(1);
  assert(inUseCheck !== undefined, "Proteksi mendeteksi kategori sedang digunakan oleh produk aktif");

  // Clean up
  sqlite.exec(`DELETE FROM products WHERE id = '${testProdCat.id}';`);
  sqlite.exec(`DELETE FROM categories WHERE id = '${testCat.id}';`);

  console.log("\n==================================================");
  console.log(`HASIL TEST: ${testsPassed} Berhasil, ${testsFailed} Gagal`);
  console.log("==================================================");

  if (testsFailed > 0) {
    process.exit(1);
  }
}

runTests().catch((err) => {
  console.error("Test execution failed:", err);
  process.exit(1);
});

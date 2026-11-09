import { sqliteTable, text, integer, real } from "drizzle-orm/sqlite-core";
import { relations } from "drizzle-orm";

// ============================================================================
// Tabel: users
// ============================================================================
export const users = sqliteTable("users", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  role: text("role", { enum: ["admin", "gudang", "viewer"] }).notNull(),
  isActive: integer("is_active", { mode: "boolean" }).default(true),
  failedLoginAttempts: integer("failed_login_attempts").default(0),
  lockedUntil: text("locked_until"),
  createdAt: text("created_at").$defaultFn(() => new Date().toISOString()),
  updatedAt: text("updated_at").$defaultFn(() => new Date().toISOString()),
});

export const usersRelations = relations(users, ({ many }) => ({
  stockIns: many(stockIn),
  stockOuts: many(stockOut),
  stockOpnames: many(stockOpname),
}));

// ============================================================================
// Tabel: categories
// ============================================================================
export const categories = sqliteTable("categories", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  name: text("name").notNull().unique(),
  createdAt: text("created_at").$defaultFn(() => new Date().toISOString()),
});

export const categoriesRelations = relations(categories, ({ many }) => ({
  products: many(products),
}));

// ============================================================================
// Tabel: units
// ============================================================================
export const units = sqliteTable("units", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  name: text("name").notNull().unique(),
  createdAt: text("created_at").$defaultFn(() => new Date().toISOString()),
});

export const unitsRelations = relations(units, ({ many }) => ({
  products: many(products),
}));

// ============================================================================
// Tabel: products
// ============================================================================
export const products = sqliteTable("products", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  code: text("code").notNull().unique(),
  name: text("name").notNull(),
  categoryId: text("category_id").references(() => categories.id),
  unitId: text("unit_id").references(() => units.id),
  minStock: integer("min_stock").default(0),
  price: real("price").default(0),
  description: text("description"),
  imageUrl: text("image_url"),
  currentStock: integer("current_stock").default(0),
  isDeleted: integer("is_deleted", { mode: "boolean" }).default(false),
  createdAt: text("created_at").$defaultFn(() => new Date().toISOString()),
  updatedAt: text("updated_at").$defaultFn(() => new Date().toISOString()),
});

export const productsRelations = relations(products, ({ one, many }) => ({
  category: one(categories, {
    fields: [products.categoryId],
    references: [categories.id],
  }),
  unit: one(units, {
    fields: [products.unitId],
    references: [units.id],
  }),
  stockIns: many(stockIn),
  stockOuts: many(stockOut),
  stockOpnameItems: many(stockOpnameItems),
}));

// ============================================================================
// Tabel: stock_in (Barang Masuk)
// ============================================================================
export const stockIn = sqliteTable("stock_in", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  productId: text("product_id")
    .notNull()
    .references(() => products.id),
  quantity: integer("quantity").notNull(),
  date: text("date").notNull(),
  batchNumber: text("batch_number"),
  expiredAt: text("expired_at"),
  supplier: text("supplier"),
  referenceNumber: text("reference_number"),
  notes: text("notes"),
  createdBy: text("created_by").references(() => users.id),
  createdAt: text("created_at").$defaultFn(() => new Date().toISOString()),
});

export const stockInRelations = relations(stockIn, ({ one }) => ({
  product: one(products, {
    fields: [stockIn.productId],
    references: [products.id],
  }),
  creator: one(users, {
    fields: [stockIn.createdBy],
    references: [users.id],
  }),
}));

// ============================================================================
// Tabel: stock_out (Barang Keluar)
// ============================================================================
export const stockOut = sqliteTable("stock_out", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  productId: text("product_id")
    .notNull()
    .references(() => products.id),
  quantity: integer("quantity").notNull(),
  date: text("date").notNull(),
  destination: text("destination"),
  referenceNumber: text("reference_number"),
  notes: text("notes"),
  createdBy: text("created_by").references(() => users.id),
  createdAt: text("created_at").$defaultFn(() => new Date().toISOString()),
});

export const stockOutRelations = relations(stockOut, ({ one }) => ({
  product: one(products, {
    fields: [stockOut.productId],
    references: [products.id],
  }),
  creator: one(users, {
    fields: [stockOut.createdBy],
    references: [users.id],
  }),
}));

// ============================================================================
// Tabel: stock_opname
// ============================================================================
export const stockOpname = sqliteTable("stock_opname", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  date: text("date").notNull(),
  notes: text("notes"),
  status: text("status", { enum: ["draft", "final"] }).default("draft"),
  createdBy: text("created_by").references(() => users.id),
  createdAt: text("created_at").$defaultFn(() => new Date().toISOString()),
});

export const stockOpnameRelations = relations(stockOpname, ({ one, many }) => ({
  creator: one(users, {
    fields: [stockOpname.createdBy],
    references: [users.id],
  }),
  items: many(stockOpnameItems),
}));

// ============================================================================
// Tabel: stock_opname_items
// ============================================================================
export const stockOpnameItems = sqliteTable("stock_opname_items", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  opnameId: text("opname_id")
    .notNull()
    .references(() => stockOpname.id),
  productId: text("product_id")
    .notNull()
    .references(() => products.id),
  systemStock: integer("system_stock").notNull(),
  physicalStock: integer("physical_stock").notNull(),
  difference: integer("difference").notNull(),
  reason: text("reason"),
});

export const stockOpnameItemsRelations = relations(
  stockOpnameItems,
  ({ one }) => ({
    opname: one(stockOpname, {
      fields: [stockOpnameItems.opnameId],
      references: [stockOpname.id],
    }),
    product: one(products, {
      fields: [stockOpnameItems.productId],
      references: [products.id],
    }),
  })
);

// ============================================================================
// Tabel: company_settings (Pengaturan Perusahaan)
// ============================================================================
export const companySettings = sqliteTable("company_settings", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  companyName: text("company_name").default("PT Global Medika Indonesia"),
  address: text("address"),
  phone: text("phone"),
  logoUrl: text("logo_url"),
  updatedAt: text("updated_at").$defaultFn(() => new Date().toISOString()),
});

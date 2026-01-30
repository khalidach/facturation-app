const sqlite = require("better-sqlite3");
const path = require("path");
const fs = require("fs");

let dbPath;

try {
  const { app } = require("electron");
  const userDataPath = app.getPath("userData");
  const dbDirectory = path.join(userDataPath, "data");

  if (!fs.existsSync(dbDirectory)) {
    fs.mkdirSync(dbDirectory, { recursive: true });
  }

  dbPath = path.join(dbDirectory, "facturation.db");
} catch (error) {
  dbPath = path.join(process.cwd(), "facturation.db");
}

const db = new sqlite(dbPath);

// Execute Core Table Creation
const createFacturesTable = `
CREATE TABLE IF NOT EXISTS factures (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    facture_number TEXT UNIQUE,
    facture_number_int INTEGER,
    clientName TEXT NOT NULL,
    clientAddress TEXT,
    clientICE TEXT,
    date TEXT NOT NULL,
    items TEXT NOT NULL,
    type TEXT NOT NULL CHECK(type IN ('facture', 'devis')),
    showMargin BOOLEAN DEFAULT TRUE,
    prixTotalHorsFrais REAL NOT NULL,
    totalFraisServiceHT REAL NOT NULL,
    tva REAL NOT NULL,
    total REAL NOT NULL,
    notes TEXT,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
`;

const createIncomesTable = `
CREATE TABLE IF NOT EXISTS incomes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    amount REAL NOT NULL,
    description TEXT,
    category TEXT DEFAULT 'General',
    contact_person TEXT,
    date TEXT NOT NULL,
    payment_method TEXT DEFAULT 'cash',
    is_cashed INTEGER DEFAULT 1,
    in_bank INTEGER DEFAULT 0,
    facture_id INTEGER,
    cheque_number TEXT,
    bank_name TEXT,
    virement_number TEXT,
    bank_from TEXT,
    bank_to TEXT,
    transaction_ref TEXT,
    bank_sender TEXT,
    bank_recipient TEXT,
    account_recipient TEXT,
    name_recipient TEXT,
    account_sender TEXT,
    name_sender TEXT,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
`;

const createExpensesTable = `
CREATE TABLE IF NOT EXISTS expenses (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    amount REAL NOT NULL,
    description TEXT,
    category TEXT DEFAULT 'General',
    contact_person TEXT,
    date TEXT NOT NULL,
    payment_method TEXT DEFAULT 'cash',
    is_cashed INTEGER DEFAULT 1,
    in_bank INTEGER DEFAULT 0,
    bon_de_commande_id INTEGER,
    cheque_number TEXT,
    bank_name TEXT,
    virement_number TEXT,
    bank_from TEXT,
    bank_to TEXT,
    transaction_ref TEXT,
    bank_sender TEXT,
    bank_recipient TEXT,
    account_recipient TEXT,
    name_recipient TEXT,
    account_sender TEXT,
    name_sender TEXT,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
`;

const createTransfersTable = `
CREATE TABLE IF NOT EXISTS transfers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    amount REAL NOT NULL,
    from_account TEXT NOT NULL,
    to_account TEXT NOT NULL,
    date TEXT NOT NULL,
    description TEXT,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
`;

const createBonDeCommandeTable = `
CREATE TABLE IF NOT EXISTS bon_de_commande (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    order_number TEXT UNIQUE,
    supplierName TEXT NOT NULL,
    supplierAddress TEXT,
    supplierICE TEXT,
    date TEXT NOT NULL,
    items TEXT NOT NULL,
    prixTotalHorsFrais REAL NOT NULL,
    totalFraisServiceHT REAL NOT NULL,
    tva REAL NOT NULL,
    total REAL NOT NULL,
    notes TEXT,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
`;

const createSettingsTable = `CREATE TABLE IF NOT EXISTS settings (key TEXT PRIMARY KEY, value TEXT);`;
const createThemeTable = `CREATE TABLE IF NOT EXISTS theme (id INTEGER PRIMARY KEY CHECK (id = 1), styles TEXT);`;
const createClientsTable = `CREATE TABLE IF NOT EXISTS clients (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL UNIQUE, address TEXT, ice TEXT, email TEXT, phone TEXT, notes TEXT, createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP);`;
const createSuppliersTable = `CREATE TABLE IF NOT EXISTS suppliers (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL UNIQUE, service_type TEXT, contact_person TEXT, email TEXT, phone TEXT, notes TEXT, createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP);`;

// Index Creation Statements
const createIndexes = [
  // Factures Indexes
  "CREATE INDEX IF NOT EXISTS idx_factures_clientName ON factures(clientName);",
  "CREATE INDEX IF NOT EXISTS idx_factures_date ON factures(date);",
  "CREATE INDEX IF NOT EXISTS idx_factures_createdAt ON factures(createdAt);",

  // Incomes Indexes
  "CREATE INDEX IF NOT EXISTS idx_incomes_date ON incomes(date);",
  "CREATE INDEX IF NOT EXISTS idx_incomes_facture_id ON incomes(facture_id);",
  "CREATE INDEX IF NOT EXISTS idx_incomes_category ON incomes(category);",
  "CREATE INDEX IF NOT EXISTS idx_incomes_bank_status ON incomes(in_bank, is_cashed);",

  // Expenses Indexes
  "CREATE INDEX IF NOT EXISTS idx_expenses_date ON expenses(date);",
  "CREATE INDEX IF NOT EXISTS idx_expenses_bc_id ON expenses(bon_de_commande_id);",
  "CREATE INDEX IF NOT EXISTS idx_expenses_category ON expenses(category);",
  "CREATE INDEX IF NOT EXISTS idx_expenses_bank_status ON expenses(in_bank, is_cashed);",

  // Bon De Commande Indexes
  "CREATE INDEX IF NOT EXISTS idx_bc_supplierName ON bon_de_commande(supplierName);",
  "CREATE INDEX IF NOT EXISTS idx_bc_date ON bon_de_commande(date);",
  "CREATE INDEX IF NOT EXISTS idx_bc_createdAt ON bon_de_commande(createdAt);",

  // Contacts Indexes
  "CREATE INDEX IF NOT EXISTS idx_clients_name ON clients(name);",
  "CREATE INDEX IF NOT EXISTS idx_suppliers_name ON suppliers(name);",

  // Transfers Indexes
  "CREATE INDEX IF NOT EXISTS idx_transfers_date ON transfers(date);",
];

db.exec(createFacturesTable);
db.exec(createIncomesTable);
db.exec(createExpensesTable);
db.exec(createTransfersTable);
db.exec(createBonDeCommandeTable);
db.exec(createSettingsTable);
db.exec(createThemeTable);
db.exec(createClientsTable);
db.exec(createSuppliersTable);

// Execute Index Creation
createIndexes.forEach((idxQuery) => db.exec(idxQuery));

/**
 * SELF-HEALING: Add missing columns for detailed bank tracking
 */
function ensureColumns() {
  const financeTables = ["incomes", "expenses"];
  const newCols = [
    { name: "cheque_number", type: "TEXT" },
    { name: "bank_name", type: "TEXT" },
    { name: "virement_number", type: "TEXT" },
    { name: "bank_from", type: "TEXT" },
    { name: "bank_to", type: "TEXT" },
    { name: "transaction_ref", type: "TEXT" },
    { name: "bank_sender", type: "TEXT" },
    { name: "bank_recipient", type: "TEXT" },
    { name: "account_recipient", type: "TEXT" },
    { name: "name_recipient", type: "TEXT" },
    { name: "account_sender", type: "TEXT" },
    { name: "name_sender", type: "TEXT" },
  ];

  financeTables.forEach((table) => {
    try {
      const columns = db.prepare(`PRAGMA table_info(${table})`).all();
      const columnNames = columns.map((c) => c.name);

      newCols.forEach((col) => {
        if (!columnNames.includes(col.name)) {
          db.exec(`ALTER TABLE ${table} ADD COLUMN ${col.name} ${col.type}`);
        }
      });

      if (!columnNames.includes("payment_method")) {
        db.exec(
          `ALTER TABLE ${table} ADD COLUMN payment_method TEXT DEFAULT 'cash'`,
        );
      }
      if (!columnNames.includes("is_cashed")) {
        db.exec(`ALTER TABLE ${table} ADD COLUMN is_cashed INTEGER DEFAULT 1`);
      }
      if (!columnNames.includes("in_bank")) {
        db.exec(`ALTER TABLE ${table} ADD COLUMN in_bank INTEGER DEFAULT 0`);
      }
      if (table === "incomes" && !columnNames.includes("facture_id")) {
        db.exec(`ALTER TABLE incomes ADD COLUMN facture_id INTEGER`);
      }
      if (table === "expenses" && !columnNames.includes("bon_de_commande_id")) {
        db.exec(`ALTER TABLE expenses ADD COLUMN bon_de_commande_id INTEGER`);
      }
    } catch (e) {
      console.error(`Error ensuring columns for ${table}:`, e);
    }
  });
}

function runMigrations() {
  ensureColumns();
  const LATEST_VERSION = 11; // Incremented for indexing
  try {
    const row = db
      .prepare("SELECT value FROM settings WHERE key = 'db_version'")
      .get();
    let currentVersion = row ? parseInt(row.value, 10) : 0;
    if (currentVersion >= LATEST_VERSION) return;
    db.prepare(
      "INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)",
    ).run("db_version", LATEST_VERSION.toString());
  } catch (error) {
    console.error("Migration failed:", error);
  }
}

runMigrations();
module.exports = db;

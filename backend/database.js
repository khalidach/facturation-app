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

const createSettingsTable = `
CREATE TABLE IF NOT EXISTS settings (
    key TEXT PRIMARY KEY,
    value TEXT
);
`;

const createClientsTable = `
CREATE TABLE IF NOT EXISTS clients (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,
    address TEXT,
    ice TEXT,
    email TEXT,
    phone TEXT,
    notes TEXT,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
`;

const createSuppliersTable = `
CREATE TABLE IF NOT EXISTS suppliers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,
    service_type TEXT,
    contact_person TEXT,
    email TEXT,
    phone TEXT,
    notes TEXT,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
`;

const createThemeTable = `
CREATE TABLE IF NOT EXISTS theme (
    id INTEGER PRIMARY KEY DEFAULT 1,
    styles TEXT
);
`;

// NEW: Transactions Table for Income/Expenses
const createTransactionsTable = `
CREATE TABLE IF NOT EXISTS transactions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    type TEXT NOT NULL CHECK(type IN ('income', 'expense')),
    amount REAL NOT NULL,
    description TEXT,
    category TEXT,
    date TEXT NOT NULL,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
`;

db.exec(createFacturesTable);
db.exec(createSettingsTable);
db.exec(createThemeTable);
db.exec(createClientsTable);
db.exec(createSuppliersTable);
db.exec(createTransactionsTable);

const migrations = {
  1: () => {
    const tableCheck = db
      .prepare(
        "SELECT name FROM sqlite_master WHERE type='table' AND name='factures'"
      )
      .get();
    if (tableCheck) {
      const columns = db.prepare("PRAGMA table_info(factures)").all();
      if (!columns.some((col) => col.name === "facture_number_int")) {
        db.exec("ALTER TABLE factures ADD COLUMN facture_number_int INTEGER");
      }
    }
  },
  2: () => {
    db.exec(`
      CREATE INDEX IF NOT EXISTS idx_factures_clientName ON factures(clientName);
      CREATE INDEX IF NOT EXISTS idx_factures_createdAt ON factures(createdAt); 
      CREATE INDEX IF NOT EXISTS idx_clients_email ON clients(email);
      CREATE INDEX IF NOT EXISTS idx_clients_phone ON clients(phone);
      CREATE INDEX IF NOT EXISTS idx_clients_ice ON clients(ice);
      CREATE INDEX IF NOT EXISTS idx_suppliers_email ON suppliers(email);
      CREATE INDEX IF NOT EXISTS idx_suppliers_phone ON suppliers(phone);
      CREATE INDEX IF NOT EXISTS idx_suppliers_service_type ON suppliers(service_type);
    `);
  },
  3: () => {
    db.exec(`
      CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions(date);
      CREATE INDEX IF NOT EXISTS idx_transactions_type ON transactions(type);
    `);
  },
};

const LATEST_VERSION = Object.keys(migrations).reduce(
  (a, b) => Math.max(a, b),
  0
);

function runMigrations() {
  try {
    const row = db
      .prepare("SELECT value FROM settings WHERE key = 'db_version'")
      .get();
    let currentVersion = row ? parseInt(row.value, 10) : 0;

    if (currentVersion >= LATEST_VERSION) return;

    db.transaction(() => {
      for (let v = currentVersion + 1; v <= LATEST_VERSION; v++) {
        const migration = migrations[v];
        if (migration) {
          if (typeof migration === "function") migration();
          else db.exec(migration);
        }
      }
      db.prepare(
        "INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)"
      ).run("db_version", LATEST_VERSION);
    })();
  } catch (error) {
    console.error("Migration failed:", error);
  }
}

runMigrations();

module.exports = db;

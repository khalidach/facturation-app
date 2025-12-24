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

// Base Tables
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

const createSettingsTable = `CREATE TABLE IF NOT EXISTS settings (key TEXT PRIMARY KEY, value TEXT);`;
const createThemeTable = `CREATE TABLE IF NOT EXISTS theme (id INTEGER PRIMARY KEY CHECK (id = 1), styles TEXT);`;
const createClientsTable = `CREATE TABLE IF NOT EXISTS clients (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL UNIQUE, address TEXT, ice TEXT, email TEXT, phone TEXT, notes TEXT, createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP);`;
const createSuppliersTable = `CREATE TABLE IF NOT EXISTS suppliers (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL UNIQUE, service_type TEXT, contact_person TEXT, email TEXT, phone TEXT, notes TEXT, createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP);`;

// Execute Core Table Creation
db.exec(createFacturesTable);
db.exec(createIncomesTable);
db.exec(createExpensesTable);
db.exec(createTransfersTable);
db.exec(createSettingsTable);
db.exec(createThemeTable);
db.exec(createClientsTable);
db.exec(createSuppliersTable);

/**
 * SELF-HEALING: Check and add missing columns on every startup
 * This ensures that even if migrations failed previously, the app fixes itself.
 */
function ensureColumns() {
  const financeTables = ["incomes", "expenses"];
  financeTables.forEach((table) => {
    try {
      const columns = db.prepare(`PRAGMA table_info(${table})`).all();
      const columnNames = columns.map((c) => c.name);

      if (!columnNames.includes("payment_method")) {
        db.exec(
          `ALTER TABLE ${table} ADD COLUMN payment_method TEXT DEFAULT 'cash'`
        );
      }
      if (!columnNames.includes("is_cashed")) {
        db.exec(`ALTER TABLE ${table} ADD COLUMN is_cashed INTEGER DEFAULT 1`);
      }
      if (!columnNames.includes("in_bank")) {
        db.exec(`ALTER TABLE ${table} ADD COLUMN in_bank INTEGER DEFAULT 0`);
      }
    } catch (e) {
      console.error(`Error ensuring columns for ${table}:`, e);
    }
  });

  // Check Transfers table specifically for the description column
  try {
    const transferCols = db.prepare(`PRAGMA table_info(transfers)`).all();
    const transferColNames = transferCols.map((c) => c.name);
    if (!transferColNames.includes("description")) {
      db.exec(`ALTER TABLE transfers ADD COLUMN description TEXT`);
      console.log("Migration: Added 'description' column to transfers table.");
    }
  } catch (e) {
    console.error("Error ensuring columns for transfers:", e);
  }
}

const migrations = {
  1: () => {
    const columns = db.prepare("PRAGMA table_info(factures)").all();
    if (!columns.some((col) => col.name === "facture_number_int")) {
      db.exec("ALTER TABLE factures ADD COLUMN facture_number_int INTEGER");
    }
  },
  2: () => {
    db.exec(`
      CREATE INDEX IF NOT EXISTS idx_factures_clientName ON factures(clientName);
      CREATE INDEX IF NOT EXISTS idx_factures_createdAt ON factures(createdAt); 
    `);
  },
  3: () => {
    db.exec(`
      CREATE INDEX IF NOT EXISTS idx_incomes_date ON incomes(date);
      CREATE INDEX IF NOT EXISTS idx_expenses_date ON expenses(date);
    `);
  },
  6: () => {
    db.exec(`
      CREATE INDEX IF NOT EXISTS idx_incomes_payment ON incomes(payment_method);
      CREATE INDEX IF NOT EXISTS idx_expenses_payment ON expenses(payment_method);
    `);
  },
};

const LATEST_VERSION = 6;

function runMigrations() {
  ensureColumns(); // Run self-healing check first

  try {
    const row = db
      .prepare("SELECT value FROM settings WHERE key = 'db_version'")
      .get();
    let currentVersion = row ? parseInt(row.value, 10) : 0;

    if (currentVersion >= LATEST_VERSION) return;

    db.transaction(() => {
      [1, 2, 3, 6].forEach((v) => {
        if (v > currentVersion && migrations[v]) {
          migrations[v]();
        }
      });
      db.prepare(
        "INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)"
      ).run("db_version", LATEST_VERSION.toString());
    })();
  } catch (error) {
    console.error("Migration failed:", error);
  }
}

runMigrations();
module.exports = db;

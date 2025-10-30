const sqlite = require("better-sqlite3");
const path = require("path");
const fs = require("fs");

let dbPath;

// This logic ensures the database is stored in a persistent location in the packaged app,
// but remains in the project root during development with nodemon.
try {
  // Try to get the electron app module. This will only work when run by Electron.
  const { app } = require("electron");
  // This is the standard path for user-specific application data.
  const userDataPath = app.getPath("userData");
  // Create a subdirectory for our database to keep things tidy.
  const dbDirectory = path.join(userDataPath, "data");

  // Ensure the directory exists.
  if (!fs.existsSync(dbDirectory)) {
    fs.mkdirSync(dbDirectory, { recursive: true });
  }

  dbPath = path.join(dbDirectory, "facturation.db");
  console.log(`Database path set to: ${dbPath}`);
} catch (error) {
  // If require('electron') fails, we are likely in a pure Node.js environment (like nodemon).
  // Fall back to the original behavior for development.
  dbPath = path.join(process.cwd(), "facturation.db");
  console.log(`Running outside of Electron. Database path set to: ${dbPath}`);
}

const db = new sqlite(dbPath);

// Create tables if they don't exist
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

// Run all table creation scripts first to ensure baseline schema
db.exec(createFacturesTable);
db.exec(createSettingsTable);
db.exec(createThemeTable);
db.exec(createClientsTable);
db.exec(createSuppliersTable);

// --- NEW: Database Migration System ---

// Define all migrations.
// Each key is the version number.
// The value can be a SQL string OR a function that runs logic.
const migrations = {
  1: () => {
    // This was the old PRAGMA check.
    // It adds 'facture_number_int' if it's missing, for users with the old schema.
    console.log("Checking for migration 1: facture_number_int...");
    const tableCheck = db
      .prepare(
        "SELECT name FROM sqlite_master WHERE type='table' AND name='factures'"
      )
      .get();
    if (tableCheck) {
      const columns = db.prepare("PRAGMA table_info(factures)").all();
      const hasIntColumn = columns.some(
        (col) => col.name === "facture_number_int"
      );

      if (!hasIntColumn) {
        db.exec("ALTER TABLE factures ADD COLUMN facture_number_int INTEGER");
        console.log(
          "  > Migration 1 applied: Added facture_number_int column."
        );
      } else {
        console.log("  > Migration 1 already applied.");
      }
    }
  },
  // --- NEW MIGRATION ---
  2: () => {
    console.log("Running migration 2: Add search and sort indexes...");
    db.exec(`
      -- Factures: For searching by clientName and sorting by date
      CREATE INDEX IF NOT EXISTS idx_factures_clientName ON factures(clientName);
      CREATE INDEX IF NOT EXISTS idx_factures_createdAt ON factures(createdAt); 
      
      -- Clients: For searching on common fields (name is already indexed by UNIQUE)
      CREATE INDEX IF NOT EXISTS idx_clients_email ON clients(email);
      CREATE INDEX IF NOT EXISTS idx_clients_phone ON clients(phone);
      CREATE INDEX IF NOT EXISTS idx_clients_ice ON clients(ice);

      -- Suppliers: For searching on common fields (name is already indexed by UNIQUE)
      CREATE INDEX IF NOT EXISTS idx_suppliers_email ON suppliers(email);
      CREATE INDEX IF NOT EXISTS idx_suppliers_phone ON suppliers(phone);
      CREATE INDEX IF NOT EXISTS idx_suppliers_service_type ON suppliers(service_type);
    `);
    console.log("  > Migration 2 applied: Search and sort indexes created.");
  },
  // Example for the future:
  // 3: `ALTER TABLE clients ADD COLUMN loyalty_points INTEGER DEFAULT 0;`,
};

// Set the latest version of the database schema by finding the highest key
const LATEST_VERSION = Object.keys(migrations).reduce(
  (a, b) => Math.max(a, b),
  0
);

/**
 * Runs all pending database migrations.
 */
function runMigrations() {
  try {
    // Get the current version from the settings table
    const row = db
      .prepare("SELECT value FROM settings WHERE key = 'db_version'")
      .get();
    let currentVersion = row ? parseInt(row.value, 10) : 0;

    if (currentVersion >= LATEST_VERSION) {
      console.log(`Database is up to date (version ${currentVersion}).`);
      return;
    }

    console.log(
      `Database version ${currentVersion}. Migrating to ${LATEST_VERSION}...`
    );

    // Run migrations in a transaction
    db.transaction(() => {
      for (let v = currentVersion + 1; v <= LATEST_VERSION; v++) {
        const migration = migrations[v];
        if (migration) {
          console.log(`Running migration ${v}...`);
          if (typeof migration === "function") {
            migration(); // Run the function
          } else {
            db.exec(migration); // Run the SQL string
          }
        }
      }

      // Update the database version in the settings table
      db.prepare(
        "INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)"
      ).run("db_version", LATEST_VERSION);
    })();

    console.log(
      `Database migration successful. Now at version ${LATEST_VERSION}.`
    );
  } catch (error) {
    console.error("Failed to run database migrations:", error);
    // The transaction will be rolled back automatically
  }
}

// Run the migrations on app start
runMigrations();

// --- END NEW MIGRATION SYSTEM ---

// The old 'Schema Migration' PRAGMA block has been removed,
// as it is now handled by migration 1.

module.exports = db;

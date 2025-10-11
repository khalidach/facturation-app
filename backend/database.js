const sqlite = require("better-sqlite3");
const path = require("path");
const fs = require("fs");

const dbPath = path.join(process.cwd(), "facturation.db");
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

db.exec(createFacturesTable);
db.exec(createSettingsTable);

// --- Schema Migration ---
// Check if the 'factures' table exists before trying to alter it.
const tableCheck = db
  .prepare(
    "SELECT name FROM sqlite_master WHERE type='table' AND name='factures'"
  )
  .get();
if (tableCheck) {
  // Check if the facture_number_int column is missing and add it.
  const columns = db.prepare("PRAGMA table_info(factures)").all();
  const hasIntColumn = columns.some((col) => col.name === "facture_number_int");

  if (!hasIntColumn) {
    try {
      db.exec("ALTER TABLE factures ADD COLUMN facture_number_int INTEGER");
      console.log("Database schema migrated: Added facture_number_int column.");
    } catch (error) {
      console.error("Failed to migrate database schema:", error);
    }
  }
}

module.exports = db;

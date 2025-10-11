const Database = require("better-sqlite3");
const path = require("path");
const fs = require("fs");

const dbPath = path.join(__dirname, "facturation.db");
const db = new Database(dbPath);

// Create tables if they don't exist
db.exec(`
    CREATE TABLE IF NOT EXISTS factures (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        type TEXT NOT NULL,
        clientName TEXT NOT NULL,
        clientAddress TEXT,
        clientICE TEXT,
        date TEXT NOT NULL,
        items TEXT NOT NULL,
        notes TEXT,
        showMargin BOOLEAN,
        prixTotalHorsFrais REAL,
        totalFraisServiceHT REAL,
        tva REAL,
        total REAL NOT NULL,
        facture_number TEXT
    );

    CREATE TABLE IF NOT EXISTS settings (
        key TEXT PRIMARY KEY,
        value TEXT
    );
`);

function getFactures({ page = 1, limit = 10 }) {
  const offset = (page - 1) * limit;
  const factures = db
    .prepare("SELECT * FROM factures ORDER BY id DESC LIMIT ? OFFSET ?")
    .all(limit, offset);
  const { totalCount } = db
    .prepare("SELECT COUNT(*) as totalCount FROM factures")
    .get();
  return {
    data: factures,
    pagination: {
      currentPage: page,
      totalCount,
      totalPages: Math.ceil(totalCount / limit),
    },
  };
}

function createFacture(facture) {
  const {
    type,
    clientName,
    clientAddress,
    clientICE,
    date,
    items,
    notes,
    showMargin,
    prixTotalHorsFrais,
    totalFraisServiceHT,
    tva,
    total,
  } = facture;
  const year = new Date(date).getFullYear();
  const { lastNum } = db
    .prepare(
      'SELECT COUNT(*) as lastNum FROM factures WHERE strftime("%Y", date) = ?'
    )
    .get(String(year));
  const facture_number = `${year}-${String(lastNum + 1).padStart(4, "0")}`;

  const stmt = db.prepare(
    "INSERT INTO factures (type, clientName, clientAddress, clientICE, date, items, notes, showMargin, prixTotalHorsFrais, totalFraisServiceHT, tva, total, facture_number) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)"
  );
  const result = stmt.run(
    type,
    clientName,
    clientAddress,
    clientICE,
    date,
    JSON.stringify(items),
    notes,
    showMargin,
    prixTotalHorsFrais,
    totalFraisServiceHT,
    tva,
    total,
    facture_number
  );
  return { id: result.lastInsertRowid, ...facture, facture_number };
}

function updateFacture(facture) {
  const {
    id,
    type,
    clientName,
    clientAddress,
    clientICE,
    date,
    items,
    notes,
    showMargin,
    prixTotalHorsFrais,
    totalFraisServiceHT,
    tva,
    total,
  } = facture;
  const stmt = db.prepare(
    "UPDATE factures SET type = ?, clientName = ?, clientAddress = ?, clientICE = ?, date = ?, items = ?, notes = ?, showMargin = ?, prixTotalHorsFrais = ?, totalFraisServiceHT = ?, tva = ?, total = ? WHERE id = ?"
  );
  stmt.run(
    type,
    clientName,
    clientAddress,
    clientICE,
    date,
    JSON.stringify(items),
    notes,
    showMargin,
    prixTotalHorsFrais,
    totalFraisServiceHT,
    tva,
    total,
    id
  );
  return facture;
}

function deleteFacture(id) {
  const stmt = db.prepare("DELETE FROM factures WHERE id = ?");
  stmt.run(id);
  return { id };
}

function getSettings() {
  const rows = db.prepare("SELECT key, value FROM settings").all();
  const settings = rows.reduce((acc, row) => {
    acc[row.key] = row.value;
    return acc;
  }, {});
  return settings;
}

function updateSettings(settings) {
  const stmt = db.prepare(
    "INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)"
  );
  const trans = db.transaction(() => {
    for (const key in settings) {
      stmt.run(key, settings[key]);
    }
  });
  trans();
  return settings;
}

module.exports = {
  getFactures,
  createFacture,
  updateFacture,
  deleteFacture,
  getSettings,
  updateSettings,
};

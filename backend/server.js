const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const db = require("./database");

const app = express();
app.use(cors());
// Increase the body parser limit to accept larger payloads (e.g., for base64 images)
app.use(bodyParser.json({ limit: "10mb" }));
app.use(bodyParser.urlencoded({ extended: true, limit: "10mb" }));

// --- Factures API ---

// Get all factures with pagination
app.get("/api/factures", (req, res) => {
  const page = parseInt(req.query.page || 1, 10);
  const limit = parseInt(req.query.limit || 10, 10);
  const offset = (page - 1) * limit;

  try {
    const countStmt = db.prepare("SELECT COUNT(*) as totalCount FROM factures");
    const { totalCount } = countStmt.get();

    const stmt = db.prepare(
      "SELECT * FROM factures ORDER BY date DESC LIMIT ? OFFSET ?"
    );
    const factures = stmt.all(limit, offset);

    res.json({
      data: factures,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(totalCount / limit),
        totalCount: totalCount,
      },
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create a new facture
app.post("/api/factures", (req, res) => {
  const {
    clientName,
    clientAddress,
    clientICE,
    date,
    items,
    type,
    showMargin,
    prixTotalHorsFrais,
    totalFraisServiceHT,
    tva,
    total,
    notes,
  } = req.body;
  try {
    // Get the latest facture number for the given type
    const lastFactureStmt = db.prepare(
      "SELECT MAX(facture_number_int) as maxNum FROM factures WHERE type = ?"
    );
    const lastFacture = lastFactureStmt.get(type);
    const newNum = (lastFacture.maxNum || 0) + 1;
    const year = new Date(date).getFullYear().toString().slice(-2);
    const facture_number = `${type.toUpperCase()}-${year}-${String(
      newNum
    ).padStart(4, "0")}`;

    const stmt = db.prepare(
      "INSERT INTO factures (facture_number, facture_number_int, clientName, clientAddress, clientICE, date, items, type, showMargin, prixTotalHorsFrais, totalFraisServiceHT, tva, total, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)"
    );
    const info = stmt.run(
      facture_number,
      newNum,
      clientName,
      clientAddress,
      clientICE,
      date,
      JSON.stringify(items),
      type,
      showMargin ? 1 : 0,
      prixTotalHorsFrais,
      totalFraisServiceHT,
      tva,
      total,
      notes
    );
    res
      .status(201)
      .json({ id: info.lastInsertRowid, ...req.body, facture_number });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update a facture
app.put("/api/factures/:id", (req, res) => {
  const { id } = req.params;
  const {
    clientName,
    clientAddress,
    clientICE,
    date,
    items,
    type,
    showMargin,
    prixTotalHorsFrais,
    totalFraisServiceHT,
    tva,
    total,
    notes,
  } = req.body;
  try {
    const stmt = db.prepare(
      "UPDATE factures SET clientName = ?, clientAddress = ?, clientICE = ?, date = ?, items = ?, type = ?, showMargin = ?, prixTotalHorsFrais = ?, totalFraisServiceHT = ?, tva = ?, total = ?, notes = ? WHERE id = ?"
    );
    const info = stmt.run(
      clientName,
      clientAddress,
      clientICE,
      date,
      JSON.stringify(items),
      type,
      showMargin ? 1 : 0,
      prixTotalHorsFrais,
      totalFraisServiceHT,
      tva,
      total,
      notes,
      id
    );
    res.json({ id, ...req.body });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete a facture
app.delete("/api/factures/:id", (req, res) => {
  try {
    const stmt = db.prepare("DELETE FROM factures WHERE id = ?");
    stmt.run(req.params.id);
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// --- Settings API ---

// Get settings
app.get("/api/settings", (req, res) => {
  try {
    const settings = {};
    const rows = db.prepare("SELECT key, value FROM settings").all();
    rows.forEach((row) => {
      settings[row.key] = row.value;
    });
    res.json(settings);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update settings
app.post("/api/settings", (req, res) => {
  const settings = req.body;
  try {
    const stmt = db.prepare(
      "INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)"
    );
    const trans = db.transaction(() => {
      for (const key in settings) {
        stmt.run(key, settings[key]);
      }
    });
    trans();
    res.json({ message: "Settings updated successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = app;

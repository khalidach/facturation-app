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
    facture_number: manualFactureNumber,
  } = req.body;

  try {
    let facture_number;
    let newNum = null;

    if (manualFactureNumber && manualFactureNumber.trim() !== "") {
      facture_number = manualFactureNumber.trim();

      // Check for uniqueness before attempting to insert
      const existingStmt = db.prepare(
        "SELECT id FROM factures WHERE facture_number = ?"
      );
      const existingFacture = existingStmt.get(facture_number);
      if (existingFacture) {
        return res
          .status(400)
          .json({ error: "Document number already exists." });
      }

      // Parse the integer part from the manual number to store it
      const numberPart = parseInt(facture_number.split("/")[0], 10);
      if (!isNaN(numberPart)) {
        newNum = numberPart;
      }
    } else {
      const year = new Date(date).getFullYear().toString();

      // ROBUST QUERY: Get the latest number by parsing the facture_number string directly,
      // which avoids issues with old/bad data in the facture_number_int column.
      const lastFactureStmt = db.prepare(
        `SELECT MAX(CAST(SUBSTR(facture_number, 1, INSTR(facture_number, '/') - 1) AS INTEGER)) as maxNum 
         FROM factures 
         WHERE type = ? AND STRFTIME('%Y', date) = ?`
      );

      const lastFacture = lastFactureStmt.get(type, year);
      newNum = (lastFacture.maxNum || 0) + 1;
      facture_number = `${String(newNum).padStart(3, "0")}/${year}`;
    }

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
    if (error.code === "SQLITE_CONSTRAINT_UNIQUE") {
      return res.status(400).json({ error: "Document number already exists." });
    }
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
    facture_number, // Exclude from update
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

// --- Theme API ---

// Get theme
app.get("/api/theme", (req, res) => {
  try {
    const row = db.prepare("SELECT styles FROM theme WHERE id = 1").get();
    if (row && row.styles) {
      res.json({ styles: JSON.parse(row.styles) });
    } else {
      res.json({ styles: {} }); // Return empty object if no theme is saved yet
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update theme
app.post("/api/theme", (req, res) => {
  console.log("Received request to save theme."); // Added for debugging
  const { styles } = req.body;
  if (!styles) {
    return res.status(400).json({ error: "Styles data is missing." });
  }
  try {
    const stmt = db.prepare(
      "INSERT OR REPLACE INTO theme (id, styles) VALUES (1, ?)"
    );
    stmt.run(JSON.stringify(styles));
    res.status(200).json({ message: "Theme updated successfully" });
  } catch (error) {
    console.error("Failed to save theme:", error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = app;

const { app, BrowserWindow, ipcMain } = require("electron");
const path = require("path");
const db = require("./backend/database"); // Import the database
const { machineIdSync } = require("node-machine-id");

const persistentMachineId = machineIdSync({ original: true });
const isDev = process.env.npm_lifecycle_event === "dev:electron";

function createWindow() {
  const mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  const startUrl = isDev
    ? "http://localhost:5174"
    : `file://${path.join(__dirname, "frontend/dist/index.html")}`;

  mainWindow.loadURL(startUrl);
}

// --- IPC Handlers ---

// Get all factures
ipcMain.handle("db:getFactures", (event, args) => {
  const { page = 1, limit = 10, search = "", sortBy = "newest" } = args;
  const offset = (page - 1) * limit;

  let whereClause = "";
  const params = [];
  const countParams = [];

  if (search) {
    whereClause = `
      WHERE clientName LIKE ? 
      OR facture_number LIKE ? 
      OR CAST(total AS TEXT) LIKE ?
    `;
    const likeTerm = `%${search}%`;
    params.push(likeTerm, likeTerm, likeTerm);
    countParams.push(likeTerm, likeTerm, likeTerm);
  }

  const orderByClause =
    sortBy === "oldest" ? "ORDER BY createdAt ASC" : "ORDER BY createdAt DESC";

  try {
    const countQuery = `SELECT COUNT(*) as totalCount FROM factures ${whereClause}`;
    const countStmt = db.prepare(countQuery);
    const { totalCount } = countStmt.get(...countParams);

    const dataQuery = `SELECT * FROM factures ${whereClause} ${orderByClause} LIMIT ? OFFSET ?`;
    params.push(limit, offset);
    const stmt = db.prepare(dataQuery);
    const factures = stmt.all(...params);

    return {
      data: factures,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(totalCount / limit),
        totalCount: totalCount,
      },
    };
  } catch (error) {
    console.error("Failed to get factures:", error);
    throw new Error(error.message);
  }
});

// Create a new facture
ipcMain.handle("db:createFacture", (event, data) => {
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
  } = data;

  try {
    let facture_number;
    let newNum = null;

    if (manualFactureNumber && manualFactureNumber.trim() !== "") {
      facture_number = manualFactureNumber.trim();
      const existingStmt = db.prepare(
        "SELECT id FROM factures WHERE facture_number = ?"
      );
      if (existingStmt.get(facture_number)) {
        throw new Error("Document number already exists.");
      }
      const numberPart = parseInt(facture_number.split("/")[0], 10);
      if (!isNaN(numberPart)) newNum = numberPart;
    } else {
      const year = new Date(date).getFullYear().toString();

      // FIX: Removed 'type = ?' from the query.
      // Since 'facture_number' must be UNIQUE in the database,
      // we must find the maximum number across ALL types for this year to avoid collisions.
      const lastFactureStmt = db.prepare(
        `SELECT MAX(CAST(SUBSTR(facture_number, 1, INSTR(facture_number, '/') - 1) AS INTEGER)) as maxNum 
         FROM factures 
         WHERE STRFTIME('%Y', date) = ?`
      );

      const lastFacture = lastFactureStmt.get(year);
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
    return { id: info.lastInsertRowid, ...data, facture_number };
  } catch (error) {
    console.error("Failed to create facture:", error);
    // Provide a clearer error message for the UI
    if (error.message.includes("UNIQUE constraint failed")) {
      throw new Error("This document number already exists in the system.");
    }
    throw new Error(error.message);
  }
});

// Update a facture
ipcMain.handle("db:updateFacture", (event, args) => {
  const { id, data } = args;
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
  } = data;
  try {
    const stmt = db.prepare(
      "UPDATE factures SET clientName = ?, clientAddress = ?, clientICE = ?, date = ?, items = ?, type = ?, showMargin = ?, prixTotalHorsFrais = ?, totalFraisServiceHT = ?, tva = ?, total = ?, notes = ? WHERE id = ?"
    );
    stmt.run(
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
    return { id, ...data };
  } catch (error) {
    console.error("Failed to update facture:", error);
    throw new Error(error.message);
  }
});

// Delete a facture
ipcMain.handle("db:deleteFacture", (event, id) => {
  try {
    const stmt = db.prepare("DELETE FROM factures WHERE id = ?");
    stmt.run(id);
    return { success: true };
  } catch (error) {
    console.error("Failed to delete facture:", error);
    throw new Error(error.message);
  }
});

// Get settings
ipcMain.handle("db:getSettings", (event) => {
  try {
    const settings = {};
    const rows = db.prepare("SELECT key, value FROM settings").all();
    rows.forEach((row) => {
      settings[row.key] = row.value;
    });
    return settings;
  } catch (error) {
    console.error("Failed to get settings:", error);
    throw new Error(error.message);
  }
});

// Update settings
ipcMain.handle("db:updateSettings", (event, settings) => {
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
    return { message: "Settings updated successfully" };
  } catch (error) {
    console.error("Failed to update settings:", error);
    throw new Error(error.message);
  }
});

// Get theme
ipcMain.handle("db:getTheme", (event) => {
  try {
    const row = db.prepare("SELECT styles FROM theme WHERE id = 1").get();
    if (row && row.styles) {
      return { styles: JSON.parse(row.styles) };
    }
    return { styles: {} };
  } catch (error) {
    console.error("Failed to get theme:", error);
    throw new Error(error.message);
  }
});

// Update theme
ipcMain.handle("db:updateTheme", (event, data) => {
  const { styles } = data;
  if (!styles) {
    throw new Error("Styles data is missing.");
  }
  try {
    const stmt = db.prepare(
      "INSERT OR REPLACE INTO theme (id, styles) VALUES (1, ?)"
    );
    stmt.run(JSON.stringify(styles));
    return { message: "Theme updated successfully" };
  } catch (error) {
    console.error("Failed to save theme:", error);
    throw new Error(error.message);
  }
});

// --- License Verification IPC Handler ---
ipcMain.handle("license:verify", async (event, args) => {
  const { licenseCode } = args;
  const VERIFICATION_API_URL =
    "https://verification-code.netlify.app/api/verify";

  try {
    const response = await fetch(VERIFICATION_API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        licenseCode: licenseCode,
        machineId: persistentMachineId,
      }),
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(
        data.message || `Server responded with ${response.status}`
      );
    }
    return data;
  } catch (error) {
    console.error("License verification fetch failed:", error);
    throw new Error(
      error.message || "Could not connect to verification service."
    );
  }
});

// --- CLIENTS IPC HANDLERS ---
ipcMain.handle("db:getClients", (event, args) => {
  const { page = 1, limit = 10, search = "" } = args;
  const offset = (page - 1) * limit;
  let whereClause = "";
  const params = [];
  const countParams = [];

  if (search) {
    whereClause =
      "WHERE name LIKE ? OR email LIKE ? OR phone LIKE ? OR ice LIKE ?";
    const likeTerm = `%${search}%`;
    params.push(likeTerm, likeTerm, likeTerm, likeTerm);
    countParams.push(likeTerm, likeTerm, likeTerm, likeTerm);
  }

  try {
    const { totalCount } = db
      .prepare(`SELECT COUNT(*) as totalCount FROM clients ${whereClause}`)
      .get(...countParams);
    const clients = db
      .prepare(
        `SELECT * FROM clients ${whereClause} ORDER BY name ASC LIMIT ? OFFSET ?`
      )
      .all(...params, limit, offset);
    return {
      data: clients,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(totalCount / limit),
        totalCount,
      },
    };
  } catch (error) {
    throw new Error(error.message);
  }
});

ipcMain.handle("db:createClient", (event, data) => {
  const { name, address, ice, email, phone, notes } = data;
  try {
    const info = db
      .prepare(
        "INSERT INTO clients (name, address, ice, email, phone, notes) VALUES (?, ?, ?, ?, ?, ?)"
      )
      .run(name, address, ice, email, phone, notes);
    return { id: info.lastInsertRowid, ...data };
  } catch (error) {
    throw new Error(error.message);
  }
});

ipcMain.handle("db:updateClient", (event, args) => {
  const { id, data } = args;
  const { name, address, ice, email, phone, notes } = data;
  try {
    db.prepare(
      "UPDATE clients SET name = ?, address = ?, ice = ?, email = ?, phone = ?, notes = ? WHERE id = ?"
    ).run(name, address, ice, email, phone, notes, id);
    return { id, ...data };
  } catch (error) {
    throw new Error(error.message);
  }
});

ipcMain.handle("db:deleteClient", (event, id) => {
  try {
    db.prepare("DELETE FROM clients WHERE id = ?").run(id);
    return { success: true };
  } catch (error) {
    throw new Error(error.message);
  }
});

// --- SUPPLIERS IPC HANDLERS ---
ipcMain.handle("db:getSuppliers", (event, args) => {
  const { page = 1, limit = 10, search = "" } = args;
  const offset = (page - 1) * limit;
  let whereClause = "";
  const params = [];
  const countParams = [];

  if (search) {
    whereClause =
      "WHERE name LIKE ? OR email LIKE ? OR phone LIKE ? OR service_type LIKE ?";
    const likeTerm = `%${search}%`;
    params.push(likeTerm, likeTerm, likeTerm, likeTerm);
    countParams.push(likeTerm, likeTerm, likeTerm, likeTerm);
  }

  try {
    const { totalCount } = db
      .prepare(`SELECT COUNT(*) as totalCount FROM suppliers ${whereClause}`)
      .get(...countParams);
    const suppliers = db
      .prepare(
        `SELECT * FROM suppliers ${whereClause} ORDER BY name ASC LIMIT ? OFFSET ?`
      )
      .all(...params, limit, offset);
    return {
      data: suppliers,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(totalCount / limit),
        totalCount,
      },
    };
  } catch (error) {
    throw new Error(error.message);
  }
});

ipcMain.handle("db:createSupplier", (event, data) => {
  const { name, service_type, contact_person, email, phone, notes } = data;
  try {
    const info = db
      .prepare(
        "INSERT INTO suppliers (name, service_type, contact_person, email, phone, notes) VALUES (?, ?, ?, ?, ?, ?)"
      )
      .run(name, service_type, contact_person, email, phone, notes);
    return { id: info.lastInsertRowid, ...data };
  } catch (error) {
    throw new Error(error.message);
  }
});

ipcMain.handle("db:updateSupplier", (event, args) => {
  const { id, data } = args;
  const { name, service_type, contact_person, email, phone, notes } = data;
  try {
    db.prepare(
      "UPDATE suppliers SET name = ?, service_type = ?, contact_person = ?, email = ?, phone = ?, notes = ? WHERE id = ?"
    ).run(name, service_type, contact_person, email, phone, notes, id);
    return { id, ...data };
  } catch (error) {
    throw new Error(error.message);
  }
});

ipcMain.handle("db:deleteSupplier", (event, id) => {
  try {
    db.prepare("DELETE FROM suppliers WHERE id = ?").run(id);
    return { success: true };
  } catch (error) {
    throw new Error(error.message);
  }
});

// --- App Lifecycle ---
app.whenReady().then(() => {
  createWindow();
  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});

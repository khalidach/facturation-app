const { app, BrowserWindow, ipcMain } = require("electron");
const path = require("path");
const db = require("./backend/database"); // Import the database
const { machineIdSync } = require("node-machine-id");

const persistentMachineId = machineIdSync({ original: true });
const isDev = process.env.npm_lifecycle_event === "dev:electron";

function createWindow() {
  const mainWindow = new BrowserWindow({
    width: 1300,
    height: 900,
    show: false,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });
  mainWindow.maximize();
  mainWindow.show();
  const startUrl = isDev
    ? "http://localhost:5174"
    : `file://${path.join(__dirname, "frontend/dist/index.html")}`;

  mainWindow.loadURL(startUrl);
}

// --- IPC Handlers Registration ---

// --- 1. FACTURATION ---
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
    const countResult = db
      .prepare(`SELECT COUNT(*) as totalCount FROM factures ${whereClause}`)
      .get(...countParams);

    const totalCount = countResult ? countResult.totalCount : 0;

    const factures = db
      .prepare(
        `SELECT * FROM factures ${whereClause} ${orderByClause} LIMIT ? OFFSET ?`
      )
      .all(...params, limit, offset);

    return {
      data: factures,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(totalCount / limit),
        totalCount: totalCount,
      },
    };
  } catch (error) {
    console.error("IPC db:getFactures error:", error);
    throw error;
  }
});

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
      if (
        db
          .prepare("SELECT id FROM factures WHERE facture_number = ?")
          .get(facture_number)
      ) {
        throw new Error("Document number already exists.");
      }
      const numberPart = parseInt(facture_number.split("/")[0], 10);
      if (!isNaN(numberPart)) newNum = numberPart;
    } else {
      const year = new Date(date).getFullYear().toString();
      const lastFacture = db
        .prepare(
          `SELECT MAX(CAST(SUBSTR(facture_number, 1, INSTR(facture_number, '/') - 1) AS INTEGER)) as maxNum 
         FROM factures WHERE STRFTIME('%Y', date) = ?`
        )
        .get(year);
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
    if (error.message.includes("UNIQUE"))
      throw new Error("This document number already exists.");
    throw error;
  }
});

ipcMain.handle("db:updateFacture", (event, args) => {
  const { id, data } = args;
  try {
    const stmt = db.prepare(
      "UPDATE factures SET clientName = ?, clientAddress = ?, clientICE = ?, date = ?, items = ?, type = ?, showMargin = ?, prixTotalHorsFrais = ?, totalFraisServiceHT = ?, tva = ?, total = ?, notes = ? WHERE id = ?"
    );
    stmt.run(
      data.clientName,
      data.clientAddress,
      data.clientICE,
      data.date,
      JSON.stringify(data.items),
      data.type,
      data.showMargin ? 1 : 0,
      data.prixTotalHorsFrais,
      data.totalFraisServiceHT,
      data.tva,
      data.total,
      data.notes,
      id
    );
    return { id, ...data };
  } catch (error) {
    throw error;
  }
});

ipcMain.handle("db:deleteFacture", (event, id) => {
  try {
    db.prepare("DELETE FROM factures WHERE id = ?").run(id);
    return { success: true };
  } catch (error) {
    throw error;
  }
});

// --- 2. TRANSACTIONS (Finance) ---
ipcMain.handle("db:getTransactions", (event, args) => {
  const { page = 1, limit = 10, search = "", type = "all" } = args;
  const offset = (page - 1) * limit;
  let whereClause = "WHERE 1=1";
  const params = [];

  if (search) {
    whereClause += " AND (description LIKE ? OR category LIKE ?)";
    params.push(`%${search}%`, `%${search}%`);
  }
  if (type !== "all" && type !== undefined) {
    whereClause += " AND type = ?";
    params.push(type);
  }

  try {
    const countResult = db
      .prepare(`SELECT COUNT(*) as totalCount FROM transactions ${whereClause}`)
      .get(...params);

    const totalCount = countResult ? countResult.totalCount : 0;

    const data = db
      .prepare(
        `SELECT * FROM transactions ${whereClause} ORDER BY date DESC, id DESC LIMIT ? OFFSET ?`
      )
      .all(...params, limit, offset);

    return {
      data,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(totalCount / limit),
        totalCount,
      },
    };
  } catch (error) {
    console.error("IPC db:getTransactions error:", error);
    throw error;
  }
});

ipcMain.handle("db:createTransaction", (event, data) => {
  const { type, amount, description, category, date } = data;
  try {
    const info = db
      .prepare(
        "INSERT INTO transactions (type, amount, description, category, date) VALUES (?, ?, ?, ?, ?)"
      )
      .run(type, amount, description, category, date);
    return { id: info.lastInsertRowid, ...data };
  } catch (error) {
    throw error;
  }
});

ipcMain.handle("db:updateTransaction", (event, { id, data }) => {
  try {
    const stmt = db.prepare(
      "UPDATE transactions SET type = ?, amount = ?, description = ?, category = ?, date = ? WHERE id = ?"
    );
    stmt.run(
      data.type,
      data.amount,
      data.description,
      data.category,
      data.date,
      id
    );
    return { id, ...data };
  } catch (error) {
    throw error;
  }
});

ipcMain.handle("db:deleteTransaction", (event, id) => {
  try {
    db.prepare("DELETE FROM transactions WHERE id = ?").run(id);
    return { success: true };
  } catch (error) {
    throw error;
  }
});

// --- 3. DASHBOARD ---
ipcMain.handle("db:getDashboardStats", (event, args) => {
  const { startDate, endDate } = args;
  try {
    const stats = db
      .prepare(
        `
      SELECT 
        SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END) as totalIncome,
        SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END) as totalExpense
      FROM transactions 
      WHERE date BETWEEN ? AND ?
    `
      )
      .get(startDate, endDate);

    const chartData = db
      .prepare(
        `
      SELECT 
        date,
        SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END) as income,
        SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END) as expense
      FROM transactions 
      WHERE date BETWEEN ? AND ?
      GROUP BY date
      ORDER BY date ASC
    `
      )
      .all(startDate, endDate);

    return {
      summary: {
        income: stats ? stats.totalIncome || 0 : 0,
        expense: stats ? stats.totalExpense || 0 : 0,
        profit:
          (stats ? stats.totalIncome || 0 : 0) -
          (stats ? stats.totalExpense || 0 : 0),
      },
      chartData: chartData || [],
    };
  } catch (error) {
    throw error;
  }
});

// --- 4. CONTACTS (Clients/Suppliers) ---
ipcMain.handle("db:getClients", (event, args) => {
  const { page = 1, limit = 10, search = "" } = args;
  const offset = (page - 1) * limit;
  let where = "";
  const params = [];
  if (search) {
    where = "WHERE name LIKE ? OR email LIKE ? OR phone LIKE ? OR ice LIKE ?";
    const term = `%${search}%`;
    params.push(term, term, term, term);
  }

  const countResult = db
    .prepare(`SELECT COUNT(*) as totalCount FROM clients ${where}`)
    .get(...params);

  const totalCount = countResult ? countResult.totalCount : 0;

  const data = db
    .prepare(
      `SELECT * FROM clients ${where} ORDER BY name ASC LIMIT ? OFFSET ?`
    )
    .all(...params, limit, offset);

  return {
    data,
    pagination: {
      currentPage: page,
      totalPages: Math.ceil(totalCount / limit),
      totalCount,
    },
  };
});

ipcMain.handle("db:createClient", (event, data) => {
  const info = db
    .prepare(
      "INSERT INTO clients (name, address, ice, email, phone, notes) VALUES (?, ?, ?, ?, ?, ?)"
    )
    .run(data.name, data.address, data.ice, data.email, data.phone, data.notes);
  return { id: info.lastInsertRowid, ...data };
});

ipcMain.handle("db:updateClient", (event, { id, data }) => {
  db.prepare(
    "UPDATE clients SET name = ?, address = ?, ice = ?, email = ?, phone = ?, notes = ? WHERE id = ?"
  ).run(
    data.name,
    data.address,
    data.ice,
    data.email,
    data.phone,
    data.notes,
    id
  );
  return { id, ...data };
});

ipcMain.handle("db:deleteClient", (event, id) => {
  db.prepare("DELETE FROM clients WHERE id = ?").run(id);
  return { success: true };
});

ipcMain.handle("db:getSuppliers", (event, args) => {
  const { page = 1, limit = 10, search = "" } = args;
  const offset = (page - 1) * limit;
  let where = "";
  const params = [];
  if (search) {
    where = "WHERE name LIKE ? OR email LIKE ? OR service_type LIKE ?";
    const term = `%${search}%`;
    params.push(term, term, term);
  }

  const countResult = db
    .prepare(`SELECT COUNT(*) as totalCount FROM suppliers ${where}`)
    .get(...params);

  const totalCount = countResult ? countResult.totalCount : 0;

  const data = db
    .prepare(
      `SELECT * FROM suppliers ${where} ORDER BY name ASC LIMIT ? OFFSET ?`
    )
    .all(...params, limit, offset);

  return {
    data,
    pagination: {
      currentPage: page,
      totalPages: Math.ceil(totalCount / limit),
      totalCount,
    },
  };
});

ipcMain.handle("db:createSupplier", (event, data) => {
  const info = db
    .prepare(
      "INSERT INTO suppliers (name, service_type, contact_person, email, phone, notes) VALUES (?, ?, ?, ?, ?, ?)"
    )
    .run(
      data.name,
      data.service_type,
      data.contact_person,
      data.email,
      data.phone,
      data.notes
    );
  return { id: info.lastInsertRowid, ...data };
});

ipcMain.handle("db:updateSupplier", (event, { id, data }) => {
  db.prepare(
    "UPDATE suppliers SET name = ?, service_type = ?, contact_person = ?, email = ?, phone = ?, notes = ? WHERE id = ?"
  ).run(
    data.name,
    data.service_type,
    data.contact_person,
    data.email,
    data.phone,
    data.notes,
    id
  );
  return { id, ...data };
});

ipcMain.handle("db:deleteSupplier", (event, id) => {
  db.prepare("DELETE FROM suppliers WHERE id = ?").run(id);
  return { success: true };
});

// --- 5. SETTINGS & THEME ---
ipcMain.handle("db:getSettings", () => {
  const settings = {};
  db.prepare("SELECT key, value FROM settings")
    .all()
    .forEach((row) => (settings[row.key] = row.value));
  return settings;
});

ipcMain.handle("db:updateSettings", (event, settings) => {
  const stmt = db.prepare(
    "INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)"
  );
  db.transaction(() => {
    for (const k in settings) stmt.run(k, settings[k]);
  })();
  return { success: true };
});

ipcMain.handle("db:getTheme", () => {
  const row = db.prepare("SELECT styles FROM theme WHERE id = 1").get();
  return { styles: row?.styles ? JSON.parse(row.styles) : {} };
});

ipcMain.handle("db:updateTheme", (event, { styles }) => {
  db.prepare("INSERT OR REPLACE INTO theme (id, styles) VALUES (1, ?)").run(
    JSON.stringify(styles)
  );
  return { success: true };
});

// --- 6. LICENSE & APP ---
ipcMain.handle("license:verify", async (event, { licenseCode }) => {
  try {
    const response = await fetch(
      "https://verification-code.netlify.app/api/verify",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ licenseCode, machineId: persistentMachineId }),
      }
    );
    return await response.json();
  } catch (error) {
    console.error("Verification error:", error);
    throw new Error("Verification service unreachable.");
  }
});

app.whenReady().then(createWindow);
app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});

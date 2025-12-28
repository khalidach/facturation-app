const { app, BrowserWindow, ipcMain } = require("electron");
const path = require("path");
const db = require("./backend/database");
const { machineIdSync } = require("node-machine-id");

const persistentMachineId = machineIdSync({ original: true });
const isDev = process.env.npm_lifecycle_event === "dev:electron";

function createWindow() {
  const mainWindow = new BrowserWindow({
    width: 1400,
    height: 950,
    show: false,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"), // Ensure this path is accurate
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

// --- IPC HANDLERS ---

// --- 1. DASHBOARD & ANALYTICS ---
ipcMain.handle("db:getDashboardStats", (event, args) => {
  const { startDate, endDate } = args;
  try {
    // Filter by is_cashed = 1 for accurate financial health
    const incomeStats = db
      .prepare(
        "SELECT SUM(amount) as total FROM incomes WHERE date BETWEEN ? AND ? AND is_cashed = 1"
      )
      .get(startDate, endDate);
    const expenseStats = db
      .prepare(
        "SELECT SUM(amount) as total FROM expenses WHERE date BETWEEN ? AND ? AND is_cashed = 1"
      )
      .get(startDate, endDate);

    const totalIncome = incomeStats?.total || 0;
    const totalExpense = expenseStats?.total || 0;

    const rawIncome = db
      .prepare(
        "SELECT date, SUM(amount) as val FROM incomes WHERE date BETWEEN ? AND ? AND is_cashed = 1 GROUP BY date"
      )
      .all(startDate, endDate);
    const rawExpense = db
      .prepare(
        "SELECT date, SUM(amount) as val FROM expenses WHERE date BETWEEN ? AND ? AND is_cashed = 1 GROUP BY date"
      )
      .all(startDate, endDate);

    const dateMap = {};
    rawIncome.forEach((d) => {
      dateMap[d.date] = { date: d.date, income: d.val || 0, expense: 0 };
    });
    rawExpense.forEach((d) => {
      if (!dateMap[d.date]) {
        dateMap[d.date] = { date: d.date, income: 0, expense: d.val || 0 };
      } else {
        dateMap[d.date].expense = d.val || 0;
      }
    });

    const chartData = Object.values(dateMap).sort((a, b) =>
      a.date.localeCompare(b.date)
    );

    return {
      summary: {
        income: totalIncome,
        expense: totalExpense,
        profit: totalIncome - totalExpense,
      },
      chartData,
    };
  } catch (error) {
    console.error("Dashboard Stats Error:", error);
    throw error;
  }
});

// --- 2. FINANCE (INCOMES & EXPENSES) ---
ipcMain.handle(
  "db:getTransactions",
  (event, { page = 1, limit = 10, search = "", type = "income" }) => {
    const tableName = type === "expense" ? "expenses" : "incomes";
    const offset = (page - 1) * limit;
    let where = "WHERE 1=1";
    const params = [];

    if (search) {
      where +=
        " AND (description LIKE ? OR category LIKE ? OR contact_person LIKE ?)";
      const t = `%${search}%`;
      params.push(t, t, t);
    }

    try {
      const count = db
        .prepare(`SELECT COUNT(*) as total FROM ${tableName} ${where}`)
        .get(...params);
      const data = db
        .prepare(
          `SELECT * FROM ${tableName} ${where} ORDER BY date DESC, id DESC LIMIT ? OFFSET ?`
        )
        .all(...params, limit, offset);

      return {
        data,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil((count?.total || 0) / limit),
          totalCount: count?.total || 0,
        },
      };
    } catch (error) {
      console.error(`Error getting transactions from ${tableName}:`, error);
      throw error;
    }
  }
);

ipcMain.handle("db:createTransaction", (event, data) => {
  const tableName = data.type === "expense" ? "expenses" : "incomes";
  try {
    const stmt = db.prepare(`
      INSERT INTO ${tableName} 
      (amount, description, category, contact_person, date, payment_method, is_cashed, in_bank) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const info = stmt.run(
      data.amount,
      data.description,
      data.category,
      data.contact_person,
      data.date,
      data.payment_method || "cash",
      data.is_cashed ? 1 : 0,
      data.in_bank ? 1 : 0
    );

    return { id: info.lastInsertRowid, ...data };
  } catch (error) {
    console.error("Database Error createTransaction:", error);
    throw error;
  }
});

ipcMain.handle("db:updateTransaction", (event, { id, data }) => {
  const tableName = data.type === "expense" ? "expenses" : "incomes";
  try {
    const stmt = db.prepare(`
      UPDATE ${tableName} 
      SET amount=?, description=?, category=?, contact_person=?, date=?, payment_method=?, is_cashed=?, in_bank=? 
      WHERE id=?
    `);

    stmt.run(
      data.amount,
      data.description,
      data.category,
      data.contact_person,
      data.date,
      data.payment_method,
      data.is_cashed ? 1 : 0,
      data.in_bank ? 1 : 0,
      id
    );

    return { id, ...data };
  } catch (error) {
    console.error("Database Error updateTransaction:", error);
    throw error;
  }
});

ipcMain.handle("db:deleteTransaction", (event, { id, type }) => {
  const tableName = type === "expense" ? "expenses" : "incomes";
  try {
    db.prepare(`DELETE FROM ${tableName} WHERE id = ?`).run(id);
    return { success: true };
  } catch (error) {
    console.error("Database Error deleteTransaction:", error);
    throw error;
  }
});

// --- 3. TREASURY & TRANSFERS ---
ipcMain.handle("db:getTreasuryStats", () => {
  try {
    // Bank balances
    const bankIncome =
      db
        .prepare(
          "SELECT SUM(amount) as total FROM incomes WHERE payment_method IN ('virement', 'cheque', 'versement') AND is_cashed = 1"
        )
        .get().total || 0;
    const bankExpense =
      db
        .prepare(
          "SELECT SUM(amount) as total FROM expenses WHERE payment_method IN ('virement', 'cheque', 'versement') AND is_cashed = 1"
        )
        .get().total || 0;
    const bankTransfersIn =
      db
        .prepare(
          "SELECT SUM(amount) as total FROM transfers WHERE to_account = 'banque'"
        )
        .get().total || 0;
    const bankTransfersOut =
      db
        .prepare(
          "SELECT SUM(amount) as total FROM transfers WHERE from_account = 'banque'"
        )
        .get().total || 0;

    // Cash balances
    const cashIncome =
      db
        .prepare(
          "SELECT SUM(amount) as total FROM incomes WHERE payment_method = 'cash'"
        )
        .get().total || 0;
    const cashExpense =
      db
        .prepare(
          "SELECT SUM(amount) as total FROM expenses WHERE payment_method = 'cash'"
        )
        .get().total || 0;
    const cashTransfersIn =
      db
        .prepare(
          "SELECT SUM(amount) as total FROM transfers WHERE to_account = 'caisse'"
        )
        .get().total || 0;
    const cashTransfersOut =
      db
        .prepare(
          "SELECT SUM(amount) as total FROM transfers WHERE from_account = 'caisse'"
        )
        .get().total || 0;

    const pendingChecks =
      db
        .prepare(
          "SELECT SUM(amount) as total FROM incomes WHERE payment_method = 'cheque' AND is_cashed = 0"
        )
        .get().total || 0;

    return {
      banque: bankIncome - bankExpense + bankTransfersIn - bankTransfersOut,
      caisse: cashIncome - cashExpense + cashTransfersIn - cashTransfersOut,
      pendingChecks,
    };
  } catch (error) {
    console.error("Error getting treasury stats:", error);
    throw error;
  }
});

ipcMain.handle("db:createTransfer", (event, data) => {
  try {
    const info = db
      .prepare(
        "INSERT INTO transfers (amount, from_account, to_account, date, description) VALUES (?, ?, ?, ?, ?)"
      )
      .run(
        data.amount,
        data.from_account,
        data.to_account,
        data.date,
        data.description
      );
    return { id: info.lastInsertRowid, ...data };
  } catch (error) {
    console.error("Error creating transfer:", error);
    throw error;
  }
});

ipcMain.handle("db:getTransfers", (event, { page = 1, limit = 10 }) => {
  try {
    const offset = (page - 1) * limit;
    const count = db
      .prepare("SELECT COUNT(*) as total FROM transfers")
      .get().total;
    const data = db
      .prepare(
        "SELECT * FROM transfers ORDER BY date DESC, id DESC LIMIT ? OFFSET ?"
      )
      .all(limit, offset);
    return {
      data,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(count / limit),
        totalCount: count,
      },
    };
  } catch (error) {
    console.error("Error getting transfers:", error);
    throw error;
  }
});

// --- 4. FACTURATION (INVOICES & QUOTES) ---
ipcMain.handle("db:getFactures", (event, args) => {
  const { page = 1, limit = 10, search = "", sortBy = "newest" } = args;
  const offset = (page - 1) * limit;
  let whereClause = "";
  const params = [];
  if (search) {
    whereClause =
      "WHERE clientName LIKE ? OR facture_number LIKE ? OR CAST(total AS TEXT) LIKE ?";
    const term = `%${search}%`;
    params.push(term, term, term);
  }
  const orderBy =
    sortBy === "oldest" ? "ORDER BY createdAt ASC" : "ORDER BY createdAt DESC";
  try {
    const count = db
      .prepare(`SELECT COUNT(*) as totalCount FROM factures ${whereClause}`)
      .get(...params);
    const data = db
      .prepare(
        `SELECT * FROM factures ${whereClause} ${orderBy} LIMIT ? OFFSET ?`
      )
      .all(...params, limit, offset);
    return {
      data,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil((count?.totalCount || 0) / limit),
        totalCount: count?.totalCount || 0,
      },
    };
  } catch (error) {
    console.error("Error getting factures:", error);
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
    facture_number: manualNum,
  } = data;
  let facture_number = manualNum;
  let newNum = null;
  if (!manualNum || manualNum.trim() === "") {
    const year = new Date(date).getFullYear().toString();
    const last = db
      .prepare(
        "SELECT MAX(CAST(SUBSTR(facture_number, 1, INSTR(facture_number, '/') - 1) AS INTEGER)) as maxNum FROM factures WHERE STRFTIME('%Y', date) = ?"
      )
      .get(year);
    newNum = (last.maxNum || 0) + 1;
    facture_number = `${String(newNum).padStart(3, "0")}/${year}`;
  }
  try {
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
    console.error("Error creating facture:", error);
    throw error;
  }
});

ipcMain.handle("db:updateFacture", (event, { id, data }) => {
  try {
    db.prepare(
      "UPDATE factures SET clientName=?, clientAddress=?, clientICE=?, date=?, items=?, type=?, showMargin=?, prixTotalHorsFrais=?, totalFraisServiceHT=?, tva=?, total=?, notes=? WHERE id=?"
    ).run(
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
    console.error("Error updating facture:", error);
    throw error;
  }
});

ipcMain.handle("db:deleteFacture", (event, id) => {
  try {
    db.prepare("DELETE FROM factures WHERE id = ?").run(id);
    return { success: true };
  } catch (error) {
    console.error("Error deleting facture:", error);
    throw error;
  }
});

// --- 5. CONTACTS (CLIENTS & SUPPLIERS) ---
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
  const count = db
    .prepare(`SELECT COUNT(*) as total FROM clients ${where}`)
    .get(...params);
  const data = db
    .prepare(
      `SELECT * FROM clients ${where} ORDER BY name ASC LIMIT ? OFFSET ?`
    )
    .all(...params, limit, offset);
  return {
    data,
    pagination: {
      currentPage: page,
      totalPages: Math.ceil((count?.total || 0) / limit),
      totalCount: count?.total || 0,
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
    "UPDATE clients SET name=?, address=?, ice=?, email=?, phone=?, notes=? WHERE id=?"
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
  const count = db
    .prepare(`SELECT COUNT(*) as total FROM suppliers ${where}`)
    .get(...params);
  const data = db
    .prepare(
      `SELECT * FROM suppliers ${where} ORDER BY name ASC LIMIT ? OFFSET ?`
    )
    .all(...params, limit, offset);
  return {
    data,
    pagination: {
      currentPage: page,
      totalPages: Math.ceil((count?.total || 0) / limit),
      totalCount: count?.total || 0,
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
    "UPDATE suppliers SET name=?, service_type=?, contact_person=?, email=?, phone=?, notes=? WHERE id=?"
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

// --- 6. SETTINGS & THEME ---
ipcMain.handle("db:getSettings", () => {
  const settings = {};
  db.prepare("SELECT key, value FROM settings")
    .all()
    .forEach((r) => (settings[r.key] = r.value));
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

// --- 7. LICENSE VERIFICATION ---
ipcMain.handle("license:verify", async (event, { licenseCode }) => {
  try {
    const res = await fetch(
      "https://verification-code.netlify.app/api/verify",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ licenseCode, machineId: persistentMachineId }),
      }
    );
    return await res.json();
  } catch (e) {
    console.error("Verification error:", e);
    throw new Error("Verification service unreachable.");
  }
});

// --- APP LIFECYCLE ---
app.whenReady().then(createWindow);

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});

app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});

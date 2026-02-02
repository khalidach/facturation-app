const { app, BrowserWindow, ipcMain } = require("electron");
const path = require("path");
const db = require("./backend/database");
const { initServices } = require("./backend/services");
const { exportFinancialAnalysis } = require("./backend/services/exportService");

const isDev = process.env.npm_lifecycle_event === "dev:electron";

function createWindow() {
  const mainWindow = new BrowserWindow({
    width: 1400,
    height: 950,
    show: false,
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
  mainWindow.once("ready-to-show", () => {
    mainWindow.maximize();
    mainWindow.show();
    mainWindow.focus(); // ⭐ critical line
  });
}

// IPC Handler for Excel Export
// This is placed here because it requires access to the Electron 'dialog'
// module which is best handled in the main process.
// The handler is updated to accept a range object containing start and end periods.
ipcMain.handle("export-analysis-excel", async (event, { range }) => {
  try {
    // Pass the database instance and the date range to the export service
    return await exportFinancialAnalysis(db, range);
  } catch (error) {
    console.error("Export Error in Main Process:", error);
    throw error;
  }
});

app.whenReady().then(() => {
  // Initialize all modularized IPC handlers (Factures, Clients, Finance, etc.)
  initServices(db);

  createWindow();
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});

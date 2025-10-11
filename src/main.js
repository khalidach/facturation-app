const { app, BrowserWindow, ipcMain, dialog } = require("electron");
const path = require("path");
const db = require("./backend/db");

function createWindow() {
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, "./backend/preload.js"),
    },
  });

  // In development, load from Vite dev server. In production, load from the built file.
  if (process.env.NODE_ENV === "development") {
    win.loadURL("http://localhost:5173");
    win.webContents.openDevTools(); // Open DevTools in development
  } else {
    win.loadFile(path.join(__dirname, "../dist/index.html"));
  }
}

app.whenReady().then(() => {
  createWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

// IPC handlers for factures
ipcMain.handle("get-factures", (event, { page, limit }) => {
  return db.getFactures({ page, limit });
});

ipcMain.handle("create-facture", (event, facture) => {
  return db.createFacture(facture);
});

ipcMain.handle("update-facture", (event, facture) => {
  return db.updateFacture(facture);
});

ipcMain.handle("delete-facture", (event, id) => {
  return db.deleteFacture(id);
});

// IPC handlers for settings
ipcMain.handle("get-settings", () => {
  return db.getSettings();
});

ipcMain.handle("update-settings", (event, settings) => {
  return db.updateSettings(settings);
});

// IPC handler for opening file dialog
ipcMain.handle("open-file-dialog", async () => {
  const { filePaths } = await dialog.showOpenDialog({
    properties: ["openFile"],
    filters: [{ name: "Images", extensions: ["jpg", "png", "gif"] }],
  });
  return filePaths[0];
});

const { app, BrowserWindow, ipcMain } = require("electron");
const path = require("path");
const server = require("./backend/server");

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

  // Load the React frontend
  const startUrl =
    process.env.ELECTRON_START_URL ||
    `file://${path.join(__dirname, "frontend/dist/index.html")}`;
  mainWindow.loadURL(startUrl);

  // Open the DevTools.
  // mainWindow.webContents.openDevTools();
}

app.whenReady().then(() => {
  createWindow();

  app.on("activate", function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("window-all-closed", function () {
  if (process.platform !== "darwin") app.quit();
});

// Start the backend server
const port = 3001;
server.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});

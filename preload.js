const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("electronAPI", {
  // You can expose specific backend functions here if needed,
  // but for this structure, we'll use HTTP requests to the local server.
});

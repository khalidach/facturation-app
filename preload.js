const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("electronAPI", {
  // Facturation
  getFactures: (args) => ipcRenderer.invoke("db:getFactures", args),
  createFacture: (data) => ipcRenderer.invoke("db:createFacture", data),
  updateFacture: (id, data) =>
    ipcRenderer.invoke("db:updateFacture", { id, data }),
  deleteFacture: (id) => ipcRenderer.invoke("db:deleteFacture", id),

  // Settings
  getSettings: () => ipcRenderer.invoke("db:getSettings"),
  updateSettings: (data) => ipcRenderer.invoke("db:updateSettings", data),

  // Theme
  getTheme: () => ipcRenderer.invoke("db:getTheme"),
  updateTheme: (data) => ipcRenderer.invoke("db:updateTheme", data),

  // License Verification
  // Simplified: The frontend only needs to send the license code.
  // The main process will handle adding the machineId.
  licenseVerify: (licenseCode) =>
    ipcRenderer.invoke("license:verify", { licenseCode }),
});

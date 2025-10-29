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

  // --- NEW CLIENTS API ---
  getClients: (args) => ipcRenderer.invoke("db:getClients", args),
  createClient: (data) => ipcRenderer.invoke("db:createClient", data),
  updateClient: (id, data) =>
    ipcRenderer.invoke("db:updateClient", { id, data }),
  deleteClient: (id) => ipcRenderer.invoke("db:deleteClient", id),

  // --- NEW SUPPLIERS API ---
  getSuppliers: (args) => ipcRenderer.invoke("db:getSuppliers", args),
  createSupplier: (data) => ipcRenderer.invoke("db:createSupplier", data),
  updateSupplier: (id, data) =>
    ipcRenderer.invoke("db:updateSupplier", { id, data }),
  deleteSupplier: (id) => ipcRenderer.invoke("db:deleteSupplier", id),
});

const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("electronAPI", {
  // Finance & Dashboard
  getTransactions: (args) => ipcRenderer.invoke("db:getTransactions", args),
  createTransaction: (data) => ipcRenderer.invoke("db:createTransaction", data),
  deleteTransaction: (id) => ipcRenderer.invoke("db:deleteTransaction", id),
  getDashboardStats: (args) => ipcRenderer.invoke("db:getDashboardStats", args),

  // Facturation
  getFactures: (args) => ipcRenderer.invoke("db:getFactures", args),
  createFacture: (data) => ipcRenderer.invoke("db:createFacture", data),
  updateFacture: (id, data) =>
    ipcRenderer.invoke("db:updateFacture", { id, data }),
  deleteFacture: (id) => ipcRenderer.invoke("db:deleteFacture", id),

  // Settings & Theme
  getSettings: () => ipcRenderer.invoke("db:getSettings"),
  updateSettings: (data) => ipcRenderer.invoke("db:updateSettings", data),
  getTheme: () => ipcRenderer.invoke("db:getTheme"),
  updateTheme: (data) => ipcRenderer.invoke("db:updateTheme", data),

  // Clients & Suppliers
  getClients: (args) => ipcRenderer.invoke("db:getClients", args),
  createClient: (data) => ipcRenderer.invoke("db:createClient", data),
  updateClient: (id, data) =>
    ipcRenderer.invoke("db:updateClient", { id, data }),
  deleteClient: (id) => ipcRenderer.invoke("db:deleteClient", id),
  getSuppliers: (args) => ipcRenderer.invoke("db:getSuppliers", args),
  createSupplier: (data) => ipcRenderer.invoke("db:createSupplier", data),
  updateSupplier: (id, data) =>
    ipcRenderer.invoke("db:updateSupplier", { id, data }),
  deleteSupplier: (id) => ipcRenderer.invoke("db:deleteSupplier", id),

  licenseVerify: (licenseCode) =>
    ipcRenderer.invoke("license:verify", { licenseCode }),
});

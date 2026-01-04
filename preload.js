const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("electronAPI", {
  // Finance & Dashboard
  getTransactions: (args) => ipcRenderer.invoke("db:getTransactions", args),
  createTransaction: (data) => ipcRenderer.invoke("db:createTransaction", data),
  updateTransaction: (id, data) =>
    ipcRenderer.invoke("db:updateTransaction", { id, data }),
  deleteTransaction: (id) => ipcRenderer.invoke("db:deleteTransaction", id),
  getDashboardStats: (args) => ipcRenderer.invoke("db:getDashboardStats", args),

  // Treasury & Transfers
  getTreasuryStats: () => ipcRenderer.invoke("db:getTreasuryStats"),
  createTransfer: (data) => ipcRenderer.invoke("db:createTransfer", data),
  getTransfers: (args) => ipcRenderer.invoke("db:getTransfers", args),
  deleteTransfer: (id) => ipcRenderer.invoke("db:deleteTransfer", id),

  // Facturation
  getFactures: (args) => ipcRenderer.invoke("db:getFactures", args),
  createFacture: (data) => ipcRenderer.invoke("db:createFacture", data),
  updateFacture: (id, data) =>
    ipcRenderer.invoke("db:updateFacture", { id, data }),
  deleteFacture: (id) => ipcRenderer.invoke("db:deleteFacture", id),
  getPaymentsByFacture: (factureId) =>
    ipcRenderer.invoke("db:getPaymentsByFacture", factureId),

  // Bon de Commande (Purchase Orders)
  getBonDeCommandes: (args) => ipcRenderer.invoke("db:getBonDeCommandes", args),
  createBonDeCommande: (data) =>
    ipcRenderer.invoke("db:createBonDeCommande", data),
  updateBonDeCommande: (id, data) =>
    ipcRenderer.invoke("db:updateBonDeCommande", { id, data }),
  deleteBonDeCommande: (id) => ipcRenderer.invoke("db:deleteBonDeCommande", id),
  getPaymentsByBonDeCommande: (bcId) =>
    ipcRenderer.invoke("db:getPaymentsByBonDeCommande", bcId),

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
  // Inside contextBridge.exposeInMainWorld in preload.js
  getBonDeCommandeById: (id) =>
    ipcRenderer.invoke("db:getBonDeCommandeById", id),

  licenseVerify: (licenseCode) =>
    ipcRenderer.invoke("license:verify", { licenseCode }),
});

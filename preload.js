const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("electronAPI", {
  // --- DASHBOARD & ANALYTICS ---
  getDashboardStats: (args) => ipcRenderer.invoke("db:getDashboardStats", args),

  // --- FINANCE (INCOMES & EXPENSES) ---
  getTransactions: (args) => ipcRenderer.invoke("db:getTransactions", args),
  createTransaction: (data) => ipcRenderer.invoke("db:createTransaction", data),
  updateTransaction: (args) => ipcRenderer.invoke("db:updateTransaction", args),
  deleteTransaction: (args) => ipcRenderer.invoke("db:deleteTransaction", args),
  getPaymentsByFacture: (id) =>
    ipcRenderer.invoke("db:getPaymentsByFacture", id),

  // --- TREASURY & TRANSFERS ---
  getTreasuryStats: () => ipcRenderer.invoke("db:getTreasuryStats"),
  createTransfer: (data) => ipcRenderer.invoke("db:createTransfer", data),
  getTransfers: (args) => ipcRenderer.invoke("db:getTransfers", args),
  deleteTransfer: (id) => ipcRenderer.invoke("db:deleteTransfer", id),

  // --- FACTURATION (INVOICES & QUOTES) ---
  getFactures: (args) => ipcRenderer.invoke("db:getFactures", args),
  createFacture: (data) => ipcRenderer.invoke("db:createFacture", data),
  updateFacture: (args) => ipcRenderer.invoke("db:updateFacture", args),
  deleteFacture: (id) => ipcRenderer.invoke("db:deleteFacture", id),

  // --- BON DE COMMANDE (PURCHASE ORDERS) ---
  getBonDeCommandes: (args) => ipcRenderer.invoke("db:getBonDeCommandes", args),
  createBonDeCommande: (data) =>
    ipcRenderer.invoke("db:createBonDeCommande", data),
  updateBonDeCommande: (args) =>
    ipcRenderer.invoke("db:updateBonDeCommande", args),
  deleteBonDeCommande: (id) => ipcRenderer.invoke("db:deleteBonDeCommande", id),
  getPaymentsByBonDeCommande: (id) =>
    ipcRenderer.invoke("db:getPaymentsByBonDeCommande", id),
  getBonDeCommandeById: (id) =>
    ipcRenderer.invoke("db:getBonDeCommandeById", id),

  // --- CONTACTS (CLIENTS & SUPPLIERS) ---
  getClients: (args) => ipcRenderer.invoke("db:getClients", args),
  createClient: (data) => ipcRenderer.invoke("db:createClient", data),
  updateClient: (args) => ipcRenderer.invoke("db:updateClient", args),
  deleteClient: (id) => ipcRenderer.invoke("db:deleteClient", id),

  getSuppliers: (args) => ipcRenderer.invoke("db:getSuppliers", args),
  createSupplier: (data) => ipcRenderer.invoke("db:createSupplier", data),
  updateSupplier: (args) => ipcRenderer.invoke("db:updateSupplier", args),
  deleteSupplier: (id) => ipcRenderer.invoke("db:deleteSupplier", id),

  // --- SETTINGS & THEME ---
  getSettings: () => ipcRenderer.invoke("db:getSettings"),
  updateSettings: (settings) =>
    ipcRenderer.invoke("db:updateSettings", settings),
  getTheme: () => ipcRenderer.invoke("db:getTheme"),
  updateTheme: (args) => ipcRenderer.invoke("db:updateTheme", args),

  // --- LICENSE & SYSTEM ---
  /**
   * Envoie une demande de vérification de code (Trial ou Lifetime) au service Netlify.
   */
  verifyLicense: (args) => ipcRenderer.invoke("license:verify", args),
  /**
   * Vérifie l'état actuel de la licence stockée localement (vérification offline).
   */
  checkLicenseStatus: () => ipcRenderer.invoke("license:checkStatus"),
  /**
   * Supprime la licence locale pour permettre une nouvelle activation (Sign Out).
   */
  signOut: () => ipcRenderer.invoke("license:signOut"),

  // --- NATIVE PDF ENGINE ---
  generateNativePDF: (args) => ipcRenderer.invoke("pdf:generate", args),
});

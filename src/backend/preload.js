const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("electronAPI", {
  getFactures: (page, limit) =>
    ipcRenderer.invoke("get-factures", { page, limit }),
  createFacture: (facture) => ipcRenderer.invoke("create-facture", facture),
  updateFacture: (facture) => ipcRenderer.invoke("update-facture", facture),
  deleteFacture: (id) => ipcRenderer.invoke("delete-facture", id),
  getSettings: () => ipcRenderer.invoke("get-settings"),
  updateSettings: (settings) => ipcRenderer.invoke("update-settings", settings),
  openFileDialog: () => ipcRenderer.invoke("open-file-dialog"),
});

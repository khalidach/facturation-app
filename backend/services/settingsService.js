const { ipcMain } = require("electron");

function initSettingsService(db) {
  ipcMain.handle("db:getSettings", () => {
    const settings = {};
    db.prepare("SELECT key, value FROM settings")
      .all()
      .forEach((r) => (settings[r.key] = r.value));
    return settings;
  });

  ipcMain.handle("db:updateSettings", (event, settings) => {
    const stmt = db.prepare(
      "INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)",
    );
    db.transaction(() => {
      for (const k in settings) stmt.run(k, settings[k]);
    })();
    return { success: true };
  });

  // Updated to accept type (facture = id 1, bon_de_commande = id 2)
  ipcMain.handle("db:getTheme", (event, type = "facture") => {
    const id = type === "bon_de_commande" ? 2 : 1;
    const row = db.prepare("SELECT styles FROM theme WHERE id = ?").get(id);
    return { styles: row?.styles ? JSON.parse(row.styles) : {} };
  });

  // Updated to accept type
  ipcMain.handle("db:updateTheme", (event, { type, styles }) => {
    const id = type === "bon_de_commande" ? 2 : 1;
    db.prepare("INSERT OR REPLACE INTO theme (id, styles) VALUES (?, ?)").run(
      id,
      JSON.stringify(styles),
    );
    return { success: true };
  });
}

module.exports = { initSettingsService };

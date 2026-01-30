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

  ipcMain.handle("db:getTheme", () => {
    const row = db.prepare("SELECT styles FROM theme WHERE id = 1").get();
    return { styles: row?.styles ? JSON.parse(row.styles) : {} };
  });

  ipcMain.handle("db:updateTheme", (event, { styles }) => {
    db.prepare("INSERT OR REPLACE INTO theme (id, styles) VALUES (1, ?)").run(
      JSON.stringify(styles),
    );
    return { success: true };
  });
}

module.exports = { initSettingsService };

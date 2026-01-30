const { ipcMain } = require("electron");
const { PaginationSchema } = require("./schemas");

function initBonDeCommandeService(db) {
  ipcMain.handle("db:getBonDeCommandes", (event, args) => {
    const { page, limit, search, sortBy } = PaginationSchema.parse(args);
    const offset = (page - 1) * limit;
    let where = search
      ? "WHERE supplierName LIKE ? OR order_number LIKE ? OR CAST(total AS TEXT) LIKE ?"
      : "";
    const params = search ? Array(3).fill(`%${search}%`) : [];
    const orderBy =
      sortBy === "oldest"
        ? "ORDER BY createdAt ASC"
        : "ORDER BY createdAt DESC";

    const count = db
      .prepare(`SELECT COUNT(*) as total FROM bon_de_commande ${where}`)
      .get(...params);
    const data = db
      .prepare(
        `SELECT *, (SELECT COALESCE(SUM(amount), 0) FROM expenses WHERE bon_de_commande_id = bon_de_commande.id) as totalPaid FROM bon_de_commande ${where} ${orderBy} LIMIT ? OFFSET ?`,
      )
      .all(...params, limit, offset);
    return {
      data,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil((count?.total || 0) / limit),
        totalCount: count?.total || 0,
      },
    };
  });

  // Updated with Transaction Pattern for auto-numbering integrity
  ipcMain.handle("db:createBonDeCommande", (event, data) => {
    return db.transaction(() => {
      let { order_number } = data;
      if (!order_number || order_number.trim() === "") {
        const year = new Date(data.date).getFullYear().toString();
        const last = db
          .prepare("SELECT MAX(id) as maxId FROM bon_de_commande")
          .get();
        order_number = `BC-${String((last.maxId || 0) + 1).padStart(3, "0")}/${year}`;
      }
      const info = db
        .prepare(
          `INSERT INTO bon_de_commande (order_number, supplierName, supplierAddress, supplierICE, date, items, prixTotalHorsFrais, totalFraisServiceHT, tva, total, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        )
        .run(
          order_number,
          data.supplierName,
          data.supplierAddress,
          data.supplierICE,
          data.date,
          JSON.stringify(data.items),
          data.prixTotalHorsFrais,
          data.totalFraisServiceHT,
          data.tva,
          data.total,
          data.notes,
        );
      return { id: info.lastInsertRowid, ...data, order_number };
    })();
  });

  ipcMain.handle("db:updateBonDeCommande", (event, { id, data }) => {
    db.prepare(
      `UPDATE bon_de_commande SET supplierName=?, supplierAddress=?, supplierICE=?, date=?, items=?, prixTotalHorsFrais=?, totalFraisServiceHT=?, tva=?, total=?, notes=? WHERE id=?`,
    ).run(
      data.supplierName,
      data.supplierAddress,
      data.supplierICE,
      data.date,
      JSON.stringify(data.items),
      data.prixTotalHorsFrais,
      data.totalFraisServiceHT,
      data.tva,
      data.total,
      data.notes,
      id,
    );
    return { id, ...data };
  });

  // Updated with Transaction Pattern to ensure cleanup of expenses
  ipcMain.handle("db:deleteBonDeCommande", (event, id) => {
    db.transaction(() => {
      db.prepare("DELETE FROM expenses WHERE bon_de_commande_id = ?").run(id);
      db.prepare("DELETE FROM bon_de_commande WHERE id = ?").run(id);
    })();
    return { success: true };
  });

  // New: Bulk Delete handler using the Batch Transaction pattern
  ipcMain.handle("db:bulkDeleteBonDeCommandes", (event, ids) => {
    const deleteBcStmt = db.prepare("DELETE FROM bon_de_commande WHERE id = ?");
    const deleteExpensesStmt = db.prepare(
      "DELETE FROM expenses WHERE bon_de_commande_id = ?",
    );

    db.transaction(() => {
      for (const id of ids) {
        deleteExpensesStmt.run(id);
        deleteBcStmt.run(id);
      }
    })();
    return { success: true };
  });

  ipcMain.handle("db:getPaymentsByBonDeCommande", (event, bcId) => {
    return db
      .prepare(
        "SELECT * FROM expenses WHERE bon_de_commande_id = ? ORDER BY date DESC",
      )
      .all(bcId);
  });

  ipcMain.handle("db:getBonDeCommandeById", (event, id) => {
    return db
      .prepare(
        `SELECT *, (SELECT COALESCE(SUM(amount), 0) FROM expenses WHERE bon_de_commande_id = bon_de_commande.id) as totalPaid FROM bon_de_commande WHERE id = ?`,
      )
      .get(id);
  });
}

module.exports = { initBonDeCommandeService };

const { ipcMain } = require("electron");
const { PaginationSchema, FactureSchema } = require("./schemas");

function initFactureService(db) {
  ipcMain.handle("db:getFactures", (event, args) => {
    const validation = PaginationSchema.safeParse(args);
    const { page, limit, search, sortBy } = validation.data;
    const offset = (page - 1) * limit;
    let whereClause = "";
    const params = [];
    if (search) {
      whereClause =
        "WHERE clientName LIKE ? OR facture_number LIKE ? OR CAST(total AS TEXT) LIKE ?";
      const term = `%${search}%`;
      params.push(term, term, term);
    }
    const orderBy =
      sortBy === "oldest"
        ? "ORDER BY createdAt ASC"
        : "ORDER BY createdAt DESC";
    const count = db
      .prepare(`SELECT COUNT(*) as totalCount FROM factures ${whereClause}`)
      .get(...params);
    const data = db
      .prepare(
        `SELECT *, (SELECT COALESCE(SUM(amount), 0) FROM incomes WHERE facture_id = factures.id) as totalPaid FROM factures ${whereClause} ${orderBy} LIMIT ? OFFSET ?`,
      )
      .all(...params, limit, offset);
    return {
      data,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil((count?.totalCount || 0) / limit),
        totalCount: count?.totalCount || 0,
      },
    };
  });

  ipcMain.handle("db:createFacture", (event, rawData) => {
    const validation = FactureSchema.safeParse(rawData);

    if (!validation.success) {
      console.error("Validation Error (Create):", validation.error.format());
      throw new Error("Données de facture invalides.");
    }

    const data = validation.data;

    return db.transaction(() => {
      let { facture_number } = data;
      let newNum = null;

      if (!facture_number || facture_number.trim() === "") {
        const year = new Date(data.date).getFullYear().toString();
        const last = db
          .prepare(
            "SELECT MAX(CAST(SUBSTR(facture_number, 1, INSTR(facture_number, '/') - 1) AS INTEGER)) as maxNum FROM factures WHERE STRFTIME('%Y', date) = ?",
          )
          .get(year);
        newNum = (last.maxNum || 0) + 1;
        facture_number = `${String(newNum).padStart(3, "0")}/${year}`;
      }

      const stmt = db.prepare(
        "INSERT INTO factures (facture_number, facture_number_int, clientName, clientAddress, clientICE, date, items, type, showMargin, prixTotalHorsFrais, totalFraisServiceHT, tva, total, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
      );

      const info = stmt.run(
        facture_number,
        newNum,
        data.clientName,
        data.clientAddress,
        data.clientICE,
        data.date,
        JSON.stringify(data.items),
        data.type,
        data.showMargin ? 1 : 0,
        data.prixTotalHorsFrais,
        data.totalFraisServiceHT,
        data.tva,
        data.total,
        data.notes,
      );

      return { id: info.lastInsertRowid, ...data, facture_number };
    })();
  });

  ipcMain.handle("db:updateFacture", (event, { id, data: rawData }) => {
    // Perform validation check
    const validation = FactureSchema.safeParse(rawData);

    // If validation fails, return an error instead of crashing
    if (!validation.success) {
      console.error("Validation Error (Update):", validation.error.format());
      throw new Error(
        `Erreur de validation: ${JSON.stringify(validation.error.flatten().fieldErrors)}`,
      );
    }

    const data = validation.data;

    try {
      db.prepare(
        "UPDATE factures SET clientName=?, clientAddress=?, clientICE=?, date=?, items=?, type=?, showMargin=?, prixTotalHorsFrais=?, totalFraisServiceHT=?, tva=?, total=?, notes=? WHERE id=?",
      ).run(
        data.clientName,
        data.clientAddress,
        data.clientICE,
        data.date,
        JSON.stringify(data.items),
        data.type,
        data.showMargin ? 1 : 0,
        data.prixTotalHorsFrais,
        data.totalFraisServiceHT,
        data.tva,
        data.total,
        data.notes,
        id,
      );
      return { id, ...data };
    } catch (err) {
      console.error("Database Update Error:", err);
      throw err;
    }
  });

  ipcMain.handle("db:deleteFacture", (event, id) => {
    db.transaction(() => {
      db.prepare("DELETE FROM incomes WHERE facture_id = ?").run(id);
      db.prepare("DELETE FROM factures WHERE id = ?").run(id);
    })();
    return { success: true };
  });

  ipcMain.handle("db:bulkDeleteFactures", (event, ids) => {
    const deleteFactureStmt = db.prepare("DELETE FROM factures WHERE id = ?");
    const deleteIncomesStmt = db.prepare(
      "DELETE FROM incomes WHERE facture_id = ?",
    );

    db.transaction(() => {
      for (const id of ids) {
        deleteIncomesStmt.run(id);
        deleteFactureStmt.run(id);
      }
    })();
    return { success: true };
  });
}

module.exports = { initFactureService };

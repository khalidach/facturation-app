const { ipcMain } = require("electron");
const { PaginationSchema } = require("./schemas");

function initTreasuryService(db) {
  ipcMain.handle("db:getTreasuryStats", () => {
    const bankIncome =
      db
        .prepare(
          "SELECT SUM(amount) as total FROM incomes WHERE in_bank = 1 AND is_cashed = 1",
        )
        .get().total || 0;
    const bankExpense =
      db
        .prepare(
          "SELECT SUM(amount) as total FROM expenses WHERE in_bank = 1 AND is_cashed = 1",
        )
        .get().total || 0;
    const cashIncome =
      db
        .prepare(
          "SELECT SUM(amount) as total FROM incomes WHERE in_bank = 0 AND is_cashed = 1",
        )
        .get().total || 0;
    const cashExpense =
      db
        .prepare(
          "SELECT SUM(amount) as total FROM expenses WHERE in_bank = 0 AND is_cashed = 1",
        )
        .get().total || 0;
    const bankTransfersIn =
      db
        .prepare(
          "SELECT SUM(amount) as total FROM transfers WHERE to_account = 'banque'",
        )
        .get().total || 0;
    const bankTransfersOut =
      db
        .prepare(
          "SELECT SUM(amount) as total FROM transfers WHERE from_account = 'banque'",
        )
        .get().total || 0;
    const cashTransfersIn =
      db
        .prepare(
          "SELECT SUM(amount) as total FROM transfers WHERE to_account = 'caisse'",
        )
        .get().total || 0;
    const cashTransfersOut =
      db
        .prepare(
          "SELECT SUM(amount) as total FROM transfers WHERE from_account = 'caisse'",
        )
        .get().total || 0;
    const pendingChecks =
      db
        .prepare(
          "SELECT SUM(amount) as total FROM incomes WHERE payment_method = 'cheque' AND is_cashed = 0",
        )
        .get().total || 0;

    return {
      banque: bankIncome - bankExpense + bankTransfersIn - bankTransfersOut,
      caisse: cashIncome - cashExpense + cashTransfersIn - cashTransfersOut,
      pendingChecks,
    };
  });

  ipcMain.handle("db:createTransfer", (event, data) => {
    const info = db
      .prepare(
        "INSERT INTO transfers (amount, from_account, to_account, date, description) VALUES (?, ?, ?, ?, ?)",
      )
      .run(
        data.amount,
        data.from_account,
        data.to_account,
        data.date,
        data.description,
      );
    return { id: info.lastInsertRowid, ...data };
  });

  ipcMain.handle("db:getTransfers", (event, args) => {
    const { page, limit } = PaginationSchema.parse(args);
    const offset = (page - 1) * limit;
    const count = db
      .prepare("SELECT COUNT(*) as total FROM transfers")
      .get().total;
    const data = db
      .prepare(
        "SELECT * FROM transfers ORDER BY date DESC, id DESC LIMIT ? OFFSET ?",
      )
      .all(limit, offset);
    return {
      data,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(count / limit),
        totalCount: count,
      },
    };
  });

  ipcMain.handle("db:deleteTransfer", (event, id) => {
    db.prepare("DELETE FROM transfers WHERE id = ?").run(id);
    return { success: true };
  });
}

module.exports = { initTreasuryService };

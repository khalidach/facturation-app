const { ipcMain } = require("electron");
const { PaginationSchema, TransactionSchema } = require("./schemas");

const ALLOWED_FINANCE_TABLES = {
  income: "incomes",
  expense: "expenses",
};

function initFinanceService(db) {
  ipcMain.handle("db:getTransactions", (event, args) => {
    const validation = PaginationSchema.safeParse(args);
    if (!validation.success)
      throw new Error(`Invalid arguments: ${validation.error.message}`);

    const { page, limit, search, type } = validation.data;
    const tableName = ALLOWED_FINANCE_TABLES[type];
    if (!tableName) throw new Error("Unauthorized database access attempt.");

    const offset = (page - 1) * limit;
    let where = "WHERE 1=1";
    const params = [];

    if (search) {
      where +=
        " AND (description LIKE ? OR category LIKE ? OR contact_person LIKE ? OR cheque_number LIKE ? OR transaction_ref LIKE ?)";
      const t = `%${search}%`;
      params.push(t, t, t, t, t);
    }

    try {
      const count = db
        .prepare(`SELECT COUNT(*) as total FROM ${tableName} ${where}`)
        .get(...params);
      const data = db
        .prepare(
          `SELECT * FROM ${tableName} ${where} ORDER BY date DESC, id DESC LIMIT ? OFFSET ?`,
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
    } catch (error) {
      console.error(`Error getting transactions:`, error);
      throw error;
    }
  });

  ipcMain.handle("db:createTransaction", (event, rawData) => {
    const validation = TransactionSchema.safeParse(rawData);
    if (!validation.success)
      throw new Error(
        `Transaction Validation Failed: ${JSON.stringify(validation.error.flatten().fieldErrors)}`,
      );

    const data = validation.data;
    const tableName = ALLOWED_FINANCE_TABLES[data.type];
    try {
      const columns = [
        "amount",
        "description",
        "category",
        "contact_person",
        "date",
        "payment_method",
        "is_cashed",
        "in_bank",
        "cheque_number",
        "bank_name",
        "transaction_ref",
        "bank_sender",
        "bank_recipient",
        "account_recipient",
        "name_recipient",
        "account_sender",
        "name_sender",
      ];
      const values = [
        data.amount,
        data.description,
        data.category,
        data.contact_person,
        data.date,
        data.payment_method,
        data.is_cashed ? 1 : 0,
        data.in_bank ? 1 : 0,
        data.cheque_number || null,
        data.bank_name || null,
        data.transaction_ref || null,
        data.bank_sender || null,
        data.bank_recipient || null,
        data.account_recipient || null,
        data.name_recipient || null,
        data.account_sender || null,
        data.name_sender || null,
      ];

      if (tableName === "incomes") {
        columns.push("facture_id");
        values.push(data.facture_id || null);
      }
      if (tableName === "expenses") {
        columns.push("bon_de_commande_id");
        values.push(data.bon_de_commande_id || null);
      }

      const placeholders = columns.map(() => "?").join(", ");
      const stmt = db.prepare(
        `INSERT INTO ${tableName} (${columns.join(", ")}) VALUES (${placeholders})`,
      );
      const info = stmt.run(...values);
      return { id: info.lastInsertRowid, ...data };
    } catch (error) {
      throw error;
    }
  });

  ipcMain.handle("db:updateTransaction", (event, { id, data: rawData }) => {
    const validation = TransactionSchema.safeParse(rawData);
    if (!validation.success)
      throw new Error(`Update Validation Failed: ${validation.error.message}`);
    const data = validation.data;
    const tableName = ALLOWED_FINANCE_TABLES[data.type];

    try {
      const columns = [
        "amount=?",
        "description=?",
        "category=?",
        "contact_person=?",
        "date=?",
        "payment_method=?",
        "is_cashed=?",
        "in_bank=?",
        "cheque_number=?",
        "bank_name=?",
        "transaction_ref=?",
        "bank_sender=?",
        "bank_recipient=?",
        "account_recipient=?",
        "name_recipient=?",
        "account_sender=?",
        "name_sender=?",
      ];
      const values = [
        data.amount,
        data.description,
        data.category,
        data.contact_person,
        data.date,
        data.payment_method,
        data.is_cashed ? 1 : 0,
        data.in_bank ? 1 : 0,
        data.cheque_number || null,
        data.bank_name || null,
        data.transaction_ref || null,
        data.bank_sender || null,
        data.bank_recipient || null,
        data.account_recipient || null,
        data.name_recipient || null,
        data.account_sender || null,
        data.name_sender || null,
      ];
      if (tableName === "incomes") {
        columns.push("facture_id=?");
        values.push(data.facture_id || null);
      }
      if (tableName === "expenses") {
        columns.push("bon_de_commande_id=?");
        values.push(data.bon_de_commande_id || null);
      }

      db.prepare(
        `UPDATE ${tableName} SET ${columns.join(", ")} WHERE id=?`,
      ).run(...values, id);
      return { id, ...data };
    } catch (error) {
      throw error;
    }
  });

  ipcMain.handle("db:deleteTransaction", (event, { id, type }) => {
    const tableName = ALLOWED_FINANCE_TABLES[type];
    try {
      db.prepare(`DELETE FROM ${tableName} WHERE id = ?`).run(id);
      return { success: true };
    } catch (error) {
      throw error;
    }
  });

  ipcMain.handle("db:getPaymentsByFacture", (event, factureId) => {
    return db
      .prepare("SELECT * FROM incomes WHERE facture_id = ? ORDER BY date DESC")
      .all(factureId);
  });
}

module.exports = { initFinanceService };

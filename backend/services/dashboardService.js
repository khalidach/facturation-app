const { ipcMain } = require("electron"); //
const { DashboardSchema } = require("./schemas"); //

function initDashboardService(db) {
  ipcMain.handle("db:getDashboardStats", (event, args) => {
    //
    const validation = DashboardSchema.safeParse(args); //
    if (!validation.success)
      //
      throw new Error("Invalid date range for dashboard."); //

    const { startDate, endDate } = validation.data; //
    try {
      //
      const incomeStats = db //
        .prepare(
          "SELECT SUM(amount) as total FROM incomes WHERE date BETWEEN ? AND ? AND is_cashed = 1", //
        )
        .get(startDate, endDate); //
      const expenseStats = db // //
        .prepare(
          "SELECT SUM(amount) as total FROM expenses WHERE date BETWEEN ? AND ? AND is_cashed = 1", //
        )
        .get(startDate, endDate); //

      const totalIncome = incomeStats?.total || 0; //
      const totalExpense = expenseStats?.total || 0; //

      const rawIncome = db //
        .prepare(
          "SELECT date, SUM(amount) as val FROM incomes WHERE date BETWEEN ? AND ? AND is_cashed = 1 GROUP BY date", //
        )
        .all(startDate, endDate); //
      const rawExpense = db //
        .prepare(
          "SELECT date, SUM(amount) as val FROM expenses WHERE date BETWEEN ? AND ? AND is_cashed = 1 GROUP BY date", //
        )
        .all(startDate, endDate); //

      const dateMap = {}; //
      rawIncome.forEach((d) => {
        //
        dateMap[d.date] = { date: d.date, income: d.val || 0, expense: 0 }; //
      }); //
      rawExpense.forEach((d) => {
        //
        if (!dateMap[d.date])
          //
          dateMap[d.date] = { date: d.date, income: 0, expense: d.val || 0 }; //
        else dateMap[d.date].expense = d.val || 0; //
      }); //

      return {
        //
        summary: {
          //
          income: totalIncome, //
          expense: totalExpense, //
          profit: totalIncome - totalExpense, //
        }, //
        chartData: Object.values(dateMap).sort(
          (
            a,
            b, //
          ) => a.date.localeCompare(b.date), //
        ), //
      }; //
    } catch (error) {
      //
      throw error; //
    }
  });

  /**
   * New Handler: Get Financial Data for Export
   * Retrieves comprehensive datasets for Income, Expenses, Factures, and Bon de Commandes.
   * This is used by the frontend Excel service to generate a detailed financial analysis.
   */
  ipcMain.handle(
    "db:getFinancialDataForExport",
    (event, { startDate, endDate }) => {
      try {
        // Fetch Income rows for Table A (Monthly Sheet)
        const income = db
          .prepare(
            `SELECT id, date, clientName, description, category, amount, modePaiement, chequeNumber, reference 
           FROM incomes 
           WHERE date BETWEEN ? AND ?`,
          )
          .all(startDate, endDate);

        // Fetch Expense rows for Table B (Monthly Sheet)
        const expenses = db
          .prepare(
            `SELECT id, date, clientName, description, category, amount, modePaiement, chequeNumber, reference 
           FROM expenses 
           WHERE date BETWEEN ? AND ?`,
          )
          .all(startDate, endDate);

        // Fetch Factures for Table C (Monthly Sheet)
        const factures = db
          .prepare(
            `SELECT id, date, factureNumber, clientName, totalAmount, status 
           FROM factures 
           WHERE date BETWEEN ? AND ?`,
          )
          .all(startDate, endDate);

        // Fetch Bon de Commandes for Table D (Monthly Sheet)
        const bonDeCommandes = db
          .prepare(
            `SELECT id, date, bcNumber, clientName, totalAmount, status 
           FROM bon_de_commandes 
           WHERE date BETWEEN ? AND ?`,
          )
          .all(startDate, endDate);

        return {
          income,
          expenses,
          factures,
          bonDeCommandes,
        };
      } catch (error) {
        console.error("Export data retrieval error:", error);
        throw error;
      }
    },
  );
}

module.exports = { initDashboardService }; //

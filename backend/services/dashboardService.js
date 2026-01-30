const { ipcMain } = require("electron");
const { DashboardSchema } = require("./schemas");

function initDashboardService(db) {
  ipcMain.handle("db:getDashboardStats", (event, args) => {
    const validation = DashboardSchema.safeParse(args);
    if (!validation.success)
      throw new Error("Invalid date range for dashboard.");

    const { startDate, endDate } = validation.data;
    try {
      const incomeStats = db
        .prepare(
          "SELECT SUM(amount) as total FROM incomes WHERE date BETWEEN ? AND ? AND is_cashed = 1",
        )
        .get(startDate, endDate);
      const expenseStats = db
        .prepare(
          "SELECT SUM(amount) as total FROM expenses WHERE date BETWEEN ? AND ? AND is_cashed = 1",
        )
        .get(startDate, endDate);

      const totalIncome = incomeStats?.total || 0;
      const totalExpense = expenseStats?.total || 0;

      const rawIncome = db
        .prepare(
          "SELECT date, SUM(amount) as val FROM incomes WHERE date BETWEEN ? AND ? AND is_cashed = 1 GROUP BY date",
        )
        .all(startDate, endDate);
      const rawExpense = db
        .prepare(
          "SELECT date, SUM(amount) as val FROM expenses WHERE date BETWEEN ? AND ? AND is_cashed = 1 GROUP BY date",
        )
        .all(startDate, endDate);

      const dateMap = {};
      rawIncome.forEach((d) => {
        dateMap[d.date] = { date: d.date, income: d.val || 0, expense: 0 };
      });
      rawExpense.forEach((d) => {
        if (!dateMap[d.date])
          dateMap[d.date] = { date: d.date, income: 0, expense: d.val || 0 };
        else dateMap[d.date].expense = d.val || 0;
      });

      return {
        summary: {
          income: totalIncome,
          expense: totalExpense,
          profit: totalIncome - totalExpense,
        },
        chartData: Object.values(dateMap).sort((a, b) =>
          a.date.localeCompare(b.date),
        ),
      };
    } catch (error) {
      throw error;
    }
  });
}

module.exports = { initDashboardService };

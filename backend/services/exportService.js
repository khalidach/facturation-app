const ExcelJS = require("exceljs");
const { app, dialog } = require("electron");
const path = require("path");
const fs = require("fs");

// Importing existing services to fetch data
const financeService = require("./financeService");
const factureService = require("./factureService");
const bdcService = require("./bonDeCommandeService");

const exportFinancialAnalysis = async (year, months) => {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "Facturation App";
  workbook.lastModifiedBy = "Facturation App";
  workbook.created = new Date();

  const summaryData = {
    totalIncome: 0,
    totalExpenses: 0,
    totalFacturesCount: 0,
    totalBDCCount: 0,
    paidFactures: 0,
    unpaidFactures: 0,
    paidBDC: 0,
    unpaidBDC: 0,
    monthlyBreakdown: [],
  };

  const monthNames = [
    "Janvier",
    "Février",
    "Mars",
    "Avril",
    "Mai",
    "Juin",
    "Juillet",
    "Août",
    "Septembre",
    "Octobre",
    "Novembre",
    "Décembre",
  ];

  for (const monthIndex of months) {
    const sheetName = monthNames[monthIndex];
    const sheet = workbook.addWorksheet(sheetName);

    // Fetch data for the specific month/year
    // Note: Assumes your services have methods to filter by date
    const startDate = new Date(year, monthIndex, 1).toISOString();
    const endDate = new Date(year, monthIndex + 1, 0, 23, 59, 59).toISOString();

    const incomes = await financeService.getIncomesByDateRange(
      startDate,
      endDate,
    );
    const expenses = await financeService.getExpensesByDateRange(
      startDate,
      endDate,
    );
    const factures = await factureService.getFacturesByDateRange(
      startDate,
      endDate,
    );
    const bdcs = await bdcService.getBDCsByDateRange(startDate, endDate);

    let currentLine = 1;

    // Helper to style titles
    const addTableTitle = (title, row) => {
      const cell = sheet.getCell(`A${row}`);
      cell.value = title;
      cell.font = { bold: true, size: 14 };
      return row + 1;
    };

    // A. Income Table
    currentLine = addTableTitle("TABLEAU DES REVENUS (INCOME)", currentLine);
    const incomeTable = [
      [
        "ID",
        "Date",
        "Nom Client",
        "Description",
        "Catégorie",
        "Mode de Paiement",
        "Détails Paiement",
      ],
    ];
    let monthIncomeTotal = 0;
    incomes.forEach((item) => {
      let details = "";
      if (item.modePaiement === "Chèque") details = item.numCheque || "";
      else if (["Virement", "Versement"].includes(item.modePaiement))
        details = item.reference || "";

      incomeTable.push([
        item.id,
        new Date(item.date).toLocaleDateString(),
        item.clientNom,
        item.description,
        item.categorie,
        item.modePaiement,
        details,
      ]);
      monthIncomeTotal += item.montant;
    });
    sheet.addRows(incomeTable);
    currentLine += incomeTable.length + 2;

    // B. Expense Table
    currentLine = addTableTitle("TABLEAU DES DÉPENSES (EXPENSES)", currentLine);
    const expenseTable = [
      [
        "ID",
        "Date",
        "Nom Fournisseur",
        "Description",
        "Catégorie",
        "Mode de Paiement",
        "Détails Paiement",
      ],
    ];
    let monthExpenseTotal = 0;
    expenses.forEach((item) => {
      let details = "";
      if (item.modePaiement === "Chèque") details = item.numCheque || "";
      else if (["Virement", "Versement"].includes(item.modePaiement))
        details = item.reference || "";

      expenseTable.push([
        item.id,
        new Date(item.date).toLocaleDateString(),
        item.clientNom,
        item.description,
        item.categorie,
        item.modePaiement,
        details,
      ]);
      monthExpenseTotal += item.montant;
    });
    sheet.addRows(expenseTable);
    currentLine += expenseTable.length + 2;

    // C. Facture Table
    currentLine = addTableTitle("TABLEAU DES FACTURES", currentLine);
    const factureTable = [
      ["ID", "Date", "N° Facture", "Client", "Montant Total", "Statut"],
    ];
    factures.forEach((f) => {
      factureTable.push([
        f.id,
        new Date(f.date).toLocaleDateString(),
        f.numero,
        f.clientNom,
        f.total,
        f.statut,
      ]);
      if (f.statut === "Payée") summaryData.paidFactures++;
      else summaryData.unpaidFactures++;
    });
    sheet.addRows(factureTable);
    currentLine += factureTable.length + 2;

    // D. Bon de Commande Table
    currentLine = addTableTitle("TABLEAU DES BONS DE COMMANDE", currentLine);
    const bdcTable = [
      ["ID", "Date", "N° BDC", "Client", "Montant Total", "Statut"],
    ];
    bdcs.forEach((b) => {
      bdcTable.push([
        b.id,
        new Date(b.date).toLocaleDateString(),
        b.numero,
        b.clientNom,
        b.total,
        b.statut,
      ]);
      if (b.statut === "Payée") summaryData.paidBDC++;
      else summaryData.unpaidBDC++;
    });
    sheet.addRows(bdcTable);

    // Update Global Aggregates
    summaryData.totalIncome += monthIncomeTotal;
    summaryData.totalExpenses += monthExpenseTotal;
    summaryData.totalFacturesCount += factures.length;
    summaryData.totalBDCCount += bdcs.length;

    summaryData.monthlyBreakdown.push({
      month: sheetName,
      income: monthIncomeTotal,
      expenses: monthExpenseTotal,
      benefit: monthIncomeTotal - monthExpenseTotal,
      factures: factures.length,
      bdcs: bdcs.length,
    });

    // Auto-fit columns (basic logic)
    sheet.columns.forEach((column) => {
      column.width = 20;
    });
  }

  // FINAL SUMMARY SHEET
  const summarySheet = workbook.addWorksheet("Résumé Global");

  summarySheet.addRow(["RÉSUMÉ ANALYTIQUE FINANCIER"]).font = {
    bold: true,
    size: 16,
  };
  summarySheet.addRow([]);

  summarySheet.addRow(["MÉTRIQUES GLOBALES"]).font = { bold: true };
  summarySheet.addRow(["Total Factures", summaryData.totalFacturesCount]);
  summarySheet.addRow(["Total Bons de Commande", summaryData.totalBDCCount]);
  summarySheet.addRow(["Total Revenus", summaryData.totalIncome]);
  summarySheet.addRow(["Total Dépenses", summaryData.totalExpenses]);
  summarySheet.addRow(["Factures Payées", summaryData.paidFactures]);
  summarySheet.addRow(["Factures Impayées", summaryData.unpaidFactures]);
  summarySheet.addRow(["BDC Payées", summaryData.paidBDC]);
  summarySheet.addRow(["BDC Impayées", summaryData.unpaidBDC]);
  summarySheet.addRow([]);

  summarySheet.addRow(["RÉSULTATS FINANCIERS"]).font = { bold: true };
  summarySheet.addRow(["Total Revenus", summaryData.totalIncome]);
  summarySheet.addRow(["Total Dépenses", summaryData.totalExpenses]);
  const benefitRow = summarySheet.addRow([
    "Bénéfice Net",
    summaryData.totalIncome - summaryData.totalExpenses,
  ]);
  benefitRow.getCell(2).font = {
    bold: true,
    color: {
      argb:
        summaryData.totalIncome - summaryData.totalExpenses >= 0
          ? "FF006400"
          : "FFFF0000",
    },
  };
  summarySheet.addRow([]);

  summarySheet.addRow(["DÉTAILS PAR MOIS"]).font = { bold: true };
  const breakDownHeader = [
    "Mois",
    "Revenus",
    "Dépenses",
    "Bénéfice",
    "N° Factures",
    "N° BDC",
  ];
  summarySheet.addRow(breakDownHeader).font = { bold: true };
  summaryData.monthlyBreakdown.forEach((m) => {
    summarySheet.addRow([
      m.month,
      m.income,
      m.expenses,
      m.benefit,
      m.factures,
      m.bdcs,
    ]);
  });

  summarySheet.columns.forEach((column) => {
    column.width = 22;
  });

  // Save Dialog
  const { filePath } = await dialog.showSaveDialog({
    title: "Exporter l'analyse financière",
    defaultPath: path.join(
      app.getPath("downloads"),
      `Analyse_Financiere_${year}.xlsx`,
    ),
    filters: [{ name: "Excel Files", extensions: ["xlsx"] }],
  });

  if (filePath) {
    await workbook.xlsx.writeFile(filePath);
    return { success: true, filePath };
  }
  return { success: false };
};

module.exports = { exportFinancialAnalysis };

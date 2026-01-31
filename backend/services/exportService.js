const ExcelJS = require("exceljs");
const { app, dialog } = require("electron");
const path = require("path");

/**
 * Fix: Added 'db' parameter and implemented direct database queries
 */
const exportFinancialAnalysis = async (db, year, months) => {
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

    // Date formatting for SQL comparison (YYYY-MM-DD)
    const startDate = new Date(year, monthIndex, 1).toISOString().split("T")[0];
    const endDate = new Date(year, monthIndex + 1, 0)
      .toISOString()
      .split("T")[0];

    // --- Direct Database Queries ---

    // 1. Fetch Incomes
    const incomes = db
      .prepare(
        `
      SELECT amount as montant, date, contact_person as clientNom, description, 
             category as categorie, payment_method as modePaiement, 
             cheque_number as numCheque, transaction_ref as reference 
      FROM incomes 
      WHERE date BETWEEN ? AND ?
    `,
      )
      .all(startDate, endDate);

    // 2. Fetch Expenses
    const expenses = db
      .prepare(
        `
      SELECT amount as montant, date, contact_person as clientNom, description, 
             category as categorie, payment_method as modePaiement, 
             cheque_number as numCheque, transaction_ref as reference 
      FROM expenses 
      WHERE date BETWEEN ? AND ?
    `,
      )
      .all(startDate, endDate);

    // 3. Fetch Factures with Payment Status
    const factures = db
      .prepare(
        `
      SELECT id, date, facture_number as numero, clientName as clientNom, total,
             (SELECT COALESCE(SUM(amount), 0) FROM incomes WHERE facture_id = factures.id) as totalPaid
      FROM factures 
      WHERE date BETWEEN ? AND ?
    `,
      )
      .all(startDate, endDate);

    // 4. Fetch BDCs with Payment Status
    const bdcs = db
      .prepare(
        `
      SELECT id, date, order_number as numero, supplierName as clientNom, total,
             (SELECT COALESCE(SUM(amount), 0) FROM expenses WHERE bon_de_commande_id = bon_de_commande.id) as totalPaid
      FROM bon_de_commande 
      WHERE date BETWEEN ? AND ?
    `,
      )
      .all(startDate, endDate);

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
        "Date",
        "Client",
        "Description",
        "Catégorie",
        "Mode",
        "Détails",
        "Montant",
      ],
    ];
    let monthIncomeTotal = 0;
    incomes.forEach((item) => {
      const details = item.numCheque || item.reference || "";
      incomeTable.push([
        new Date(item.date).toLocaleDateString(),
        item.clientNom,
        item.description,
        item.categorie,
        item.modePaiement,
        details,
        item.montant,
      ]);
      monthIncomeTotal += item.montant;
    });
    sheet.addRows(incomeTable);
    currentLine += incomeTable.length + 2;

    // B. Expense Table
    currentLine = addTableTitle("TABLEAU DES DÉPENSES (EXPENSES)", currentLine);
    const expenseTable = [
      [
        "Date",
        "Fournisseur",
        "Description",
        "Catégorie",
        "Mode",
        "Détails",
        "Montant",
      ],
    ];
    let monthExpenseTotal = 0;
    expenses.forEach((item) => {
      const details = item.numCheque || item.reference || "";
      expenseTable.push([
        new Date(item.date).toLocaleDateString(),
        item.clientNom,
        item.description,
        item.categorie,
        item.modePaiement,
        details,
        item.montant,
      ]);
      monthExpenseTotal += item.montant;
    });
    sheet.addRows(expenseTable);
    currentLine += expenseTable.length + 2;

    // C. Facture Table
    currentLine = addTableTitle("TABLEAU DES FACTURES", currentLine);
    const factureTable = [
      ["Date", "N° Facture", "Client", "Montant Total", "Statut"],
    ];
    factures.forEach((f) => {
      const status = f.totalPaid >= f.total ? "Payée" : "Impayée";
      factureTable.push([
        new Date(f.date).toLocaleDateString(),
        f.numero,
        f.clientNom,
        f.total,
        status,
      ]);
      if (status === "Payée") summaryData.paidFactures++;
      else summaryData.unpaidFactures++;
    });
    sheet.addRows(factureTable);
    currentLine += factureTable.length + 2;

    // D. Bon de Commande Table
    currentLine = addTableTitle("TABLEAU DES BONS DE COMMANDE", currentLine);
    const bdcTable = [
      ["Date", "N° BDC", "Fournisseur", "Montant Total", "Statut"],
    ];
    bdcs.forEach((b) => {
      const status = b.totalPaid >= b.total ? "Payée" : "Impayée";
      bdcTable.push([
        new Date(b.date).toLocaleDateString(),
        b.numero,
        b.clientNom,
        b.total,
        status,
      ]);
      if (status === "Payée") summaryData.paidBDC++;
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
  const benefit = summaryData.totalIncome - summaryData.totalExpenses;
  summarySheet.addRow(["Total Revenus", summaryData.totalIncome]);
  summarySheet.addRow(["Total Dépenses", summaryData.totalExpenses]);
  const benefitRow = summarySheet.addRow(["Bénéfice Net", benefit]);
  benefitRow.getCell(2).font = {
    bold: true,
    color: { argb: benefit >= 0 ? "FF006400" : "FFFF0000" },
  };
  summarySheet.addRow([]);

  summarySheet.addRow(["DÉTAILS PAR MOIS"]).font = { bold: true };
  summarySheet.addRow([
    "Mois",
    "Revenus",
    "Dépenses",
    "Bénéfice",
    "N° Factures",
    "N° BDC",
  ]).font = { bold: true };
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

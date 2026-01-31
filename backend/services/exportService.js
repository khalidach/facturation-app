const ExcelJS = require("exceljs");
const { app, dialog } = require("electron");
const path = require("path");

/**
 * Export Service with merged headers, table borders, colored table headers,
 * and support for a custom date range.
 */
const exportFinancialAnalysis = async (db, range) => {
  const { start, end } = range;
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

  // Global styles
  const borderStyle = {
    top: { style: "thin" },
    left: { style: "thin" },
    bottom: { style: "thin" },
    right: { style: "thin" },
  };

  const headerFill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FF4F81BD" }, // Professional Blue
  };

  const headerFont = {
    bold: true,
    color: { argb: "FFFFFFFF" }, // White text
  };

  // Generate the list of month/year periods for the range
  const periods = [];
  let currentYear = start.year;
  let currentMonth = start.month;

  while (
    currentYear < end.year ||
    (currentYear === end.year && currentMonth <= end.month)
  ) {
    periods.push({ month: currentMonth, year: currentYear });
    currentMonth++;
    if (currentMonth > 11) {
      currentMonth = 0;
      currentYear++;
    }
  }

  for (const period of periods) {
    const sheetName = `${monthNames[period.month]} ${period.year}`;
    const sheet = workbook.addWorksheet(sheetName);

    const startDate = new Date(period.year, period.month, 1)
      .toISOString()
      .split("T")[0];
    const endDate = new Date(period.year, period.month + 1, 0)
      .toISOString()
      .split("T")[0];

    // --- Database Queries ---
    const incomes = db
      .prepare(
        `SELECT amount as montant, date, contact_person as clientNom, description, 
                category as categorie, payment_method as modePaiement, 
                cheque_number as numCheque, transaction_ref as reference 
         FROM incomes WHERE date BETWEEN ? AND ?`,
      )
      .all(startDate, endDate);

    const expenses = db
      .prepare(
        `SELECT amount as montant, date, contact_person as clientNom, description, 
                category as categorie, payment_method as modePaiement, 
                cheque_number as numCheque, transaction_ref as reference 
         FROM expenses WHERE date BETWEEN ? AND ?`,
      )
      .all(startDate, endDate);

    const factures = db
      .prepare(
        `SELECT id, date, facture_number as numero, clientName as clientNom, total,
                (SELECT COALESCE(SUM(amount), 0) FROM incomes WHERE facture_id = factures.id) as totalPaid
         FROM factures WHERE date BETWEEN ? AND ?`,
      )
      .all(startDate, endDate);

    const bdcs = db
      .prepare(
        `SELECT id, date, order_number as numero, supplierName as clientNom, total,
                (SELECT COALESCE(SUM(amount), 0) FROM expenses WHERE bon_de_commande_id = bon_de_commande.id) as totalPaid
         FROM bon_de_commande WHERE date BETWEEN ? AND ?`,
      )
      .all(startDate, endDate);

    let currentLine = 1;

    // Helper to merge header and apply title style
    const addTableTitle = (title, row, lastColLetter) => {
      sheet.mergeCells(`A${row}:${lastColLetter}${row}`);
      const cell = sheet.getCell(`A${row}`);
      cell.value = title;
      cell.font = { bold: true, size: 14 };
      cell.alignment = { horizontal: "center" };
      cell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FFE0E0E0" },
      };
      return row + 1;
    };

    // Helper to apply borders and header background
    const styleTableRange = (startRow, endRow, lastColIndex) => {
      for (let r = startRow; r <= endRow; r++) {
        const row = sheet.getRow(r);
        for (let c = 1; c <= lastColIndex; c++) {
          const cell = row.getCell(c);
          cell.border = borderStyle;
          // Apply header style to the first row of the table
          if (r === startRow) {
            cell.fill = headerFill;
            cell.font = headerFont;
          }
        }
      }
    };

    // A. Income Table (7 columns)
    currentLine = addTableTitle(
      "TABLEAU DES REVENUS (INCOME)",
      currentLine,
      "G",
    );
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
      incomeTable.push([
        new Date(item.date).toLocaleDateString(),
        item.clientNom,
        item.description,
        item.categorie,
        item.modePaiement,
        item.numCheque || item.reference || "",
        item.montant,
      ]);
      monthIncomeTotal += item.montant;
    });
    sheet.addRows(incomeTable);
    styleTableRange(currentLine, currentLine + incomeTable.length - 1, 7);
    currentLine += incomeTable.length + 2;

    // B. Expense Table (7 columns)
    currentLine = addTableTitle(
      "TABLEAU DES DÉPENSES (EXPENSES)",
      currentLine,
      "G",
    );
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
      expenseTable.push([
        new Date(item.date).toLocaleDateString(),
        item.clientNom,
        item.description,
        item.categorie,
        item.modePaiement,
        item.numCheque || item.reference || "",
        item.montant,
      ]);
      monthExpenseTotal += item.montant;
    });
    sheet.addRows(expenseTable);
    styleTableRange(currentLine, currentLine + expenseTable.length - 1, 7);
    currentLine += expenseTable.length + 2;

    // C. Facture Table (5 columns)
    currentLine = addTableTitle("TABLEAU DES FACTURES", currentLine, "E");
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
    styleTableRange(currentLine, currentLine + factureTable.length - 1, 5);
    currentLine += factureTable.length + 2;

    // D. Bon de Commande Table (5 columns)
    currentLine = addTableTitle(
      "TABLEAU DES BONS DE COMMANDE",
      currentLine,
      "E",
    );
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
    styleTableRange(currentLine, currentLine + bdcTable.length - 1, 5);

    // Update Totals
    summaryData.totalIncome += monthIncomeTotal;
    summaryData.totalExpenses += monthExpenseTotal;
    summaryData.totalFacturesCount += factures.length;
    summaryData.totalBDCCount += bdcs.length;
    summaryData.monthlyBreakdown.push({
      month: `${monthNames[period.month]} ${period.year}`,
      income: monthIncomeTotal,
      expenses: monthExpenseTotal,
      benefit: monthIncomeTotal - monthExpenseTotal,
      factures: factures.length,
      bdcs: bdcs.length,
    });

    sheet.columns.forEach((column) => (column.width = 20));
  }

  // FINAL SUMMARY SHEET
  const summarySheet = workbook.addWorksheet("Résumé Global");
  let sRow = 1;

  const addSummarySection = (
    title,
    data,
    lastColLetter,
    colCount,
    isTable = false,
  ) => {
    summarySheet.mergeCells(`A${sRow}:${lastColLetter}${sRow}`);
    const cell = summarySheet.getCell(`A${sRow}`);
    cell.value = title;
    cell.font = { bold: true, size: 14 };
    cell.alignment = { horizontal: "center" };
    cell.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FFE0E0E0" },
    };
    sRow++;

    const startDataRow = sRow;
    data.forEach((rowData, idx) => {
      summarySheet.addRow(rowData);
      const row = summarySheet.getRow(sRow);
      for (let c = 1; c <= colCount; c++) {
        const dataCell = row.getCell(c);
        dataCell.border = borderStyle;
        if (isTable && idx === 0) {
          dataCell.fill = headerFill;
          dataCell.font = headerFont;
        }
      }
      sRow++;
    });
    sRow += 2;
  };

  addSummarySection(
    "MÉTRIQUES GLOBALES",
    [
      ["Métrique", "Valeur"],
      ["Total Factures", summaryData.totalFacturesCount],
      ["Total Bons de Commande", summaryData.totalBDCCount],
      ["Factures Payées", summaryData.paidFactures],
      ["Factures Impayées", summaryData.unpaidFactures],
      ["BDC Payées", summaryData.paidBDC],
      ["BDC Impayées", summaryData.unpaidBDC],
    ],
    "B",
    2,
    true,
  );

  const benefit = summaryData.totalIncome - summaryData.totalExpenses;
  addSummarySection(
    "RÉSULTATS FINANCIERS",
    [
      ["Type", "Montant"],
      ["Total Revenus", summaryData.totalIncome],
      ["Total Dépenses", summaryData.totalExpenses],
      ["Bénéfice Net", benefit],
    ],
    "B",
    2,
    true,
  );

  // Apply color to the net benefit result
  const benefitResultCell = summarySheet.getRow(sRow - 3).getCell(2);
  benefitResultCell.font = {
    bold: true,
    color: { argb: benefit >= 0 ? "FF006400" : "FFFF0000" },
  };

  const monthlyHeaders = [
    "Mois",
    "Revenus",
    "Dépenses",
    "Bénéfice",
    "N° Factures",
    "N° BDC",
  ];
  const monthlyData = summaryData.monthlyBreakdown.map((m) => [
    m.month,
    m.income,
    m.expenses,
    m.benefit,
    m.factures,
    m.bdcs,
  ]);
  addSummarySection(
    "DÉTAILS PAR MOIS",
    [monthlyHeaders, ...monthlyData],
    "F",
    6,
    true,
  );

  summarySheet.columns.forEach((column) => (column.width = 22));

  const { filePath } = await dialog.showSaveDialog({
    title: "Exporter l'analyse financière",
    defaultPath: path.join(
      app.getPath("downloads"),
      `Analyse_Financiere_${start.year}_${end.year}.xlsx`,
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

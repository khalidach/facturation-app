const { initFinanceService } = require("./financeService");
const { initFactureService } = require("./factureService");
const { initDashboardService } = require("./dashboardService");
const { initContactService } = require("./contactService");
const { initTreasuryService } = require("./treasuryService");
const { initBonDeCommandeService } = require("./bonDeCommandeService");
const { initSettingsService } = require("./settingsService");
const { initPdfService } = require("./pdfService");
const { initLicenseService } = require("./licenseService");

function initServices(db) {
  initDashboardService(db);
  initFinanceService(db);
  initFactureService(db);
  initBonDeCommandeService(db);
  initTreasuryService(db);
  initContactService(db);
  initSettingsService(db);
  initPdfService();
  initLicenseService();
}

module.exports = { initServices };

const { ipcMain, BrowserWindow, dialog, app } = require("electron");
const path = require("path");
const fs = require("fs");
const sanitizeHtml = require("sanitize-html");

function initPdfService() {
  ipcMain.handle("pdf:generate", async (event, { htmlContent, fileName }) => {
    const cleanHtml = sanitizeHtml(htmlContent, {
      allowedTags: sanitizeHtml.defaults.allowedTags.concat([
        "img",
        "style",
        "div",
        "span",
        "table",
        "thead",
        "tbody",
        "tr",
        "th",
        "td",
        "br",
        "hr",
        "section",
        "header",
        "footer",
        "html",
        "head",
        "body",
        "meta",
      ]),
      // FIX 1: Remove the XSS terminal warning
      allowVulnerableTags: true,
      allowedAttributes: {
        ...sanitizeHtml.defaults.allowedAttributes,
        "*": ["style", "class", "id", "src", "charset", "name", "content"],
      },
      // FIX 2: Allow ALL CSS properties so Tailwind and Custom CSS work
      allowedStyles: {
        "*": {
          "*": [/./],
        },
      },
    });

    const printWindow = new BrowserWindow({
      show: false,
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true,
      },
    });

    try {
      // Use the cleaned HTML directly as it now contains the <head> and <style> from frontend
      await printWindow.loadURL(
        `data:text/html;charset=utf-8,${encodeURIComponent(cleanHtml)}`,
      );

      const pdfBuffer = await printWindow.webContents.printToPDF({
        margins: { marginType: "none" },
        pageSize: "A4",
        printBackground: true, // Crucial for background colors/Tailwind
        landscape: false,
      });

      const { filePath } = await dialog.showSaveDialog({
        title: "Enregistrer le document PDF",
        defaultPath: path.join(app.getPath("downloads"), fileName),
        filters: [{ name: "Adobe PDF", extensions: ["pdf"] }],
      });

      if (filePath) {
        fs.writeFileSync(filePath, pdfBuffer);
        return { success: true, filePath };
      }
      return { success: false, reason: "Cancelled" };
    } catch (error) {
      console.error("PDF Generation Error:", error);
      return { success: false, error: error.message };
    } finally {
      printWindow.close();
    }
  });
}

module.exports = { initPdfService };

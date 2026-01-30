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
      ]),
      allowedAttributes: {
        ...sanitizeHtml.defaults.allowedAttributes,
        "*": ["style", "class", "id"],
      },
      allowedStyles: {
        "*": {
          color: [/^#(0x)?[0-9a-f]+$/i, /^rgb\(/, /^rgba\(/, /^[a-z]+$/],
          "background-color": [
            /^#(0x)?[0-9a-f]+$/i,
            /^rgb\(/,
            /^rgba\(/,
            /^[a-z]+$/,
          ],
          "text-align": [/^left$/, /^right$/, /^center$/, /^justify$/],
          "font-size": [/^\d+(?:px|em|pt|rem|%)$/],
          "font-weight": [/^\d+$/, /^bold$/, /^normal$/],
          margin: [/^.*$/],
          padding: [/^.*$/],
          border: [/^.*$/],
          width: [/^.*$/],
          height: [/^.*$/],
          display: [/^.*$/],
          flex: [/^.*$/],
          "flex-direction": [/^.*$/],
          "justify-content": [/^.*$/],
          "align-items": [/^.*$/],
          gap: [/^.*$/],
        },
      },
    });

    const printWindow = new BrowserWindow({
      show: false,
      webPreferences: { nodeIntegration: false, contextIsolation: true },
    });
    const styledHtml = `<!DOCTYPE html><html><head><meta charset="UTF-8"><style>@page { size: A4; margin: 0; } body { margin: 0; padding: 0; -webkit-print-color-adjust: exact; font-family: 'Inter', sans-serif; } * { box-sizing: border-box; } @media print { body { background-color: white !important; } .no-print { display: none !important; } }</style></head><body>${cleanHtml}</body></html>`;

    try {
      await printWindow.loadURL(
        `data:text/html;charset=utf-8,${encodeURIComponent(styledHtml)}`,
      );
      const pdfBuffer = await printWindow.webContents.printToPDF({
        margins: { marginType: "none" },
        pageSize: "A4",
        printBackground: true,
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
    } finally {
      printWindow.close();
    }
  });
}

module.exports = { initPdfService };

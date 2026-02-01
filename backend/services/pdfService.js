const { ipcMain, BrowserWindow, dialog, app } = require("electron");
const path = require("path");
const fs = require("fs");

let sharedPrintWindow = null;

function getWorkerWindow() {
  if (sharedPrintWindow && !sharedPrintWindow.isDestroyed()) {
    return sharedPrintWindow;
  }

  sharedPrintWindow = new BrowserWindow({
    show: false,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: true,
    },
  });

  return sharedPrintWindow;
}

function initPdfService() {
  ipcMain.handle("pdf:generate", async (event, { htmlContent, fileName }) => {
    const printWindow = getWorkerWindow();

    try {
      // FIX: Wrap the content in a full HTML structure and inject Tailwind CSS via CDN
      // This ensures all your classes (bg-gray-50, text-blue-600, etc.) work in the PDF.
      const fullHtml = `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="UTF-8">
            <script src="https://cdn.tailwindcss.com"></script>
            <style>
              /* Ensure background colors print correctly */
              body { 
                -webkit-print-color-adjust: exact; 
                print-color-adjust: exact; 
              }
              /* Optional: Add Inter font if needed */
              @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
              body { font-family: 'Inter', sans-serif; }
            </style>
          </head>
          <body>
            ${htmlContent}
          </body>
        </html>
      `;

      await printWindow.loadURL(
        `data:text/html;charset=utf-8,${encodeURIComponent(fullHtml)}`,
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
        await printWindow.loadURL("about:blank");
        return { success: true, filePath };
      }

      await printWindow.loadURL("about:blank");
      return { success: false, reason: "Cancelled" };
    } catch (error) {
      console.error("PDF Generation Error:", error);
      if (sharedPrintWindow && !sharedPrintWindow.isDestroyed()) {
        try {
          await sharedPrintWindow.loadURL("about:blank");
        } catch (e) {}
      }
      return { success: false, error: error.message };
    }
  });

  app.on("before-quit", () => {
    if (sharedPrintWindow && !sharedPrintWindow.isDestroyed()) {
      sharedPrintWindow.destroy();
    }
  });
}

module.exports = { initPdfService };

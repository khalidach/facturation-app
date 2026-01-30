const { ipcMain, BrowserWindow, dialog, app } = require("electron");
const path = require("path");
const fs = require("fs");
const sanitizeHtml = require("sanitize-html");

// Persistent reference to the worker window to avoid re-initialization overhead
let sharedPrintWindow = null;

/**
 * Retrieves or creates the hidden BrowserWindow used for PDF generation.
 * This ensures only one background process is dedicated to rendering,
 * significantly lowering memory consumption during high-volume tasks.
 */
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
    // Sanitize HTML to prevent XSS while allowing styles for Tailwind and CSS
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
      allowVulnerableTags: true,
      allowedAttributes: {
        ...sanitizeHtml.defaults.allowedAttributes,
        "*": ["style", "class", "id", "src", "charset", "name", "content"],
      },
      allowedStyles: {
        "*": {
          "*": [/./],
        },
      },
    });

    const printWindow = getWorkerWindow();

    try {
      // Load sanitized content directly into the reusable window
      await printWindow.loadURL(
        `data:text/html;charset=utf-8,${encodeURIComponent(cleanHtml)}`,
      );

      const pdfBuffer = await printWindow.webContents.printToPDF({
        margins: { marginType: "none" },
        pageSize: "A4",
        printBackground: true, // Required for Tailwind colors and backgrounds
        landscape: false,
      });

      const { filePath } = await dialog.showSaveDialog({
        title: "Enregistrer le document PDF",
        defaultPath: path.join(app.getPath("downloads"), fileName),
        filters: [{ name: "Adobe PDF", extensions: ["pdf"] }],
      });

      if (filePath) {
        fs.writeFileSync(filePath, pdfBuffer);
        // Clear window content after use to free memory in the renderer process
        await printWindow.loadURL("about:blank");
        return { success: true, filePath };
      }

      await printWindow.loadURL("about:blank");
      return { success: false, reason: "Cancelled" };
    } catch (error) {
      console.error("PDF Generation Error:", error);
      // Ensure the window is cleared even if an error occurs
      if (sharedPrintWindow && !sharedPrintWindow.isDestroyed()) {
        try {
          await sharedPrintWindow.loadURL("about:blank");
        } catch (e) {}
      }
      return { success: false, error: error.message };
    }
  });

  // Ensure the worker window is properly closed when the application quits
  app.on("before-quit", () => {
    if (sharedPrintWindow && !sharedPrintWindow.isDestroyed()) {
      sharedPrintWindow.destroy();
    }
  });
}

module.exports = { initPdfService };

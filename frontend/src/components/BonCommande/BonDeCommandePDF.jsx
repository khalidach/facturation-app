import React from "react";
import { useQuery } from "@tanstack/react-query";
import { numberToWordsFr } from "../../services/numberToWords.js";

// Fonction d'aide pour extraire les styles du thème personnalisé
const getStyle = (styles, path) => {
  try {
    return path.split(".").reduce((acc, key) => acc && acc[key], styles) || {};
  } catch (e) {
    return {};
  }
};

export default function BonDeCommandePDF({ order, themeStyles }) {
  const { data: settings } = useQuery({
    queryKey: ["settings"],
    queryFn: window.electronAPI.getSettings,
  });

  const { data: savedTheme } = useQuery({
    queryKey: ["theme", "bon_de_commande"],
    queryFn: () => window.electronAPI.getTheme("bon_de_commande"),
    enabled: !themeStyles,
  });

  const styles = themeStyles || savedTheme?.styles || {};
  const headerStyles = styles.header || {};
  const bodyStyles = styles.body || {};
  const footerStyles = styles.footer || {};

  const totalInWords = numberToWordsFr(order.total);
  const parsedItems =
    typeof order.items === "string"
      ? JSON.parse(order.items)
      : order.items || [];

  return (
    <div
      className="pdf-container"
      style={{
        width: "210mm",
        minHeight: "297mm",
        backgroundColor: "white",
        padding: "40px",
        display: "flex",
        flexDirection: "column",
        fontFamily: "'Inter', sans-serif",
        ...getStyle(styles, "container"),
      }}
    >
      {/* Styles critiques pour le rendu PDF natif */}
      <style>
        {`
         @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;900&display=swap');
          
          @media print {
            body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
            @page { margin: 0; size: A4; }
          }
          .pdf-container { box-sizing: border-box; line-height: 1.5; }
          .pdf-container * { box-sizing: border-box; }
          
          /* Layout */
          .flex { display: flex; }
          .flex-col { flex-direction: column; }
          .flex-grow { flex-grow: 1; }
          .justify-between { justify-content: space-between; }
          .justify-center { justify-content: center; }
          .justify-end { justify-content: flex-end; }
          .items-center { align-items: center; }
          .items-start { align-items: flex-start; }
          .items-end { align-items: flex-end; }
          .flex-wrap { flex-wrap: wrap; }
          
          /* Spacing */
          .mb-1 { margin-bottom: 4px; }
          .mb-2 { margin-bottom: 8px; }
          .mb-4 { margin-bottom: 16px; }
          .mb-8 { margin-bottom: 32px; }
          .mt-1 { margin-top: 4px; }
          .mt-2 { margin-top: 8px; }
          .mt-4 { margin-top: 16px; }
          .p-2 { padding: 8px; }
          .p-4 { padding: 16px; }
          .pt-2 { padding-top: 8px; }
          .gap-2 { gap: 8px; }
          .gap-4 { gap: 16px; }
          
          /* Typography */
          .text-right { text-align: right; }
          .text-center { text-align: center; }
          .uppercase { text-transform: uppercase; }
          .capitalize { text-transform: capitalize; }
          .font-bold { font-weight: 700; }
          .font-medium { font-weight: 500; }
          .text-sm { font-size: 14px; }
          .text-xs { font-size: 12px; }
          .italic { font-style: italic; }
          
          /* Colors */
          .bg-white { background-color: #ffffff; }
          .bg-gray-50 { background-color: #f9fafb; }
          .bg-gray-100 { background-color: #f3f4f6; }
          .bg-emerald-50 { background-color: #ecfdf5; } /* Couleur spécifique BDC */
          .text-gray-400 { color: #9ca3af; }
          .text-gray-500 { color: #6b7280; }
          .text-gray-600 { color: #4b5563; }
          .text-gray-700 { color: #374151; }
          .text-gray-900 { color: #111827; }
          .text-emerald-600 { color: #059669; }
          .text-emerald-700 { color: #047857; }
          
          /* Borders */
          .border { border-width: 1px; border-style: solid; }
          .border-t { border-top-width: 1px; border-style: solid; }
          .border-b { border-bottom-width: 1px; border-style: solid; }
          .border-gray-200 { border-color: #e5e7eb; }
          .rounded-md { border-radius: 0.375rem; }
          .rounded-lg { border-radius: 0.5rem; }

          /* Tables */
          table { width: 100%; border-collapse: collapse; margin-top: 20px; }
          th, td { padding: 12px 8px; border-bottom: 1px solid #e5e7eb; }
          tr { page-break-inside: avoid; }
          
          ${headerStyles.customCss || ""}
          ${bodyStyles.customCss || ""}
          ${footerStyles.customCss || ""}
        `}
      </style>

      <div className="flex-grow">
        {/* HEADER */}
        <header style={getStyle(styles, "header.container")}>
          <div
            className="flex justify-between items-center"
            style={{ marginBottom: "32px" }}
          >
            <div className="flex items-center gap-4">
              {settings?.logo && (
                <img
                  src={settings.logo}
                  alt="Logo"
                  style={{
                    maxHeight: "80px",
                    width: "auto",
                    ...getStyle(styles, "header.logo"),
                  }}
                />
              )}
              <h1
                style={{
                  fontSize: "18px",
                  fontWeight: "bold",
                  ...getStyle(styles, "header.agencyName"),
                }}
              >
                {settings?.agencyName || "Votre Agence"}
              </h1>
            </div>
            <div className="flex flex-col items-end text-right">
              <h2
                className="uppercase"
                style={{
                  fontSize: "22px",
                  fontWeight: "900",
                  color: "#10b981",
                  ...getStyle(styles, "header.factureType"),
                }}
              >
                Bon de Commande
              </h2>
            </div>
          </div>
        </header>

        {/* BODY */}
        <main style={getStyle(styles, "body.container")}>
          <div
            style={{
              marginBottom: "30px",
              padding: "15px",
              borderLeft: "4px solid #10b981",
              backgroundColor: "#f0fdf4",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              ...getStyle(styles, "body.clientInfo.container"),
            }}
          >
            <div>
              <p
                style={{
                  fontSize: "10px",
                  fontWeight: "bold",
                  color: "#059669",
                  textTransform: "uppercase",
                  marginBottom: "4px",
                }}
              >
                Fournisseur :
              </p>
              <p
                style={{
                  fontWeight: "bold",
                  fontSize: "14px",
                  ...getStyle(styles, "body.clientInfo.clientName"),
                }}
              >
                {order.supplierName}
              </p>
              <p
                style={{
                  color: "#4b5563",
                  ...getStyle(styles, "body.clientInfo.clientAddress"),
                }}
              >
                {order.supplierAddress}
              </p>
              {order.supplierICE && (
                <p
                  style={{
                    fontSize: "11px",
                    marginTop: "4px",
                    ...getStyle(styles, "body.clientInfo.clientICE"),
                  }}
                >
                  ICE : {order.supplierICE}
                </p>
              )}
            </div>

            <div style={{ textAlign: "right" }}>
              <p
                style={{
                  fontWeight: "bold",
                  fontSize: "14px",
                  color: "#065f46",
                  ...getStyle(styles, "header.factureNumber"),
                }}
              >
                N° : {order.order_number}
              </p>
              <p
                style={{
                  fontSize: "12px",
                  color: "#374151",
                  ...getStyle(styles, "header.date"),
                }}
              >
                Date : {new Date(order.date).toLocaleDateString("fr-FR")}
              </p>
            </div>
          </div>

          <table
            style={{
              ...getStyle(styles, "body.table.container"),
              minHeight: "300px",
            }}
          >
            <thead>
              <tr
                style={{
                  backgroundColor: "#f9fafb",
                  ...getStyle(styles, "body.table.row"),
                }}
              >
                <th
                  style={{
                    textAlign: "left",
                    ...getStyle(styles, "body.table.header"),
                  }}
                >
                  DÉSIGNATION
                </th>
                <th
                  style={{
                    textAlign: "center",
                    width: "60px",
                    ...getStyle(styles, "body.table.header"),
                  }}
                >
                  QTÉ
                </th>
                <th
                  style={{
                    textAlign: "right",
                    ...getStyle(styles, "body.table.header"),
                  }}
                >
                  P.U (HT)
                </th>
                <th
                  style={{
                    textAlign: "right",
                    ...getStyle(styles, "body.table.header"),
                  }}
                >
                  TOTAL (HT)
                </th>
              </tr>
            </thead>
            <tbody>
              {parsedItems.map((item, index) => (
                <tr key={index} style={getStyle(styles, "body.table.row")}>
                  <td
                    style={{
                      whiteSpace: "pre-wrap",
                      ...getStyle(styles, "body.table.cell"),
                    }}
                  >
                    {item.description}
                  </td>
                  <td
                    style={{
                      textAlign: "center",
                      ...getStyle(styles, "body.table.cell"),
                    }}
                  >
                    {item.quantity}
                  </td>
                  <td
                    style={{
                      textAlign: "right",
                      ...getStyle(styles, "body.table.cell"),
                    }}
                  >
                    {Number(item.prixUnitaire).toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                    })}
                  </td>
                  <td
                    style={{
                      textAlign: "right",
                      fontWeight: "bold",
                      ...getStyle(styles, "body.table.cell"),
                    }}
                  >
                    {(item.quantity * item.prixUnitaire).toLocaleString(
                      undefined,
                      { minimumFractionDigits: 2 },
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* TOTALS - Largeur augmentée pour éviter le wrapping */}
          <div
            style={{
              marginTop: "30px",
              display: "flex",
              justifyContent: "flex-end",
              ...getStyle(styles, "body.totals.container"),
            }}
          >
            <div
              style={{
                width: "350px",
                padding: "15px",
                backgroundColor: "#f9fafb",
                borderRadius: "8px",
              }}
            >
              <div
                className="flex justify-between"
                style={{
                  fontWeight: "900",
                  fontSize: "14px",
                  ...getStyle(styles, "body.totals.totalRow"),
                }}
              >
                <span style={getStyle(styles, "body.totals.label")}>
                  TOTAL COMMANDE :
                </span>
                <span style={getStyle(styles, "body.totals.value")}>
                  {Number(order.total).toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                  })}{" "}
                  MAD
                </span>
              </div>
            </div>
          </div>

          {/* TOTAL EN LETTRES */}
          <div
            style={{
              marginTop: "40px",
              fontStyle: "italic",
              ...getStyle(styles, "body.totalInWords.container"),
            }}
          >
            <p
              style={{
                fontSize: "11px",
                ...getStyle(styles, "body.totalInWords.label"),
              }}
            >
              Arrêté la présente facture à la somme de :
            </p>
            <p
              style={{
                fontWeight: "bold",
                textTransform: "capitalize",
                ...getStyle(styles, "body.totalInWords.value"),
              }}
            >
              {totalInWords}
            </p>
          </div>

          {order.notes && (
            <div
              style={{
                marginTop: "30px",
                padding: "10px",
                border: "1px dashed #e5e7eb",
                borderRadius: "4px",
              }}
            >
              <p
                style={{
                  fontSize: "10px",
                  fontWeight: "bold",
                  color: "#9ca3af",
                  textTransform: "uppercase",
                }}
              >
                Notes / Instructions :
              </p>
              <p style={{ fontSize: "11px", color: "#4b5563" }}>
                {order.notes}
              </p>
            </div>
          )}
        </main>
      </div>

      {/* FOOTER SYNCHRONISÉ AVEC FACTURATION */}
      <footer
        style={{
          marginTop: "40px",
          borderTop: "1px solid #e5e7eb",
          paddingTop: "20px",
          ...getStyle(styles, "footer.container"),
        }}
      >
        <div
          className="flex justify-center"
          style={{
            fontSize: "9px",
            color: "#6b7280",
            textAlign: "center",
            lineHeight: "1.4",
            flexWrap: "wrap",
            gap: "8px",
          }}
        >
          {[
            `Sté. ${settings?.agencyName || ""} ${settings?.typeSociete || ""}`,
            settings?.capital && `Capital : ${settings.capital} Dhs`,
            settings?.address && `Siège : ${settings.address}`,
            settings?.phone && `Tél : ${settings.phone}`,
            settings?.email && `Email : ${settings.email}`,
            settings?.ice && `ICE : ${settings.ice}`,
            settings?.if && `IF : ${settings.if}`,
            settings?.rc && `RC : ${settings.rc}`,
            settings?.bankName &&
              settings?.rib &&
              `RIB (${settings.bankName}) : ${settings.rib}`,
          ]
            .filter(Boolean)
            .map((item, idx) => (
              <p key={idx} style={getStyle(styles, "footer.text")}>
                {idx > 0 ? `| ${item}` : item}
              </p>
            ))}
        </div>
      </footer>
    </div>
  );
}

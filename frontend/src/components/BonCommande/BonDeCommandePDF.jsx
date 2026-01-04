import React from "react";
import { useQuery } from "@tanstack/react-query";

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
    queryKey: ["theme"],
    queryFn: window.electronAPI.getTheme,
    enabled: !themeStyles,
  });

  const styles = themeStyles || savedTheme?.styles || {};
  const headerStyles = styles.header || {};
  const bodyStyles = styles.body || {};
  const footerStyles = styles.footer || {};

  const parsedItems =
    typeof order.items === "string"
      ? JSON.parse(order.items)
      : order.items || [];

  return (
    <div
      className="bg-white p-10 font-sans text-xs flex flex-col"
      style={{
        width: "210mm",
        minHeight: "297mm",
        ...getStyle(styles, "container"),
      }}
    >
      <style>
        {headerStyles.customCss}
        {bodyStyles.customCss}
        {footerStyles.customCss}
      </style>
      <div className="flex-grow">
        <header
          className="header-container"
          style={getStyle(styles, "header.container")}
        >
          <div className="flex justify-between items-center mb-8">
            <div className="flex items-center gap-4">
              {settings?.logo && (
                <img
                  src={settings.logo}
                  alt="Logo"
                  style={getStyle(styles, "header.logo")}
                />
              )}
              <h1 style={getStyle(styles, "header.agencyName")}>
                {settings?.agencyName || "Votre Agence"}
              </h1>
            </div>
            <div className="flex flex-col items-end flex-1 text-right">
              <h2
                className="uppercase"
                style={getStyle(styles, "header.factureType")}
              >
                Bon de Commande
              </h2>
              <p
                className="mt-1"
                style={getStyle(styles, "header.factureNumber")}
              >
                N° : {order.order_number}
              </p>
              <p style={getStyle(styles, "header.date")}>
                Date : {new Date(order.date).toLocaleDateString("fr-FR")}
              </p>
            </div>
          </div>
        </header>

        <main
          className="body-container"
          style={getStyle(styles, "body.container")}
        >
          <div style={getStyle(styles, "body.clientInfo.container")}>
            <p className="font-bold text-gray-500 uppercase text-[10px] mb-1">
              Fournisseur :
            </p>
            <p style={getStyle(styles, "body.clientInfo.clientName")}>
              {order.supplierName}
            </p>
            <p style={getStyle(styles, "body.clientInfo.clientAddress")}>
              {order.supplierAddress}
            </p>
            {order.supplierICE && (
              <p style={getStyle(styles, "body.clientInfo.clientICE")}>
                ICE : {order.supplierICE}
              </p>
            )}
          </div>

          <table
            className="table-container"
            style={{
              ...getStyle(styles, "body.table.container"),
              minHeight: "300px",
            }}
          >
            <thead>
              <tr style={getStyle(styles, "body.table.row")}>
                <th style={getStyle(styles, "body.table.header")}>
                  DÉSIGNATION
                </th>
                <th
                  style={{
                    ...getStyle(styles, "body.table.header"),
                    textAlign: "center",
                  }}
                >
                  QTÉ
                </th>
                <th
                  style={{
                    ...getStyle(styles, "body.table.header"),
                    textAlign: "right",
                  }}
                >
                  P.U (HT)
                </th>
                <th
                  style={{
                    ...getStyle(styles, "body.table.header"),
                    textAlign: "right",
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
                      ...getStyle(styles, "body.table.cell"),
                      whiteSpace: "pre-wrap",
                    }}
                  >
                    {item.description}
                  </td>
                  <td
                    style={{
                      ...getStyle(styles, "body.table.cell"),
                      textAlign: "center",
                    }}
                  >
                    {item.quantity}
                  </td>
                  <td
                    style={{
                      ...getStyle(styles, "body.table.cell"),
                      textAlign: "right",
                    }}
                  >
                    {Number(item.prixUnitaire).toLocaleString()}
                  </td>
                  <td
                    style={{
                      ...getStyle(styles, "body.table.cell"),
                      textAlign: "right",
                      fontWeight: "bold",
                    }}
                  >
                    {(item.quantity * item.prixUnitaire).toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <div style={getStyle(styles, "body.totals.container")}>
            <div style={getStyle(styles, "body.totals.totalRow")}>
              <span style={getStyle(styles, "body.totals.label")}>
                TOTAL COMMANDE
              </span>
              <span style={getStyle(styles, "body.totals.value")}>
                {Number(order.total).toLocaleString()} MAD
              </span>
            </div>
          </div>
        </main>
      </div>

      <footer
        className="footer-container"
        style={getStyle(styles, "footer.container")}
      >
        <div className="flex gap-2 justify-center flex-wrap">
          {[
            `Sté. ${settings?.agencyName || ""}`,
            settings?.address,
            settings?.phone,
            settings?.ice,
          ]
            .filter(Boolean)
            .map((item, idx) => (
              <p key={idx} style={getStyle(styles, "footer.text")}>
                {idx > 0 ? `- ${item}` : item}
              </p>
            ))}
        </div>
      </footer>
    </div>
  );
}

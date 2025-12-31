import React from "react";
import { useQuery } from "@tanstack/react-query";
import { numberToWordsFr } from "../../services/numberToWords.js";

// Fonction d'aide pour obtenir l'objet de style imbriqué
const getStyle = (styles, path) => {
  try {
    return path.split(".").reduce((acc, key) => acc && acc[key], styles) || {};
  } catch (e) {
    return {};
  }
};

export default function FacturePDF({ facture, themeStyles }) {
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

  const totalInWords = numberToWordsFr(facture.total);

  // Conversion de showMargin en booléen strict
  const showMargin = !!(facture.showMargin ?? true);

  const parsedItems =
    typeof facture.items === "string"
      ? JSON.parse(facture.items)
      : facture.items;

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
            {/* Côté gauche : Logo et Nom de l'agence */}
            <div className="flex items-center gap-4">
              {settings?.logo && (
                <img
                  src={settings.logo}
                  alt="Logo de l'agence"
                  className="block"
                  style={getStyle(styles, "header.logo")}
                />
              )}
              <h1 style={getStyle(styles, "header.agencyName")}>
                {settings?.agencyName || "Votre Agence"}
              </h1>
            </div>
            {/* Côté droit : Détails du document */}
            <div className="flex flex-col items-end justify-center flex-1 text-right">
              <h2
                className="uppercase"
                style={getStyle(styles, "header.factureType")}
              >
                {facture.type === "devis" ? "Devis" : "Facture"}
              </h2>
              <p
                className="mt-1"
                style={getStyle(styles, "header.factureNumber")}
              >
                N° : {facture.facture_number}
              </p>
              <p style={getStyle(styles, "header.date")}>
                Date : {new Date(facture.date).toLocaleDateString("fr-FR")}
              </p>
              {settings?.ice && (
                <p style={getStyle(styles, "header.ice")}>
                  ICE : {settings.ice}
                </p>
              )}
            </div>
          </div>
        </header>

        <main
          className="body-container"
          style={getStyle(styles, "body.container")}
        >
          {facture?.clientName && (
            <div style={getStyle(styles, "body.clientInfo.container")}>
              <p style={getStyle(styles, "body.clientInfo.clientName")}>
                {facture.clientName}
              </p>
              <p style={getStyle(styles, "body.clientInfo.clientAddress")}>
                {facture.clientAddress}
              </p>
              {facture.clientICE && (
                <p style={getStyle(styles, "body.clientInfo.clientICE")}>
                  ICE : {facture.clientICE}
                </p>
              )}
            </div>
          )}
          <table
            className="table-container"
            style={{
              ...getStyle(styles, "body.table.container"),
              minHeight: "300px",
            }}
          >
            <thead>
              <tr style={getStyle(styles, "body.table.row")}>
                <th
                  style={{
                    ...getStyle(styles, "body.table.header"),
                    verticalAlign: "middle",
                  }}
                >
                  DÉSIGNATION
                </th>
                <th
                  style={{
                    ...getStyle(styles, "body.table.header"),
                    textAlign: "center",
                    verticalAlign: "middle",
                  }}
                >
                  QTÉ
                </th>
                <th
                  style={{
                    ...getStyle(styles, "body.table.header"),
                    textAlign: "right",
                    verticalAlign: "middle",
                  }}
                >
                  PRIX UNITAIRE
                </th>
                {showMargin === true && (
                  <th
                    style={{
                      ...getStyle(styles, "body.table.header"),
                      textAlign: "right",
                      verticalAlign: "middle",
                    }}
                  >
                    FRAIS SERV. UNITAIRE
                  </th>
                )}
                <th
                  style={{
                    ...getStyle(styles, "body.table.header"),
                    textAlign: "right",
                    verticalAlign: "middle",
                  }}
                >
                  MONTANT TOTAL
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
                      wordBreak: "break-word",
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
                    {(Number(item.prixUnitaire) || 0).toLocaleString(
                      undefined,
                      { minimumFractionDigits: 2, maximumFractionDigits: 2 }
                    )}
                  </td>
                  {showMargin === true && (
                    <td
                      style={{
                        ...getStyle(styles, "body.table.cell"),
                        textAlign: "right",
                      }}
                    >
                      {(Number(item.fraisServiceUnitaire) || 0).toLocaleString(
                        undefined,
                        { minimumFractionDigits: 2, maximumFractionDigits: 2 }
                      )}
                    </td>
                  )}
                  <td
                    style={{
                      ...getStyle(styles, "body.table.cell"),
                      textAlign: "right",
                      fontWeight: "bold",
                    }}
                  >
                    {(Number(item.total) || 0).toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div style={getStyle(styles, "body.totals.container")}>
            {showMargin === true && (
              <>
                <div style={getStyle(styles, "body.totals.row")}>
                  <span style={getStyle(styles, "body.totals.label")}>
                    Prix Total H. Frais de SCE
                  </span>
                  <span style={getStyle(styles, "body.totals.value")}>
                    {Number(facture.prixTotalHorsFrais).toLocaleString(
                      undefined,
                      { minimumFractionDigits: 2, maximumFractionDigits: 2 }
                    )}{" "}
                    MAD
                  </span>
                </div>
                <div style={getStyle(styles, "body.totals.row")}>
                  <span style={getStyle(styles, "body.totals.label")}>
                    Frais de Service Hors TVA
                  </span>
                  <span style={getStyle(styles, "body.totals.value")}>
                    {Number(facture.totalFraisServiceHT).toLocaleString(
                      undefined,
                      { minimumFractionDigits: 2, maximumFractionDigits: 2 }
                    )}{" "}
                    MAD
                  </span>
                </div>
                <div style={getStyle(styles, "body.totals.row")}>
                  <span style={getStyle(styles, "body.totals.label")}>
                    TVA 20%
                  </span>
                  <span style={getStyle(styles, "body.totals.value")}>
                    {Number(facture.tva).toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}{" "}
                    MAD
                  </span>
                </div>
              </>
            )}
            <div style={getStyle(styles, "body.totals.totalRow")}>
              <span style={getStyle(styles, "body.totals.label")}>
                Total {facture.type === "devis" ? "Devis" : "Facture"}
              </span>
              <span style={getStyle(styles, "body.totals.value")}>
                {Number(facture.total).toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}{" "}
                MAD
              </span>
            </div>
          </div>
          <div style={getStyle(styles, "body.totalInWords.container")}>
            <p style={getStyle(styles, "body.totalInWords.label")}>
              Arrêté la présente facture à la somme de :
            </p>
            <p style={getStyle(styles, "body.totalInWords.value")}>
              {totalInWords}
            </p>
          </div>
        </main>
      </div>
      <footer
        className="footer-container"
        style={getStyle(styles, "footer.container")}
      >
        <div className="flex gap-2 justify-center flex-wrap">
          {[
            `Sté. ${settings?.agencyName || ""} ${settings?.typeSociete || ""}`,
            settings?.capital && `Capital : ${settings.capital} Dhs`,
            settings?.address && `Siège Social : ${settings.address}`,
            settings?.phone && `Fixe : ${settings.phone}`,
            settings?.email && `Email : ${settings.email}`,
            settings?.ice && `ICE : ${settings.ice}`,
            settings?.if && `IF : ${settings.if}`,
            settings?.rc && `RC : ${settings.rc}`,
            settings?.patente && `Patente : ${settings.patente}`,
            settings?.cnss && `CNSS : ${settings.cnss}`,
            settings?.bankName &&
              settings?.rib &&
              `Banque ${settings.bankName} : ${settings.rib}`,
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

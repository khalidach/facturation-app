import React from "react";
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Image,
  Font,
} from "@react-pdf/renderer";
import { numberToWordsFr } from "@/services/numberToWords.js";

// Although not strictly necessary, registering a font can improve compatibility.
// If you have a specific .ttf font file, you can register it here.
// For now, we rely on the standard PDF fonts.

const FactureReactPDF = ({ facture, settings, themeStyles }) => {
  const styles = StyleSheet.create(
    // Deep merge theme styles with default structure
    // This is a simplified version; a recursive merge would be more robust
    {
      page: {
        fontFamily: "Helvetica",
        fontSize: 10,
        padding: 40,
        backgroundColor: "#ffffff",
        color: "#000",
      },
      flexRow: {
        display: "flex",
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
      },
      header: {
        ...themeStyles.header?.container,
        marginBottom: 20,
      },
      headerLogoContainer: {
        flexDirection: "row",
        alignItems: "center",
      },
      logo: {
        width: themeStyles.header?.logo?.width
          ? parseInt(themeStyles.header.logo.width)
          : 80,
        height: "auto",
        marginRight: 10,
      },
      agencyName: { ...themeStyles.header?.agencyName },
      headerInfo: {
        textAlign: "right",
      },
      factureType: {
        ...themeStyles.header?.factureType,
        textTransform: "uppercase",
      },
      factureNumber: { ...themeStyles.header?.factureNumber },
      date: { ...themeStyles.header?.date },
      ice: { ...themeStyles.header?.ice },
      clientInfo: { ...themeStyles.body?.clientInfo?.container, padding: 10 },
      clientName: { ...themeStyles.body?.clientInfo?.clientName },
      clientAddress: { ...themeStyles.body?.clientInfo?.clientAddress },
      clientICE: { ...themeStyles.body?.clientInfo?.clientICE },
      table: {
        display: "table",
        width: "auto",
        ...themeStyles.body?.table?.container,
      },
      tableRow: {
        margin: "auto",
        flexDirection: "row",
      },
      tableHeader: {
        ...themeStyles.body?.table?.header,
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
      },
      tableCell: {
        ...themeStyles.body?.table?.cell,
        display: "flex",
        justifyContent: "center",
      },
      colDesignation: { width: "35%" },
      colQty: { width: "10%", textAlign: "center" },
      colPrice: { width: "20%", textAlign: "right" },
      colService: { width: "15%", textAlign: "right" },
      colTotal: { width: "20%", textAlign: "right" },
      totalsContainer: {
        ...themeStyles.body?.totals?.container,
        marginTop: 20,
        marginLeft: "auto",
        width: "50%",
      },
      totalsRow: {
        ...themeStyles.body?.totals?.row,
        flexDirection: "row",
        justifyContent: "space-between",
        padding: 5,
      },
      totalRow: {
        ...themeStyles.body?.totals?.totalRow,
        flexDirection: "row",
        justifyContent: "space-between",
        padding: 5,
        marginTop: 5,
      },
      totalLabel: { ...themeStyles.body?.totals?.label },
      totalValue: { ...themeStyles.body?.totals?.value },
      totalInWords: {
        ...themeStyles.body?.totalInWords?.container,
        marginTop: 20,
      },
      footer: {
        ...themeStyles.footer?.container,
        position: "absolute",
        bottom: 30,
        left: 40,
        right: 40,
        textAlign: "center",
        fontSize: 8,
      },
      footerText: {
        ...themeStyles.footer?.text,
        marginHorizontal: 4,
      },
    }
  );

  const totalInWords = numberToWordsFr(facture.total);
  const showMargin = facture.showMargin ?? true;
  const parsedItems =
    typeof facture.items === "string"
      ? JSON.parse(facture.items)
      : facture.items;

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={[styles.flexRow, styles.header]}>
          <View style={styles.headerLogoContainer}>
            {settings?.logo && (
              <Image style={styles.logo} src={settings.logo} />
            )}
            <Text style={styles.agencyName}>
              {settings?.agencyName || "Your Agency"}
            </Text>
          </View>
          <View style={styles.headerInfo}>
            <Text style={styles.factureType}>{facture.type}</Text>
            <Text style={styles.factureNumber}>
              N°: {facture.facture_number}
            </Text>
            <Text style={styles.date}>
              Date: {new Date(facture.date).toLocaleDateString("en-GB")}
            </Text>
            {settings?.ice && (
              <Text style={styles.ice}>ICE: {settings.ice}</Text>
            )}
          </View>
        </View>

        <View style={styles.clientInfo}>
          <Text style={styles.clientName}>{facture.clientName}</Text>
          <Text style={styles.clientAddress}>{facture.clientAddress}</Text>
          {facture.clientICE && (
            <Text style={styles.clientICE}>ICE: {facture.clientICE}</Text>
          )}
        </View>

        <View style={styles.table}>
          <View style={styles.tableRow} fixed>
            <View style={[styles.tableHeader, styles.colDesignation]}>
              <Text>DESIGNATION</Text>
            </View>
            <View style={[styles.tableHeader, styles.colQty]}>
              <Text>QU</Text>
            </View>
            <View style={[styles.tableHeader, styles.colPrice]}>
              <Text>PRIX UNITAIRE</Text>
            </View>
            {showMargin && (
              <View style={[styles.tableHeader, styles.colService]}>
                <Text>FRAIS. SCE</Text>
              </View>
            )}
            <View style={[styles.tableHeader, styles.colTotal]}>
              <Text>MONTANT TOTAL</Text>
            </View>
          </View>

          {parsedItems.map((item, index) => (
            <View key={index} style={styles.tableRow}>
              <View style={[styles.tableCell, styles.colDesignation]}>
                <Text>{item.description}</Text>
              </View>
              <View style={[styles.tableCell, styles.colQty]}>
                <Text>{item.quantity}</Text>
              </View>
              <View style={[styles.tableCell, styles.colPrice]}>
                <Text>{Number(item.prixUnitaire).toFixed(2)}</Text>
              </View>
              {showMargin && (
                <View style={[styles.tableCell, styles.colService]}>
                  <Text>{Number(item.fraisServiceUnitaire).toFixed(2)}</Text>
                </View>
              )}
              <View style={[styles.tableCell, styles.colTotal]}>
                <Text>{Number(item.total).toFixed(2)}</Text>
              </View>
            </View>
          ))}
        </View>

        <View style={styles.totalsContainer}>
          {showMargin && (
            <>
              <View style={styles.totalsRow}>
                <Text style={styles.totalLabel}>
                  Prix Total H. Frais de SCE
                </Text>
                <Text style={styles.totalValue}>
                  {Number(facture.prixTotalHorsFrais).toFixed(2)} MAD
                </Text>
              </View>
              <View style={styles.totalsRow}>
                <Text style={styles.totalLabel}>Frais de Service Hors TVA</Text>
                <Text style={styles.totalValue}>
                  {Number(facture.totalFraisServiceHT).toFixed(2)} MAD
                </Text>
              </View>
              <View style={styles.totalsRow}>
                <Text style={styles.totalLabel}>TVA 20%</Text>
                <Text style={styles.totalValue}>
                  {Number(facture.tva).toFixed(2)} MAD
                </Text>
              </View>
            </>
          )}
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Total Facture</Text>
            <Text style={styles.totalValue}>
              {Number(facture.total).toFixed(2)} MAD
            </Text>
          </View>
        </View>

        <View style={styles.totalInWords}>
          <Text>Arrêté la présente facture à la somme de :</Text>
          <Text style={{ paddingTop: 5, textTransform: "capitalize" }}>
            {totalInWords}
          </Text>
        </View>

        <View style={styles.footer} fixed>
          <Text>
            {[
              `Sté. ${settings?.agencyName || ""} ${
                settings?.typeSociete || ""
              }`,
              settings?.capital && `Capital: ${settings.capital} Dhs`,
              settings?.address && `Siège Social: ${settings.address}`,
              settings?.phone && `Fix: ${settings.phone}`,
              settings?.email && `Email: ${settings.email}`,
              settings?.ice && `ICE: ${settings.ice}`,
            ]
              .filter(Boolean)
              .join(" - ")}
          </Text>
        </View>
      </Page>
    </Document>
  );
};

export default FactureReactPDF;

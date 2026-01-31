import React, { useState } from "react";
import StyleControls from "./StyleControls";

const getThemeStructure = (type) => ({
  header: {
    label: "En-tête",
    elements: {
      container: "Conteneur Principal",
      logo: "Logo",
      agencyName: "Nom de l'Agence",
      factureType: "Type de Document",
      factureNumber: "Numéro de Document",
      date: "Date",
      ice: "ICE", // Available in Facture, might be hidden in BC but keep for consistency
    },
  },
  body: {
    label: "Corps",
    elements: {
      container: "Conteneur Principal",
      clientInfo_container:
        type === "bon_de_commande"
          ? "Boîte Infos Fournisseur"
          : "Boîte Infos Client",
      clientInfo_clientName:
        type === "bon_de_commande" ? "Nom du Fournisseur" : "Nom du Client",
      clientInfo_clientAddress: "Adresse",
      clientInfo_clientICE: "ICE",
      table_container: "Conteneur Tableau",
      table_header: "En-tête Tableau",
      table_row: "Ligne Tableau",
      table_cell: "Cellule Tableau",
      totals_container: "Conteneur Section Totaux",
      totals_row: "Ligne Totaux",
      totals_totalRow: "Ligne Total Général",
      totals_label: "Libellé Total",
      totals_value: "Valeur Totale",
      totalInWords_container: "Boîte Total en Lettres",
      totalInWords_label: "Libellé 'Arrêté...'",
      totalInWords_value: "Montant en lettres",
    },
  },
  footer: {
    label: "Pied de page",
    elements: {
      container: "Conteneur Principal",
      text: "Infos Entreprise",
    },
  },
});

export default function ThemeEditor({ styles, onStyleChange, type }) {
  const [activeSection, setActiveSection] = useState("header");
  const [activeElement, setActiveElement] = useState("container");

  const themeStructure = getThemeStructure(type);

  const handleElementSelect = (e) => {
    setActiveElement(e.target.value);
  };

  const getElementPath = (elementKey) => {
    if (elementKey.includes("_")) {
      return elementKey.split("_");
    }
    return [elementKey];
  };

  const getStylesForElement = (section, elementKey) => {
    const path = getElementPath(elementKey);
    let currentStyles = styles[section];
    for (const key of path) {
      currentStyles = currentStyles[key];
      if (!currentStyles) return {};
    }
    return currentStyles;
  };

  const handleCustomCssChange = (section, value) => {
    onStyleChange(section, null, "customCss", value);
  };

  return (
    <div className="space-y-6">
      {/* Sélection de Section */}
      <div className="flex space-x-2 border-b">
        {Object.keys(themeStructure).map((key) => (
          <button
            key={key}
            onClick={() => {
              setActiveSection(key);
              setActiveElement("container");
            }}
            className={`px-4 py-2 text-sm font-medium transition-colors ${
              activeSection === key
                ? "border-b-2 border-blue-600 text-blue-600"
                : "text-gray-500 hover:text-gray-800"
            }`}
          >
            {themeStructure[key].label}
          </button>
        ))}
      </div>

      <div className="space-y-4">
        {/* Sélection d'Élément */}
        <div>
          <label
            htmlFor="element-select"
            className="block text-sm font-medium text-gray-700 dark:text-gray-300"
          >
            Sélectionner l'élément à styliser
          </label>
          <select
            id="element-select"
            value={activeElement}
            onChange={handleElementSelect}
            className="mt-1 block w-full input"
          >
            {Object.entries(themeStructure[activeSection].elements).map(
              ([key, label]) => (
                <option key={key} value={key}>
                  {label}
                </option>
              ),
            )}
          </select>
        </div>

        {/* Contrôles de Style */}
        <div className="p-4 border rounded-lg bg-gray-50 dark:bg-gray-700/50">
          <StyleControls
            elementStyles={getStylesForElement(activeSection, activeElement)}
            onStyleChange={(prop, val) =>
              onStyleChange(activeSection, activeElement, prop, val)
            }
          />
        </div>

        {/* CSS Personnalisé */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            CSS personnalisé pour {themeStructure[activeSection].label}
          </label>
          <textarea
            value={styles[activeSection]?.customCss || ""}
            onChange={(e) =>
              handleCustomCssChange(activeSection, e.target.value)
            }
            className="mt-1 block w-full input font-mono text-sm"
            rows={5}
            placeholder={`/* Exemple : */\n.header-container {\n  border-radius: 8px;\n}`}
          />
        </div>
      </div>
    </div>
  );
}

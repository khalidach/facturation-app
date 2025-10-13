import React, { useState } from "react";
import StyleControls from "./StyleControls";

const themeStructure = {
  header: {
    label: "Header",
    elements: {
      container: "Main Container",
      logo: "Logo",
      agencyName: "Agency Name",
      factureType: "Document Type (Facture/Devis)",
      factureNumber: "Document Number",
      date: "Date",
      ice: "ICE",
    },
  },
  body: {
    label: "Body",
    elements: {
      container: "Main Container",
      clientInfo_container: "Client Info Box",
      clientInfo_clientName: "Client Name",
      clientInfo_clientAddress: "Client Address",
      clientInfo_clientICE: "Client ICE",
      table_container: "Table Container",
      table_header: "Table Header",
      table_row: "Table Row",
      table_cell: "Table Cell",
      totals_container: "Totals Section Container",
      totals_row: "Totals Row",
      totals_totalRow: "Grand Total Row",
      totals_label: "Total Label (e.g., 'TVA')",
      totals_value: "Total Value (e.g., '120.00 MAD')",
      totalInWords_container: "Total in Words Box",
      totalInWords_label: "'Arrêté la présente facture...'",
      totalInWords_value: "The amount in words",
    },
  },
  footer: {
    label: "Footer",
    elements: {
      container: "Main Container",
      text: "Company Info Text",
    },
  },
};

export default function ThemeEditor({ styles, onStyleChange }) {
  const [activeSection, setActiveSection] = useState("header");
  const [activeElement, setActiveElement] = useState("container");

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

  const handleStyleChangeForElement = (property, value) => {
    const path = getElementPath(activeElement);
    let section = styles[activeSection];
    for (let i = 0; i < path.length - 1; i++) {
      section = section[path[i]];
    }
    onStyleChange(activeSection, path.join("."), property, value);
  };

  const handleCustomCssChange = (section, value) => {
    onStyleChange(section, null, "customCss", value);
  };

  return (
    <div className="space-y-6">
      {/* Section Selection */}
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
        {/* Element Selection */}
        <div>
          <label
            htmlFor="element-select"
            className="block text-sm font-medium text-gray-700 dark:text-gray-300"
          >
            Select Element to Style
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
              )
            )}
          </select>
        </div>

        {/* Style Controls */}
        <div className="p-4 border rounded-lg bg-gray-50 dark:bg-gray-700/50">
          <StyleControls
            elementStyles={getStylesForElement(activeSection, activeElement)}
            onStyleChange={(prop, val) =>
              onStyleChange(activeSection, activeElement, prop, val)
            }
          />
        </div>

        {/* Custom CSS */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Custom CSS for {themeStructure[activeSection].label}
          </label>
          <textarea
            value={styles[activeSection]?.customCss || ""}
            onChange={(e) =>
              handleCustomCssChange(activeSection, e.target.value)
            }
            className="mt-1 block w-full input font-mono text-sm"
            rows={5}
            placeholder={`/* Example: */\n.header-container {\n  border-radius: 8px;\n}`}
          />
        </div>
      </div>
    </div>
  );
}

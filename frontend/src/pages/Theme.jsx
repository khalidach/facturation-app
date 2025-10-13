import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-hot-toast";
import { Save, Palette } from "lucide-react";
import FacturePDF from "@/components/facturation/FacturePDF.jsx";
import ThemeEditor from "@/components/theme/ThemeEditor.jsx";

// API helper
const handleApiResponse = async (response) => {
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(
      errorData.error || `Request failed: ${response.statusText}`
    );
  }
  return response.json();
};

const api = {
  getTheme: () =>
    fetch("http://localhost:3001/api/theme").then(handleApiResponse),
  updateTheme: (data) =>
    fetch("http://localhost:3001/api/theme", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    }).then(handleApiResponse),
};

// Default styles structure
const initialStyles = {
  header: {
    container: {
      backgroundColor: "#FFFFFF",
      padding: "40px",
      borderBottom: "1px solid #EEE",
    },
    logo: { width: "80px", height: "auto" },
    agencyName: { fontSize: "20px", fontWeight: "bold" },
    factureType: { fontSize: "28px", fontWeight: "bold", color: "#374151" },
    factureNumber: { fontSize: "14px" },
    date: { fontSize: "14px" },
    ice: { fontSize: "14px" },
    customCss: "",
  },
  body: {
    container: { paddingTop: "40px", paddingBottom: "40px" },
    clientInfo: {
      container: {
        marginTop: "32px",
        borderTop: "1px solid #DDD",
        borderBottom: "1px solid #DDD",
        paddingTop: "16px",
        paddingBottom: "16px",
        marginBottom: "24px",
      },
      clientName: { fontSize: "18px", fontWeight: "bold" },
      clientAddress: {},
      clientICE: { fontWeight: "bold" },
    },
    table: {
      container: {
        width: "100%",
        fontSize: "12px",
        borderCollapse: "collapse",
      },
      header: {
        backgroundColor: "#F3F4F6",
        fontWeight: "semibold",
        padding: "8px",
        textAlign: "left",
        border: "1px solid #DDD",
      },
      row: {},
      cell: { padding: "8px", border: "1px solid #DDD" },
    },
    totals: {
      container: {
        width: "50%",
        marginLeft: "auto",
        marginTop: "20px",
        fontSize: "12px",
      },
      row: { display: "flex", justifyContent: "space-between", padding: "8px" },
      totalRow: {
        display: "flex",
        justifyContent: "space-between",
        padding: "8px",
        fontWeight: "bold",
        fontSize: "14px",
        backgroundColor: "#F3F4F6",
        marginTop: "4px",
        borderRadius: "4px",
      },
      label: { color: "#4B5563" },
      value: { fontWeight: "semibold", color: "#111827" },
    },
    totalInWords: {
      container: { marginTop: "32px" },
      label: {},
      value: { fontWeight: "bold", textTransform: "capitalize" },
    },
    customCss: "",
  },
  footer: {
    container: {
      borderTop: "1px solid #EEE",
      paddingTop: "20px",
      marginTop: "auto",
    },
    text: { fontSize: "10px", marginRight: "8px" },
    customCss: "",
  },
};

// A sample facture for previewing the theme
const sampleFacture = {
  type: "facture",
  facture_number: "2024-001",
  date: new Date().toISOString().split("T")[0],
  clientName: "Client Exemplaire SARL",
  clientAddress: "123 Rue de l'Innovation, 75001 Paris",
  clientICE: "001234567890123",
  items: JSON.stringify([
    {
      description: "Développement de site web e-commerce",
      quantity: 1,
      prixUnitaire: 2500,
      fraisServiceUnitaire: 500,
      total: 3000,
    },
    {
      description: "Hébergement et maintenance (Annuel)",
      quantity: 1,
      prixUnitaire: 450,
      fraisServiceUnitaire: 50,
      total: 500,
    },
  ]),
  prixTotalHorsFrais: 2950,
  totalFraisServiceHT: 458.33,
  tva: 91.67,
  total: 3500,
  showMargin: true,
};

export default function Theme() {
  const queryClient = useQueryClient();
  const [styles, setStyles] = useState(initialStyles);

  const { data: themeData, isLoading } = useQuery({
    queryKey: ["theme"],
    queryFn: api.getTheme,
  });

  useEffect(() => {
    if (themeData && themeData.styles) {
      // Deep merge saved styles with initial styles to ensure all keys exist
      const deepMerge = (target, source) => {
        const output = { ...target };
        if (
          target &&
          typeof target === "object" &&
          source &&
          typeof source === "object"
        ) {
          Object.keys(source).forEach((key) => {
            if (
              source[key] &&
              typeof source[key] === "object" &&
              key in target
            ) {
              output[key] = deepMerge(target[key], source[key]);
            } else {
              output[key] = source[key];
            }
          });
        }
        return output;
      };
      setStyles(deepMerge(initialStyles, themeData.styles));
    }
  }, [themeData]);

  const { mutate: updateTheme, isPending } = useMutation({
    mutationFn: (newStyles) => api.updateTheme({ styles: newStyles }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["theme"] });
      toast.success("Theme saved successfully!");
    },
    onError: (error) => {
      toast.error(error.message || "Failed to save theme.");
    },
  });

  const handleStyleChange = (section, element, property, value) => {
    setStyles((prevStyles) => {
      const newStyles = JSON.parse(JSON.stringify(prevStyles));

      if (element) {
        const path = element.split("_");
        let target = newStyles[section];

        // Traverse to the parent of the target element
        for (let i = 0; i < path.length - 1; i++) {
          if (!target[path[i]]) target[path[i]] = {}; // Create nested objects if they don't exist
          target = target[path[i]];
        }

        const finalKey = path[path.length - 1];

        // Ensure the final element object exists
        if (!target[finalKey]) {
          target[finalKey] = {};
        }

        // Set the property
        target[finalKey][property] = value;
      } else {
        // This is for properties on the section itself, like customCss
        newStyles[section][property] = value;
      }

      return newStyles;
    });
  };

  const handleSave = () => {
    updateTheme(styles);
  };

  if (isLoading) {
    return <div>Loading Theme...</div>;
  }

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Left Panel: Editor */}
      <aside className="w-1/3 bg-white dark:bg-gray-800 p-6 overflow-y-auto shadow-lg">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center">
            <Palette className="w-8 h-8 mr-3 text-blue-600" />
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              Theme Editor
            </h1>
          </div>
          <button
            onClick={handleSave}
            disabled={isPending}
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 shadow-sm disabled:bg-gray-400"
          >
            <Save className="w-5 h-5 mr-2" />
            {isPending ? "Saving..." : "Save"}
          </button>
        </div>

        <ThemeEditor styles={styles} onStyleChange={handleStyleChange} />
      </aside>

      {/* Right Panel: Live Preview */}
      <main className="flex-1 bg-gray-200 dark:bg-gray-900 p-8 overflow-y-auto">
        <div className="w-[210mm] min-h-[297mm] mx-auto shadow-2xl">
          <FacturePDF facture={sampleFacture} themeStyles={styles} />
        </div>
      </main>
    </div>
  );
}

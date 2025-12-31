import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-hot-toast";
import { Save, Palette, RefreshCw } from "lucide-react";
import FacturePDF from "../components/facturation/FacturePDF.jsx";
import ThemeEditor from "../components/theme/ThemeEditor.jsx";

// Structure des styles par défaut
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

// Un exemple de facture pour prévisualiser le thème
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
    queryFn: window.electronAPI.getTheme,
  });

  useEffect(() => {
    if (themeData && themeData.styles) {
      // Fusion profonde des styles enregistrés avec les styles initiaux
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
    mutationFn: (newStyles) =>
      window.electronAPI.updateTheme({ styles: newStyles }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["theme"] });
      toast.success("Thème enregistré avec succès !");
    },
    onError: (error) => {
      toast.error(error.message || "Échec de l'enregistrement du thème.");
    },
  });

  const handleStyleChange = (section, element, property, value) => {
    setStyles((prevStyles) => {
      const newStyles = JSON.parse(JSON.stringify(prevStyles));

      if (element) {
        const path = element.split("_");
        let target = newStyles[section];

        // Parcourir jusqu'au parent de l'élément cible
        for (let i = 0; i < path.length - 1; i++) {
          if (!target[path[i]]) target[path[i]] = {};
          target = target[path[i]];
        }

        const finalKey = path[path.length - 1];

        if (!target[finalKey]) {
          target[finalKey] = {};
        }

        target[finalKey][property] = value;
      } else {
        newStyles[section][property] = value;
      }

      return newStyles;
    });
  };

  const handleSave = () => {
    updateTheme(styles);
  };

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center bg-gray-100 dark:bg-gray-900">
        <div className="flex flex-col items-center gap-4">
          <RefreshCw className="h-10 w-10 animate-spin text-blue-600" />
          <p className="font-medium text-gray-500 italic">
            Chargement de l'éditeur...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full overflow-hidden">
      {/* Panneau gauche : Éditeur */}
      <aside className="w-1/3 bg-white dark:bg-gray-800 p-6 overflow-y-auto shadow-lg">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center">
            <Palette className="w-8 h-8 mr-3 text-blue-600" />
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              Éditeur de Thème
            </h1>
          </div>
          <button
            onClick={handleSave}
            disabled={isPending}
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 shadow-sm disabled:bg-gray-400 transition-colors"
          >
            <Save className="w-5 h-5 mr-2" />
            {isPending ? "Enregistrement..." : "Enregistrer"}
          </button>
        </div>

        <ThemeEditor styles={styles} onStyleChange={handleStyleChange} />
      </aside>

      {/* Panneau droit : Prévisualisation en direct */}
      <main className="flex-1 bg-gray-200 dark:bg-gray-900 p-8 overflow-y-auto">
        <div className="w-[210mm] min-h-[297mm] mx-auto shadow-2xl">
          <FacturePDF facture={sampleFacture} themeStyles={styles} />
        </div>
      </main>
    </div>
  );
}

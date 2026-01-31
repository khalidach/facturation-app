import React, { useState, useEffect } from "react";
import Modal from "../Modal";
import {
  X,
  Calendar,
  CheckCircle2,
  FileSpreadsheet,
  AlertCircle,
  CheckSquare,
  Square,
} from "lucide-react";

const ExportAnalysisModal = ({ isOpen, onClose, onExport }) => {
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth() + 1; // 1-12

  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [selectedMonths, setSelectedMonths] = useState([currentMonth]);
  const [isExporting, setIsExporting] = useState(false);
  const [exportStep, setExportStep] = useState("selection"); // 'selection' | 'success'

  const months = [
    { id: 1, name: "Janvier" },
    { id: 2, name: "Février" },
    { id: 3, name: "Mars" },
    { id: 4, name: "Avril" },
    { id: 5, name: "Mai" },
    { id: 6, name: "Juin" },
    { id: 7, name: "Juillet" },
    { id: 8, name: "Août" },
    { id: 9, name: "Septembre" },
    { id: 10, name: "Octobre" },
    { id: 11, name: "Novembre" },
    { id: 12, name: "Décembre" },
  ];

  useEffect(() => {
    if (isOpen) {
      setExportStep("selection");
      setSelectedYear(currentYear);
      setSelectedMonths([currentMonth]);
    }
  }, [isOpen, currentYear, currentMonth]);

  const toggleMonth = (monthId) => {
    if (selectedYear === currentYear && monthId > currentMonth) return;

    setSelectedMonths((prev) =>
      prev.includes(monthId)
        ? prev.filter((m) => m !== monthId)
        : [...prev, monthId].sort((a, b) => a - b),
    );
  };

  const handleSelectAll = () => {
    if (selectedYear === currentYear) {
      // Select only months up to current month for the current year
      const availableMonths = months
        .filter((m) => m.id <= currentMonth)
        .map((m) => m.id);
      setSelectedMonths(availableMonths);
    } else {
      // Select all 12 months for past years
      setSelectedMonths(months.map((m) => m.id));
    }
  };

  const handleClearAll = () => {
    setSelectedMonths([]);
  };

  const handleYearChange = (year) => {
    const newYear = parseInt(year);
    setSelectedYear(newYear);
    if (newYear === currentYear) {
      setSelectedMonths((prev) => prev.filter((m) => m <= currentMonth));
    }
  };

  const handleExport = async () => {
    if (selectedMonths.length === 0) return;
    setIsExporting(true);
    try {
      await onExport(selectedYear, selectedMonths);
      setExportStep("success");
    } catch (error) {
      console.error("Export failed:", error);
    } finally {
      setIsExporting(false);
    }
  };

  const yearOptions = Array.from({ length: 6 }, (_, i) => currentYear - i);

  if (exportStep === "success") {
    return (
      <Modal isOpen={isOpen} onClose={onClose}>
        <div className="p-8 text-center">
          <div className="flex justify-center mb-4">
            <div className="bg-green-100 p-3 rounded-full">
              <CheckCircle2 className="w-12 h-12 text-green-600" />
            </div>
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">
            Exportation Réussie !
          </h2>
          <p className="text-gray-600 mb-8">
            Votre rapport Excel pour l'année {selectedYear} a été généré avec
            succès.
          </p>
          <div className="flex gap-4 justify-center">
            <button
              onClick={onClose}
              className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-gray-700 font-medium"
            >
              Fermer
            </button>
            <button
              onClick={onClose}
              className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium shadow-sm"
            >
              Terminer
            </button>
          </div>
        </div>
      </Modal>
    );
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <div className="relative p-6 max-w-md mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="bg-indigo-100 p-2.5 rounded-xl">
              <FileSpreadsheet className="w-6 h-6 text-indigo-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900 leading-tight">
                Exporter l'Analyse
              </h2>
              <p className="text-sm text-gray-500">
                Choisissez la période du rapport
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors group"
          >
            <X className="w-5 h-5 text-gray-400 group-hover:text-gray-600" />
          </button>
        </div>

        {/* Year Selection */}
        <div className="mb-6">
          <label className="block text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
            <Calendar className="w-4 h-4 text-indigo-500" /> Sélectionner
            l'Année
          </label>
          <div className="grid grid-cols-3 gap-2">
            {yearOptions.map((year) => (
              <button
                key={year}
                onClick={() => handleYearChange(year)}
                className={`py-2.5 px-4 rounded-xl border text-sm font-medium transition-all duration-200 ${
                  selectedYear === year
                    ? "bg-indigo-600 border-indigo-600 text-white shadow-lg shadow-indigo-100"
                    : "bg-white border-gray-200 text-gray-600 hover:border-indigo-300 hover:bg-indigo-50/30"
                }`}
              >
                {year}
              </button>
            ))}
          </div>
        </div>

        {/* Month Selection */}
        <div className="mb-8">
          <div className="flex justify-between items-end mb-3">
            <div>
              <label className="block text-sm font-semibold text-gray-700">
                Mois à inclure
              </label>
              <span className="text-xs text-gray-400">
                {selectedMonths.length} sélectionné(s)
              </span>
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleSelectAll}
                className="text-xs font-medium text-indigo-600 hover:text-indigo-800 flex items-center gap-1 px-2 py-1 rounded-md hover:bg-indigo-50 transition-colors"
              >
                <CheckSquare className="w-3.5 h-3.5" /> Tout cocher
              </button>
              <button
                onClick={handleClearAll}
                className="text-xs font-medium text-gray-500 hover:text-red-600 flex items-center gap-1 px-2 py-1 rounded-md hover:bg-red-50 transition-colors"
              >
                <Square className="w-3.5 h-3.5" /> Effacer
              </button>
            </div>
          </div>

          <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
            {months.map((month) => {
              const isFuture =
                selectedYear === currentYear && month.id > currentMonth;
              const isSelected = selectedMonths.includes(month.id);

              return (
                <button
                  key={month.id}
                  disabled={isFuture}
                  onClick={() => toggleMonth(month.id)}
                  className={`py-2.5 px-1 rounded-xl border text-xs font-medium transition-all duration-200 ${
                    isFuture
                      ? "bg-gray-50 border-gray-100 text-gray-300 cursor-not-allowed opacity-60"
                      : isSelected
                        ? "bg-indigo-50 border-indigo-600 text-indigo-700 ring-1 ring-indigo-600 shadow-sm"
                        : "bg-white border-gray-200 text-gray-600 hover:border-indigo-200 hover:bg-indigo-50/20"
                  }`}
                >
                  {month.name}
                </button>
              );
            })}
          </div>

          {selectedMonths.length === 0 && (
            <div className="mt-3 flex items-center gap-2 text-amber-600 text-xs bg-amber-50 p-2 rounded-lg border border-amber-100">
              <AlertCircle className="w-4 h-4" />
              Veuillez sélectionner au moins un mois pour l'export.
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3 pt-5 border-t border-gray-100">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-3 border border-gray-200 text-gray-600 rounded-2xl hover:bg-gray-50 font-semibold transition-all"
          >
            Annuler
          </button>
          <button
            onClick={handleExport}
            disabled={isExporting || selectedMonths.length === 0}
            className={`flex-[2] px-4 py-3 rounded-2xl font-bold text-white shadow-xl transition-all active:scale-[0.98] ${
              isExporting || selectedMonths.length === 0
                ? "bg-gray-300 shadow-none cursor-not-allowed"
                : "bg-indigo-600 hover:bg-indigo-700 shadow-indigo-200"
            }`}
          >
            {isExporting ? (
              <span className="flex items-center justify-center gap-2">
                <svg
                  className="animate-spin h-5 w-5 text-white"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                    fill="none"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
                Préparation...
              </span>
            ) : (
              "Exporter vers Excel"
            )}
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default ExportAnalysisModal;

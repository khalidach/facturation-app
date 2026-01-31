import React, { useState, useEffect } from "react";
import Modal from "../Modal";
import {
  X,
  Calendar,
  CheckCircle2,
  FileSpreadsheet,
  ArrowRight,
} from "lucide-react";

const ExportAnalysisModal = ({ isOpen, onClose, onExport }) => {
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth(); // 0-11

  const [startYear, setStartYear] = useState(currentYear);
  const [startMonth, setStartMonth] = useState(currentMonth);
  const [endYear, setEndYear] = useState(currentYear);
  const [endMonth, setEndMonth] = useState(currentMonth);

  const [isExporting, setIsExporting] = useState(false);
  const [exportStep, setExportStep] = useState("selection");

  const months = [
    { id: 0, name: "Janvier" },
    { id: 1, name: "Février" },
    { id: 2, name: "Mars" },
    { id: 3, name: "Avril" },
    { id: 4, name: "Mai" },
    { id: 5, name: "Juin" },
    { id: 6, name: "Juillet" },
    { id: 7, name: "Août" },
    { id: 8, name: "Septembre" },
    { id: 9, name: "Octobre" },
    { id: 10, name: "Novembre" },
    { id: 11, name: "Décembre" },
  ];

  const yearOptions = Array.from({ length: 6 }, (_, i) => currentYear - i);

  useEffect(() => {
    if (isOpen) {
      setExportStep("selection");
      setStartYear(currentYear);
      setStartMonth(currentMonth);
      setEndYear(currentYear);
      setEndMonth(currentMonth);
    }
  }, [isOpen, currentYear, currentMonth]);

  const handleExport = async () => {
    setIsExporting(true);
    try {
      // Pass start and end details to the parent
      await onExport({
        start: { year: startYear, month: startMonth },
        end: { year: endYear, month: endMonth },
      });
      setExportStep("success");
    } catch (error) {
      console.error("Export failed:", error);
    } finally {
      setIsExporting(false);
    }
  };

  // Validation: Ensure end date is not before start date
  const isValidRange = () => {
    if (endYear > startYear) return true;
    if (endYear === startYear && endMonth >= startMonth) return true;
    return false;
  };

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
            Le rapport pour la période de {months[startMonth].name} {startYear}{" "}
            à {months[endMonth].name} {endYear} a été généré.
          </p>
          <button
            onClick={onClose}
            className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium"
          >
            Terminer
          </button>
        </div>
      </Modal>
    );
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <div className="relative p-6 max-w-md mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="bg-indigo-100 p-2.5 rounded-xl">
              <FileSpreadsheet className="w-6 h-6 text-indigo-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">
                Exporter l'Analyse
              </h2>
              <p className="text-sm text-gray-500">
                Sélectionnez la plage de dates
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full"
          >
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        {/* Start Period */}
        <div className="space-y-4 mb-6">
          <label className="block text-sm font-semibold text-gray-700 flex items-center gap-2">
            <Calendar className="w-4 h-4 text-indigo-500" /> De (Début)
          </label>
          <div className="grid grid-cols-2 gap-3">
            <select
              value={startMonth}
              onChange={(e) => setStartMonth(parseInt(e.target.value))}
              className="p-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
            >
              {months.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name}
                </option>
              ))}
            </select>
            <select
              value={startYear}
              onChange={(e) => setStartYear(parseInt(e.target.value))}
              className="p-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
            >
              {yearOptions.map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex justify-center my-2">
          <ArrowRight className="text-gray-300 w-5 h-5 rotate-90 sm:rotate-0" />
        </div>

        {/* End Period */}
        <div className="space-y-4 mb-8">
          <label className="block text-sm font-semibold text-gray-700 flex items-center gap-2">
            <Calendar className="w-4 h-4 text-indigo-500" /> À (Fin)
          </label>
          <div className="grid grid-cols-2 gap-3">
            <select
              value={endMonth}
              onChange={(e) => setEndMonth(parseInt(e.target.value))}
              className="p-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
            >
              {months.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name}
                </option>
              ))}
            </select>
            <select
              value={endYear}
              onChange={(e) => setEndYear(parseInt(e.target.value))}
              className="p-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
            >
              {yearOptions.map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
          </div>
        </div>

        {!isValidRange() && (
          <div className="mb-4 p-3 bg-red-50 border border-red-100 rounded-xl text-red-600 text-xs">
            La date de fin ne peut pas être antérieure à la date de début.
          </div>
        )}

        <div className="flex items-center gap-3 pt-5 border-t border-gray-100">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-3 border border-gray-200 text-gray-600 rounded-2xl hover:bg-gray-50 font-semibold"
          >
            Annuler
          </button>
          <button
            onClick={handleExport}
            disabled={isExporting || !isValidRange()}
            className={`flex-[2] px-4 py-3 rounded-2xl font-bold text-white shadow-xl ${
              isExporting || !isValidRange()
                ? "bg-gray-300 shadow-none cursor-not-allowed"
                : "bg-indigo-600 hover:bg-indigo-700 shadow-indigo-200"
            }`}
          >
            {isExporting ? "Préparation..." : "Exporter vers Excel"}
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default ExportAnalysisModal;

import React, { useState } from "react";
import Modal from "../Modal";

const ExportAnalysisModal = ({ isOpen, onClose }) => {
  const [year, setYear] = useState(new Date().getFullYear());
  const [selectedMonths, setSelectedMonths] = useState([]);
  const [loading, setLoading] = useState(false);

  const months = [
    "Janvier",
    "Février",
    "Mars",
    "Avril",
    "Mai",
    "Juin",
    "Juillet",
    "Août",
    "Septembre",
    "Octobre",
    "Novembre",
    "Décembre",
  ];

  const toggleMonth = (index) => {
    if (selectedMonths.includes(index)) {
      setSelectedMonths(selectedMonths.filter((m) => m !== index));
    } else {
      if (selectedMonths.length >= 12) return;
      setSelectedMonths([...selectedMonths, index].sort((a, b) => a - b));
    }
  };

  const selectRange = (start, end) => {
    const range = [];
    for (let i = start; i <= end; i++) range.push(i);
    setSelectedMonths(range);
  };

  const handleExport = async () => {
    if (selectedMonths.length === 0)
      return alert("Sélectionnez au moins un mois");

    setLoading(true);
    try {
      const result = await window.electronAPI.exportAnalysisExcel({
        year,
        months: selectedMonths,
      });
      if (result.success) {
        alert("Exportation réussie !");
        onClose();
      }
    } catch (error) {
      alert("Erreur lors de l'exportation");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Exporter l'Analyse Financière"
    >
      <div className="p-4 space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">
            Sélectionner l'Année
          </label>
          <select
            value={year}
            onChange={(e) => setYear(parseInt(e.target.value))}
            className="w-full border rounded p-2"
          >
            {[year - 2, year - 1, year, year + 1].map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">
            Sélectionner les Mois (Max 12)
          </label>
          <div className="grid grid-cols-3 gap-2">
            {months.map((m, i) => (
              <button
                key={m}
                onClick={() => toggleMonth(i)}
                className={`p-2 text-xs rounded border ${selectedMonths.includes(i) ? "bg-blue-600 text-white" : "bg-gray-50"}`}
              >
                {m}
              </button>
            ))}
          </div>
        </div>

        <div className="flex gap-2 text-xs">
          <button
            onClick={() => selectRange(0, 11)}
            className="text-blue-600 underline"
          >
            Toute l'année
          </button>
          <button
            onClick={() => setSelectedMonths([])}
            className="text-red-600 underline"
          >
            Effacer
          </button>
        </div>

        <div className="flex justify-end gap-3 mt-6">
          <button onClick={onClose} className="px-4 py-2 border rounded">
            Annuler
          </button>
          <button
            onClick={handleExport}
            disabled={loading || selectedMonths.length === 0}
            className="px-4 py-2 bg-green-600 text-white rounded disabled:opacity-50"
          >
            {loading ? "Exportation..." : "Exporter vers Excel"}
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default ExportAnalysisModal;

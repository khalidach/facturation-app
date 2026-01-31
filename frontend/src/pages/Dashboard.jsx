import React, { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  TrendingUp,
  TrendingDown,
  Wallet,
  ArrowUpRight,
  ArrowDownRight,
  Calendar,
  RefreshCw,
  Zap,
  FileSpreadsheet, // Icon for the export button
} from "lucide-react";
import ExportAnalysisModal from "../components/dashboard/ExportAnalysisModal";

export default function Dashboard() {
  const [range, setRange] = useState("month");
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);

  // Helper to calculate date ranges for the backend query
  const getDates = () => {
    const now = new Date();
    let start = new Date();
    if (range === "day") start.setHours(0, 0, 0, 0);
    else if (range === "week") start.setDate(now.getDate() - 7);
    else if (range === "month") start.setMonth(now.getMonth() - 1);
    else if (range === "year") start.setFullYear(now.getFullYear() - 1);

    return {
      startDate: start.toISOString().split("T")[0],
      endDate: now.toISOString().split("T")[0],
    };
  };

  /**
   * FIX: Added handleExport function to process the range from the modal
   */
  const handleExport = async (rangeData) => {
    try {
      // The modal sends { start: {year, month}, end: {year, month} }
      const result = await window.electronAPI.exportAnalysisExcel({
        range: rangeData,
      });
      if (result.success) {
        console.log("Exportation réussie:", result.filePath);
      }
    } catch (error) {
      console.error("Erreur d'exportation:", error);
      throw error;
    }
  };

  // Fetch aggregate stats
  const {
    data: stats,
    isLoading,
    isFetching,
  } = useQuery({
    queryKey: ["dashboardStats", range],
    queryFn: () => window.electronAPI.getDashboardStats(getDates()),
    refetchInterval: 30000,
  });

  // Fetch recent activity for the feed
  const { data: recentIncomes } = useQuery({
    queryKey: ["recentIncomes"],
    queryFn: () =>
      window.electronAPI.getTransactions({ page: 1, limit: 5, type: "income" }),
  });

  const { data: recentExpenses } = useQuery({
    queryKey: ["recentExpenses"],
    queryFn: () =>
      window.electronAPI.getTransactions({
        page: 1,
        limit: 5,
        type: "expense",
      }),
  });

  const margin = useMemo(() => {
    if (!stats?.summary?.income || stats.summary.income === 0) return 0;
    return ((stats.summary.profit / stats.summary.income) * 100).toFixed(1);
  }, [stats]);

  const combinedActivities = useMemo(() => {
    const incomes = (recentIncomes?.data || []).map((item) => ({
      ...item,
      displayType: "income",
    }));
    const expenses = (recentExpenses?.data || []).map((item) => ({
      ...item,
      displayType: "expense",
    }));
    return [...incomes, ...expenses]
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .slice(0, 5);
  }, [recentIncomes, recentExpenses]);

  const isActuallyEmpty =
    !stats?.summary?.income &&
    !stats?.summary?.expense &&
    combinedActivities.length === 0;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Translated Labels
  const rangeLabels = {
    day: "Jour",
    week: "Semaine",
    month: "Mois",
    year: "Année",
  };

  const cards = [
    {
      title: "Chiffre d'Affaires",
      value: stats?.summary?.income || 0,
      icon: TrendingUp,
      trend: stats?.summary?.income > 0 ? "Revenu Actif" : "En attente",
      color: "blue",
      details: "Ventes brutes pour la période",
    },
    {
      title: "Dépenses Totales",
      value: stats?.summary?.expense || 0,
      icon: TrendingDown,
      trend:
        stats?.summary?.expense > 0 ? "Coûts Opérationnels" : "Aucun achat",
      color: "rose",
      details: "Sortie de capitaux",
    },
    {
      title: "Bénéfice Net",
      value: stats?.summary?.profit || 0,
      icon: Wallet,
      trend: "Marge de " + margin + "%",
      color: "emerald",
      details: "Liquidité nette gagnée",
    },
  ];

  const generateAreaPath = (data, type, width, height) => {
    if (!data || data.length === 0) return "";
    const maxVal = Math.max(
      ...data.map((d) => Math.max(d.income || 0, d.expense || 0, 100)),
      1,
    );
    const stepX = width / Math.max(data.length - 1, 1);
    let path = `M 0 ${height - ((data[0][type] || 0) / maxVal) * height}`;
    data.forEach((d, i) => {
      const x = i * stepX;
      const y = height - ((d[type] || 0) / maxVal) * height;
      path += ` L ${x} ${y}`;
    });
    return path;
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl font-extrabold text-gray-900 dark:text-white">
            Tableau de Bord
          </h1>
          <div className="flex items-center mt-2 text-gray-500 font-medium">
            <Calendar className="w-4 h-4 mr-2" />
            <span>
              Intelligence en temps réel •{" "}
              {new Date().toLocaleDateString("fr-FR", {
                month: "long",
                year: "numeric",
              })}
            </span>
            {isFetching && (
              <RefreshCw className="w-3 h-3 ml-4 animate-spin text-blue-500" />
            )}
          </div>
        </div>

        <div className="flex items-center gap-4">
          <button
            onClick={() => setIsExportModalOpen(true)}
            className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2.5 rounded-xl font-bold transition-all shadow-lg hover:shadow-emerald-500/20 active:scale-95"
          >
            <FileSpreadsheet className="w-5 h-5" />
            <span>Exporter l'Analyse</span>
          </button>

          <div className="flex bg-white/50 dark:bg-gray-800/50 backdrop-blur-md border rounded-2xl p-1.5">
            {["day", "week", "month", "year"].map((r) => (
              <button
                key={r}
                onClick={() => setRange(r)}
                className={`px-6 py-2 text-sm font-bold rounded-xl capitalize transition-all ${
                  range === r
                    ? "bg-blue-600 text-white shadow-lg"
                    : "text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                }`}
              >
                {rangeLabels[r]}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div
        className={`grid grid-cols-1 md:grid-cols-3 gap-6 ${
          isActuallyEmpty ? "opacity-40 grayscale" : ""
        }`}
      >
        {cards.map((card, i) => (
          <div
            key={i}
            className="bg-white dark:bg-gray-800 p-8 rounded-[2rem] shadow-sm border border-gray-100 dark:border-gray-700"
          >
            <div className="flex items-start justify-between">
              <div
                className={`p-4 rounded-2xl ${
                  card.color === "blue"
                    ? "bg-blue-50 dark:bg-blue-900/20"
                    : card.color === "rose"
                      ? "bg-rose-50 dark:bg-rose-900/20"
                      : "bg-emerald-50 dark:bg-emerald-900/20"
                }`}
              >
                <card.icon
                  className={`w-7 h-7 ${
                    card.color === "blue"
                      ? "text-blue-600"
                      : card.color === "rose"
                        ? "text-rose-600"
                        : "text-emerald-600"
                  }`}
                />
              </div>
              <div className="text-[10px] font-black uppercase tracking-widest bg-gray-50 dark:bg-gray-700/50 px-3 py-1 rounded-full text-gray-500 dark:text-gray-400">
                {card.trend}
              </div>
            </div>
            <div className="mt-8">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">
                {card.title}
              </p>
              <h3 className="text-4xl font-black mt-2 tracking-tight text-gray-900 dark:text-white">
                {card.value?.toLocaleString()}{" "}
                <span className="text-sm opacity-40">MAD</span>
              </h3>
            </div>
          </div>
        ))}
      </div>

      <div
        className={`grid grid-cols-1 lg:grid-cols-3 gap-8 ${
          isActuallyEmpty ? "opacity-40 grayscale" : ""
        }`}
      >
        <div className="lg:col-span-2 bg-white dark:bg-gray-800 p-10 rounded-[2.5rem] shadow-sm border border-gray-100 dark:border-gray-700">
          <div className="flex items-center justify-between mb-10">
            <h3 className="text-2xl font-black text-gray-900 dark:text-white">
              Flux de Trésorerie
            </h3>
            <div className="flex gap-4">
              <div className="flex items-center text-xs font-bold text-gray-400">
                <div className="w-3 h-3 bg-blue-500 rounded-full mr-2" />{" "}
                Revenus
              </div>
              <div className="flex items-center text-xs font-bold text-gray-400">
                <div className="w-3 h-3 bg-rose-500 rounded-full mr-2" />{" "}
                Dépenses
              </div>
            </div>
          </div>

          <div className="relative h-72 w-full">
            {stats?.chartData && stats.chartData.length > 1 ? (
              <svg
                className="w-full h-full"
                viewBox="0 0 800 200"
                preserveAspectRatio="none"
              >
                <path
                  d={generateAreaPath(stats.chartData, "income", 800, 200)}
                  fill="none"
                  stroke="#3b82f6"
                  strokeWidth="4"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d={generateAreaPath(stats.chartData, "expense", 800, 200)}
                  fill="none"
                  stroke="#fb7185"
                  strokeWidth="4"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            ) : (
              <div className="flex h-full items-center justify-center bg-gray-50 dark:bg-gray-700/30 rounded-[2rem] border-2 border-dashed border-gray-200 dark:border-gray-600 text-gray-400 font-medium">
                Aucune donnée historique pour cette période
              </div>
            )}
          </div>
        </div>

        <div className="bg-gradient-to-br from-indigo-700 to-blue-900 p-10 rounded-[2.5rem] text-white shadow-xl flex flex-col justify-between">
          <div>
            <div className="p-3 bg-white/10 rounded-2xl w-fit mb-6">
              <Zap className="w-6 h-6 text-blue-300" />
            </div>
            <h4 className="font-black text-[10px] uppercase tracking-widest mb-2 opacity-60">
              Efficacité de la Marge
            </h4>
            <p className="text-6xl font-black tracking-tighter">{margin}%</p>
          </div>

          <div className="mt-10">
            <div className="flex justify-between text-[10px] font-black uppercase mb-2">
              <span>Performance</span>
              <span>Objectif: 15%</span>
            </div>
            <div className="h-3 w-full bg-white/10 rounded-full overflow-hidden">
              <div
                style={{
                  width: `${Math.min(Math.max(Number(margin), 0), 100)}%`,
                }}
                className={`h-full rounded-full transition-all duration-1000 ${
                  Number(margin) > 10
                    ? "bg-emerald-400"
                    : Number(margin) > 0
                      ? "bg-blue-400"
                      : "bg-rose-400"
                }`}
              />
            </div>
            <p className="mt-6 text-sm text-blue-100 font-medium leading-relaxed">
              Votre marge actuelle indique que pour chaque dirham de revenu,
              vous conservez{" "}
              {(
                (stats?.summary?.profit || 0) / (stats?.summary?.income || 1)
              ).toFixed(2)}{" "}
              MAD de bénéfice.
            </p>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 p-10 rounded-[2.5rem] shadow-sm border border-gray-100 dark:border-gray-700">
        <h3 className="text-xl font-black mb-8 text-gray-900 dark:text-white">
          Mouvements Récents
        </h3>
        <div className="space-y-4">
          {combinedActivities.length > 0 ? (
            combinedActivities.map((act, i) => (
              <div
                key={i}
                className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/30 rounded-2xl border border-transparent hover:border-gray-200 dark:hover:border-gray-600 transition-all"
              >
                <div className="flex items-center gap-4">
                  <div
                    className={`p-2 rounded-xl ${
                      act.displayType === "income"
                        ? "bg-green-100 text-green-600"
                        : "bg-red-100 text-red-600"
                    }`}
                  >
                    {act.displayType === "income" ? (
                      <ArrowUpRight className="w-5 h-5" />
                    ) : (
                      <ArrowDownRight className="w-5 h-5" />
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-gray-900 dark:text-white">
                      {act.description}
                    </p>
                    <p className="text-xs text-gray-400 font-medium">
                      {new Date(act.date).toLocaleDateString("fr-FR")}
                    </p>
                  </div>
                </div>
                <div
                  className={`text-sm font-black ${
                    act.displayType === "income"
                      ? "text-green-600"
                      : "text-red-600"
                  }`}
                >
                  {act.displayType === "income" ? "+" : "-"}{" "}
                  {act.amount.toLocaleString()} MAD
                </div>
              </div>
            ))
          ) : (
            <p className="text-center text-gray-400 font-medium py-4 italic">
              Aucune activité récente détectée.
            </p>
          )}
        </div>
      </div>

      {/* FIX: Passed handleExport to the Modal */}
      <ExportAnalysisModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        onExport={handleExport}
      />
    </div>
  );
}

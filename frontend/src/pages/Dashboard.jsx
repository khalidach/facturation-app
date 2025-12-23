import React, { useState, useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  TrendingUp,
  TrendingDown,
  Wallet,
  ArrowUpRight,
  ArrowDownRight,
  Calendar,
  Layers,
  Users,
  CreditCard,
  Clock,
  RefreshCw,
  Zap,
} from "lucide-react";

export default function Dashboard() {
  const [range, setRange] = useState("month");
  const queryClient = useQueryClient();

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

  // Main statistics query
  const {
    data: stats,
    isLoading,
    isFetching,
  } = useQuery({
    queryKey: ["dashboardStats", range],
    queryFn: () => window.electronAPI.getDashboardStats(getDates()),
    refetchInterval: 30000,
  });

  // Fetch recent transactions
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

  const handleRefresh = () => {
    queryClient.invalidateQueries(["dashboardStats"]);
    queryClient.invalidateQueries(["recentIncomes"]);
    queryClient.invalidateQueries(["recentExpenses"]);
  };

  const margin = useMemo(() => {
    if (!stats?.summary.income || stats.summary.income === 0) return 0;
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
    !stats?.summary.income &&
    !stats?.summary.expense &&
    combinedActivities.length === 0;

  if (isLoading)
    return (
      <div className="flex items-center justify-center h-full">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="text-gray-500 font-medium animate-pulse">
            Syncing your financial data...
          </p>
        </div>
      </div>
    );

  const cards = [
    {
      title: "Total Revenue",
      value: stats?.summary.income || 0,
      icon: TrendingUp,
      trend: stats?.summary.income > 0 ? "Active Revenue" : "Awaiting Data",
      color: "blue",
      details: "Gross sales for current range",
    },
    {
      title: "Total Expenses",
      value: stats?.summary.expense || 0,
      icon: TrendingDown,
      trend: stats?.summary.expense > 0 ? "Operational Costs" : "No Spend Yet",
      color: "rose",
      details: "Outflow of capital",
    },
    {
      title: "Net Profit",
      value: stats?.summary.profit || 0,
      icon: Wallet,
      trend: margin + "% Margin",
      color: "emerald",
      details: "Net liquidity gained",
    },
  ];

  const generateAreaPath = (data, type, width, height) => {
    if (!data || data.length === 0) return "";
    const maxVal = Math.max(
      ...data.map((d) => Math.max(d.income, d.expense, 100)),
      1
    );
    const stepX = width / Math.max(data.length - 1, 1);

    let path = `M 0 ${height - (data[0][type] / maxVal) * height}`;
    if (data.length === 1) {
      path += ` L ${width} ${height - (data[0][type] / maxVal) * height}`;
    } else {
      data.forEach((d, i) => {
        const x = i * stepX;
        const y = height - (d[type] / maxVal) * height;
        path += ` L ${x} ${y}`;
      });
    }
    return path;
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Executive Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl font-extrabold text-gray-900 dark:text-white tracking-tight">
            Financial Dashboard
          </h1>
          <div className="flex items-center mt-2 text-gray-500 dark:text-gray-400 font-medium">
            <Calendar className="w-4 h-4 mr-2" />
            <span>
              Real-time intelligence •{" "}
              {new Date().toLocaleDateString(undefined, {
                month: "long",
                year: "numeric",
              })}
            </span>
            {isFetching && (
              <span className="ml-4 flex items-center text-blue-500 text-[10px] font-black uppercase tracking-widest">
                <RefreshCw className="w-3 h-3 mr-1 animate-spin" />
                Refreshing...
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-4">
          <button
            onClick={handleRefresh}
            className="p-2.5 text-gray-400 hover:text-blue-600 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm transition-all hover:shadow-md active:scale-95"
            title="Refresh Ledger"
          >
            <RefreshCw
              className={`w-5 h-5 ${
                isFetching ? "animate-spin text-blue-500" : ""
              }`}
            />
          </button>
          <div className="flex bg-white/50 dark:bg-gray-800/50 backdrop-blur-md border border-gray-200 dark:border-gray-700 rounded-2xl p-1.5 shadow-sm">
            {["day", "week", "month", "year"].map((r) => (
              <button
                key={r}
                onClick={() => setRange(r)}
                className={`px-6 py-2 text-sm font-bold rounded-xl capitalize transition-all duration-300 ${
                  range === r
                    ? "bg-blue-600 text-white shadow-lg shadow-blue-500/30"
                    : "text-gray-500 hover:text-gray-900 dark:hover:text-gray-200"
                }`}
              >
                {r}
              </button>
            ))}
          </div>
        </div>
      </div>

      {isActuallyEmpty ? (
        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-gray-800 dark:to-gray-900 p-12 rounded-[2.5rem] border-2 border-dashed border-blue-200 dark:border-gray-700 text-center space-y-6">
          <div className="inline-flex p-6 bg-white dark:bg-gray-800 rounded-3xl shadow-xl border border-blue-100 dark:border-gray-700">
            <Zap className="w-12 h-12 text-blue-600 animate-pulse" />
          </div>
          <div className="max-w-md mx-auto">
            <h2 className="text-2xl font-black text-gray-900 dark:text-white">
              Ready for growth?
            </h2>
            <p className="text-gray-500 dark:text-gray-400 mt-2 font-medium">
              This dashboard is waiting for your data. Record your first
              transaction or invoice to see real-time financial intelligence.
            </p>
          </div>
          <div className="flex justify-center gap-4">
            <div className="px-6 py-3 bg-blue-600 text-white font-bold rounded-2xl shadow-lg shadow-blue-500/20">
              Go to Finance Tab
            </div>
          </div>
        </div>
      ) : null}

      {/* KPI Grid */}
      <div
        className={`grid grid-cols-1 md:grid-cols-3 gap-6 transition-opacity duration-500 ${
          isActuallyEmpty ? "opacity-40 pointer-events-none grayscale" : ""
        }`}
      >
        {cards.map((card, i) => (
          <div
            key={i}
            className="relative group bg-white dark:bg-gray-800 p-8 rounded-[2rem] shadow-sm border border-gray-100 dark:border-gray-700 hover:shadow-2xl hover:-translate-y-1.5 transition-all duration-500 overflow-hidden"
          >
            <div
              className={`absolute top-0 right-0 -mt-4 -mr-4 w-32 h-32 bg-${card.color}-500/5 rounded-full blur-3xl group-hover:scale-150 transition-transform duration-700`}
            />

            <div className="flex items-start justify-between relative z-10">
              <div
                className={`p-4 rounded-2xl bg-${card.color}-50 dark:bg-${card.color}-900/20 transition-transform group-hover:rotate-12`}
              >
                <card.icon
                  className={`w-7 h-7 text-${card.color}-600 dark:text-${card.color}-400`}
                />
              </div>
              <div
                className={`flex items-center text-[10px] font-black tracking-widest uppercase px-3 py-1 rounded-full ${
                  card.color === "emerald"
                    ? "bg-emerald-50 text-emerald-600"
                    : "bg-blue-50 text-blue-600"
                }`}
              >
                {card.trend}
              </div>
            </div>

            <div className="mt-8 relative z-10">
              <p className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-[0.15em]">
                {card.title}
              </p>
              <h3 className="text-4xl font-black text-gray-900 dark:text-white mt-2 flex items-baseline tracking-tight">
                {card.value?.toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
                <span className="ml-2 text-sm font-bold text-gray-400 opacity-60">
                  MAD
                </span>
              </h3>
              <p className="text-[10px] text-gray-400 mt-4 font-semibold italic">
                {card.details}
              </p>
            </div>
          </div>
        ))}
      </div>

      <div
        className={`grid grid-cols-1 lg:grid-cols-3 gap-8 transition-opacity duration-500 ${
          isActuallyEmpty ? "opacity-40 pointer-events-none grayscale" : ""
        }`}
      >
        {/* Main Cash Flow Chart */}
        <div className="lg:col-span-2 bg-white dark:bg-gray-800 p-10 rounded-[2.5rem] shadow-sm border border-gray-100 dark:border-gray-700">
          <div className="flex items-center justify-between mb-10">
            <div>
              <h3 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight">
                Cash Flow Analytics
              </h3>
              <p className="text-sm text-gray-500 font-medium mt-1">
                Algorithmic line chart visualization
              </p>
            </div>
            <div className="flex gap-6">
              <div className="flex items-center text-[10px] font-black tracking-widest text-blue-600">
                <span className="w-2.5 h-2.5 bg-blue-500 rounded-full mr-2 ring-4 ring-blue-500/20"></span>
                REVENUE
              </div>
              <div className="flex items-center text-[10px] font-black tracking-widest text-rose-500">
                <span className="w-2.5 h-2.5 bg-rose-400 rounded-full mr-2 ring-4 ring-rose-500/20"></span>
                EXPENSES
              </div>
            </div>
          </div>

          <div className="relative h-72 w-full">
            {stats?.chartData && stats.chartData.length > 0 ? (
              <svg
                className="w-full h-full"
                viewBox="0 0 800 200"
                preserveAspectRatio="none"
              >
                {/* Horizontal Grid Lines */}
                <line
                  x1="0"
                  y1="0"
                  x2="800"
                  y2="0"
                  stroke="currentColor"
                  className="text-gray-100 dark:text-gray-800"
                  strokeWidth="1"
                />
                <line
                  x1="0"
                  y1="50"
                  x2="800"
                  y2="50"
                  stroke="currentColor"
                  className="text-gray-100 dark:text-gray-800"
                  strokeWidth="1"
                />
                <line
                  x1="0"
                  y1="100"
                  x2="800"
                  y2="100"
                  stroke="currentColor"
                  className="text-gray-100 dark:text-gray-800"
                  strokeWidth="1"
                />
                <line
                  x1="0"
                  y1="150"
                  x2="800"
                  y2="150"
                  stroke="currentColor"
                  className="text-gray-100 dark:text-gray-800"
                  strokeWidth="1"
                />
                <line
                  x1="0"
                  y1="200"
                  x2="800"
                  y2="200"
                  stroke="currentColor"
                  className="text-gray-100 dark:text-gray-800"
                  strokeWidth="1"
                />

                {/* Income Line */}
                <path
                  d={generateAreaPath(stats.chartData, "income", 800, 200)}
                  fill="none"
                  stroke="#3b82f6"
                  strokeWidth="4"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="transition-all duration-1000"
                />

                {/* Expense Line */}
                <path
                  d={generateAreaPath(stats.chartData, "expense", 800, 200)}
                  fill="none"
                  stroke="#fb7185"
                  strokeWidth="4"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="transition-all duration-1000"
                />

                {/* Data Points (Markers) */}
                {stats.chartData.map((d, i) => {
                  const maxVal = Math.max(
                    ...stats.chartData.map((cd) =>
                      Math.max(cd.income, cd.expense, 100)
                    ),
                    1
                  );
                  const stepX = 800 / Math.max(stats.chartData.length - 1, 1);
                  const x = i * stepX;
                  const yIncome = 200 - (d.income / maxVal) * 200;
                  const yExpense = 200 - (d.expense / maxVal) * 200;
                  return (
                    <g key={i}>
                      <circle
                        cx={x}
                        cy={yIncome}
                        r="3"
                        fill="#3b82f6"
                        className="opacity-0 hover:opacity-100 transition-opacity duration-300"
                      />
                      <circle
                        cx={x}
                        cy={yExpense}
                        r="3"
                        fill="#fb7185"
                        className="opacity-0 hover:opacity-100 transition-opacity duration-300"
                      />
                    </g>
                  );
                })}
              </svg>
            ) : (
              <div className="flex flex-col items-center justify-center h-full bg-gray-50/50 dark:bg-gray-900/50 rounded-[2rem] border-2 border-dashed border-gray-100 dark:border-gray-800">
                <Layers className="w-12 h-12 text-gray-200 dark:text-gray-700 mb-3" />
                <p className="text-gray-400 dark:text-gray-600 text-xs font-bold uppercase tracking-widest">
                  Collecting timeframe data
                </p>
              </div>
            )}

            <div className="flex justify-between mt-8 px-2 text-[10px] text-gray-400 font-black uppercase tracking-[0.2em]">
              {stats?.chartData && stats.chartData.length > 0 ? (
                stats.chartData
                  .filter((_, i, arr) => i % Math.ceil(arr.length / 5) === 0)
                  .map((d, i) => (
                    <span key={i}>
                      {new Date(d.date).toLocaleDateString(undefined, {
                        day: "numeric",
                        month: "short",
                      })}
                    </span>
                  ))
              ) : (
                <span className="w-full text-center">
                  Awaiting historical baseline
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Intelligence Side Panel */}
        <div className="space-y-6">
          <div className="bg-gradient-to-br from-indigo-700 to-blue-900 p-10 rounded-[2.5rem] text-white shadow-2xl shadow-blue-500/20 relative overflow-hidden">
            <div className="absolute -bottom-4 -right-4 w-32 h-32 bg-white/5 rounded-full blur-2xl" />
            <h4 className="text-blue-200 font-black text-[10px] uppercase tracking-[0.25em] mb-6">
              Net Margin Efficiency
            </h4>
            <div className="flex items-end justify-between relative z-10">
              <div>
                <p className="text-6xl font-black tracking-tighter">
                  {margin}%
                </p>
                <p className="text-blue-300 text-xs mt-3 font-bold tracking-wide">
                  Profitability Matrix
                </p>
              </div>
              <div className="p-4 bg-white/10 rounded-[1.5rem] backdrop-blur-2xl border border-white/20">
                <Layers className="w-8 h-8 text-white" />
              </div>
            </div>
            <div className="mt-10 h-2.5 w-full bg-white/10 rounded-full overflow-hidden">
              <div
                style={{ width: `${Math.min(Number(margin), 100)}%` }}
                className={`h-full rounded-full transition-all duration-1000 ${
                  Number(margin) > 20 ? "bg-emerald-400" : "bg-blue-400"
                }`}
              />
            </div>
            <p className="mt-6 text-[9px] text-blue-200 uppercase font-black tracking-[0.2em] leading-relaxed">
              {Number(margin) > 20
                ? "Target Velocity: HIGH"
                : "Target Velocity: STABLE"}
            </p>
          </div>

          <div className="bg-white dark:bg-gray-800 p-8 rounded-[2rem] shadow-sm border border-gray-100 dark:border-gray-700 h-full max-h-[420px] flex flex-col">
            <h3 className="text-lg font-black text-gray-900 dark:text-white mb-8 flex items-center tracking-tight">
              <Clock className="w-5 h-5 mr-2 text-blue-600" />
              Real-time Ledger
            </h3>
            <div className="space-y-5 overflow-y-auto pr-2 custom-scrollbar">
              {combinedActivities.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 text-center">
                  <div className="w-12 h-12 bg-gray-50 dark:bg-gray-900 rounded-full flex items-center justify-center mb-3">
                    <Clock className="w-6 h-6 text-gray-300" />
                  </div>
                  <p className="text-gray-400 font-bold text-[10px] uppercase tracking-widest">
                    No activity yet
                  </p>
                </div>
              ) : (
                combinedActivities.map((item, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-4 rounded-[1.25rem] hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-all border border-transparent hover:border-gray-100 dark:hover:border-gray-600 group"
                  >
                    <div className="flex items-center gap-4">
                      <div
                        className={`p-3 rounded-xl transition-transform group-hover:scale-110 ${
                          item.displayType === "income"
                            ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400"
                            : "bg-rose-50 text-rose-600 dark:bg-rose-900/20 dark:text-rose-400"
                        }`}
                      >
                        {item.displayType === "income" ? (
                          <ArrowUpRight className="w-4 h-4" />
                        ) : (
                          <ArrowDownRight className="w-4 h-4" />
                        )}
                      </div>
                      <div className="overflow-hidden">
                        <p className="text-sm font-black text-gray-900 dark:text-white truncate w-32 tracking-tight">
                          {item.description}
                        </p>
                        <p className="text-[9px] text-gray-400 font-black uppercase mt-1 tracking-wider">
                          {item.contact_person || "Generic Entry"}
                        </p>
                      </div>
                    </div>
                    <p
                      className={`text-sm font-black text-right tracking-tighter ${
                        item.displayType === "income"
                          ? "text-emerald-600 dark:text-emerald-400"
                          : "text-rose-600 dark:text-rose-400"
                      }`}
                    >
                      {item.amount.toLocaleString()}
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      <div
        className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 transition-opacity duration-500 ${
          isActuallyEmpty ? "opacity-40 pointer-events-none grayscale" : ""
        }`}
      >
        <div className="bg-white dark:bg-gray-800 p-8 rounded-[2rem] border border-gray-100 dark:border-gray-700 flex items-center gap-5 group hover:shadow-xl transition-all">
          <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-2xl group-hover:rotate-12 transition-transform">
            <Users className="text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
              Scale
            </p>
            <p className="text-sm font-black text-gray-800 dark:text-white mt-1">
              Clients Active
            </p>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 p-8 rounded-[2rem] border border-gray-100 dark:border-gray-700 flex items-center gap-5 group hover:shadow-xl transition-all">
          <div className="bg-rose-50 dark:bg-rose-900/20 p-4 rounded-2xl group-hover:rotate-12 transition-transform">
            <CreditCard className="text-rose-600 dark:text-rose-400" />
          </div>
          <div>
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
              Control
            </p>
            <p className="text-sm font-black text-gray-800 dark:text-white mt-1">
              Budget Safety
            </p>
          </div>
        </div>
        <div className="col-span-1 lg:col-span-2 bg-emerald-500/5 dark:bg-emerald-500/10 p-8 rounded-[2rem] border border-emerald-500/20 flex items-center justify-between group hover:shadow-xl transition-all">
          <div>
            <h4 className="text-emerald-900 dark:text-emerald-400 font-black text-lg tracking-tight">
              System Health: {Number(margin) > 15 ? "OPTIMIZED" : "STEADY"}
            </h4>
            <p className="text-[11px] text-emerald-700/70 dark:text-emerald-400/60 mt-2 font-bold leading-relaxed italic">
              {Number(margin) > 15
                ? "Operational efficiency is significantly above average benchmarks."
                : "Revenue and expenditure currents are flowing within expected parameters."}
            </p>
          </div>
          <TrendingUp className="text-emerald-500 w-12 h-12 opacity-30 group-hover:opacity-100 transition-opacity" />
        </div>
      </div>
    </div>
  );
}

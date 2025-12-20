import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { TrendingUp, TrendingDown, Wallet } from "lucide-react";

export default function Dashboard() {
  const [range, setRange] = useState("month");

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

  const { data: stats, isLoading } = useQuery({
    queryKey: ["dashboardStats", range],
    queryFn: () => window.electronAPI.getDashboardStats(getDates()),
  });

  if (isLoading) return <div className="p-8">Loading analysis...</div>;

  const cards = [
    {
      title: "Income",
      value: stats?.summary.income,
      icon: TrendingUp,
      color: "text-green-600",
      bg: "bg-green-50",
    },
    {
      title: "Expenses",
      value: stats?.summary.expense,
      icon: TrendingDown,
      color: "text-red-600",
      bg: "bg-red-50",
    },
    {
      title: "Profit",
      value: stats?.summary.profit,
      icon: Wallet,
      color: "text-blue-600",
      bg: "bg-blue-50",
    },
  ];

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
            Dashboard
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Overview of your cash flow.
          </p>
        </div>
        <div className="flex bg-white dark:bg-gray-800 rounded-xl p-1 shadow-sm border">
          {["day", "week", "month", "year"].map((r) => (
            <button
              key={r}
              onClick={() => setRange(r)}
              className={`px-4 py-1.5 text-sm font-medium rounded-lg capitalize ${
                range === r
                  ? "bg-blue-600 text-white shadow-md"
                  : "text-gray-500"
              }`}
            >
              {r}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {cards.map((card, i) => (
          <div
            key={i}
            className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700"
          >
            <div className={`inline-flex p-3 rounded-xl ${card.bg} mb-4`}>
              <card.icon className={`w-6 h-6 ${card.color}`} />
            </div>
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
              {card.title}
            </p>
            <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mt-1">
              {card.value?.toLocaleString()}{" "}
              <span className="text-sm font-normal text-gray-500">MAD</span>
            </h3>
          </div>
        ))}
      </div>

      <div className="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
        <h3 className="text-lg font-bold mb-6">Activity Timeline</h3>
        <div className="space-y-4">
          {stats?.chartData.length === 0 ? (
            <div className="text-center py-12 text-gray-400 italic">
              No data found
            </div>
          ) : (
            stats?.chartData.slice(-15).map((day, idx) => {
              const max = Math.max(
                ...stats.chartData.map((d) => Math.max(d.income, d.expense, 1))
              );
              return (
                <div key={idx} className="space-y-1">
                  <div className="flex justify-between text-xs font-medium text-gray-500">
                    <span>
                      {new Date(day.date).toLocaleDateString(undefined, {
                        day: "numeric",
                        month: "short",
                      })}
                    </span>
                  </div>
                  <div className="relative h-4 w-full bg-gray-100 dark:bg-gray-700 rounded-full flex overflow-hidden">
                    <div
                      style={{ width: `${(day.income / max) * 100}%` }}
                      className="h-full bg-green-500"
                    ></div>
                    <div
                      style={{ width: `${(day.expense / max) * 100}%` }}
                      className="h-full bg-red-400"
                    ></div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}

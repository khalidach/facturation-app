import React, { useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "react-hot-toast";
import Facturation from "@/pages/Facturation.jsx";
import Settings from "@/pages/Settings.jsx";
import Theme from "@/pages/Theme.jsx";
import { Settings as SettingsIcon, FileText, Palette } from "lucide-react";

const queryClient = new QueryClient();

export default function App() {
  const [activeTab, setActiveTab] = useState("facturation");

  return (
    <QueryClientProvider client={queryClient}>
      {activeTab === "theme" ? (
        <Theme />
      ) : (
        <div className="flex h-screen bg-gray-100 dark:bg-gray-900">
          <aside className="w-64 bg-white dark:bg-gray-800 shadow-md flex flex-col">
            <div className="p-6 text-2xl font-bold text-blue-600 dark:text-blue-400">
              Facturation Pro
            </div>
            <nav className="flex-1 px-4 space-y-2">
              <button
                onClick={() => setActiveTab("facturation")}
                className={`flex items-center w-full px-4 py-2 text-left rounded-lg transition-colors duration-200 ${
                  activeTab === "facturation"
                    ? "bg-blue-600 text-white"
                    : "text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"
                }`}
              >
                <FileText className="w-5 h-5 mr-3" />
                Facturation
              </button>
              <button
                onClick={() => setActiveTab("settings")}
                className={`flex items-center w-full px-4 py-2 text-left rounded-lg transition-colors duration-200 ${
                  activeTab === "settings"
                    ? "bg-blue-600 text-white"
                    : "text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"
                }`}
              >
                <SettingsIcon className="w-5 h-5 mr-3" />
                Settings
              </button>
              <button
                onClick={() => setActiveTab("theme")}
                className={`flex items-center w-full px-4 py-2 text-left rounded-lg transition-colors duration-200 ${
                  activeTab === "theme"
                    ? "bg-blue-600 text-white"
                    : "text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"
                }`}
              >
                <Palette className="w-5 h-5 mr-3" />
                Theme
              </button>
            </nav>
          </aside>
          <main className="flex-1 p-8 overflow-y-auto">
            {activeTab === "facturation" && <Facturation />}
            {activeTab === "settings" && <Settings />}
          </main>
        </div>
      )}
      <Toaster position="bottom-right" />
    </QueryClientProvider>
  );
}

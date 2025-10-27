import React, { useState, useEffect } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "react-hot-toast";
import Facturation from "./pages/Facturation.jsx";
import Settings from "./pages/Settings.jsx";
import Theme from "./pages/Theme.jsx";
import Verification from "./pages/Verification.jsx";
import { Settings as SettingsIcon, FileText, Palette } from "lucide-react";

const queryClient = new QueryClient();
const STORAGE_KEY = "facturation-app-license"; // Key to check for verification

export default function App() {
  const [activeTab, setActiveTab] = useState("facturation");

  // --- New Verification State ---
  const [isVerified, setIsVerified] = useState(false);
  const [isLoading, setIsLoading] = useState(true); // Loading state for check

  // --- Check for existing license on load ---
  useEffect(() => {
    try {
      const storedLicense = localStorage.getItem(STORAGE_KEY);
      if (storedLicense) {
        const { valid } = JSON.parse(storedLicense); // This correctly reads {valid: true}
        if (valid) {
          setIsVerified(true);
        }
      }
    } catch (error) {
      console.error("Failed to parse stored license", error);
      setIsVerified(false);
    }
    setIsLoading(false);
  }, []);

  // --- Show loading screen ---
  if (isLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-gray-100 dark:bg-gray-900">
        <div>Loading...</div>
      </div>
    );
  }

  // --- Show Verification Page if not verified ---
  if (!isVerified) {
    return (
      <QueryClientProvider client={queryClient}>
        <Verification onSuccess={() => setIsVerified(true)} />
        <Toaster position="bottom-right" />
      </QueryClientProvider>
    );
  }

  // --- Show Main App if verified ---
  return (
    <QueryClientProvider client={queryClient}>
      {/* REMOVED TERNARY: The sidebar layout is now permanent */}
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

        {/* UPDATED MAIN: Removed 'p-8', as 'Theme' needs full-width.
            Padding is now applied to Facturation and Settings individually.
        */}
        <main className="flex-1 overflow-y-auto">
          {activeTab === "facturation" && (
            <div className="p-8">
              <Facturation />
            </div>
          )}
          {activeTab === "settings" && (
            <div className="p-8">
              <Settings />
            </div>
          )}
          {/* ADDED THEME HERE */}
          {activeTab === "theme" && <Theme />}
        </main>
      </div>
      <Toaster position="bottom-right" />
    </QueryClientProvider>
  );
}

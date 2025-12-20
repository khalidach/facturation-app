import React, { useState, useEffect } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "react-hot-toast";
import Facturation from "./pages/Facturation.jsx";
import Settings from "./pages/Settings.jsx";
import Theme from "./pages/Theme.jsx";
import Verification from "./pages/Verification.jsx";
import Contacts from "./pages/Contacts.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import Finance from "./pages/Finance.jsx";
import {
  Settings as SettingsIcon,
  FileText,
  Palette,
  Users,
  LayoutDashboard,
  CircleDollarSign,
} from "lucide-react";

const queryClient = new QueryClient();
const STORAGE_KEY = "facturation-app-license";

export default function App() {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [isVerified, setIsVerified] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    try {
      const storedLicense = localStorage.getItem(STORAGE_KEY);
      if (storedLicense) {
        const { valid } = JSON.parse(storedLicense);
        if (valid) setIsVerified(true);
      }
    } catch (e) {
      console.error(e);
    }
    setIsLoading(false);
  }, []);

  if (isLoading)
    return (
      <div className="flex h-screen w-full items-center justify-center">
        Loading...
      </div>
    );
  if (!isVerified)
    return (
      <QueryClientProvider client={queryClient}>
        <Verification onSuccess={() => setIsVerified(true)} />
        <Toaster position="bottom-right" />
      </QueryClientProvider>
    );

  const menuItems = [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    { id: "finance", label: "Finance", icon: CircleDollarSign },
    { id: "facturation", label: "Facturation", icon: FileText },
    { id: "contacts", label: "Contacts", icon: Users },
    { id: "settings", label: "Settings", icon: SettingsIcon },
    { id: "theme", label: "Theme", icon: Palette },
  ];

  return (
    <QueryClientProvider client={queryClient}>
      <div className="flex h-screen bg-gray-100 dark:bg-gray-900">
        <aside className="w-64 bg-white dark:bg-gray-800 shadow-md flex flex-col">
          <div className="p-6 text-2xl font-bold text-blue-600">
            Facturation Pro
          </div>
          <nav className="flex-1 px-4 space-y-2">
            {menuItems.map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`flex items-center w-full px-4 py-2 text-left rounded-lg transition-colors ${
                  activeTab === item.id
                    ? "bg-blue-600 text-white"
                    : "text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                }`}
              >
                <item.icon className="w-5 h-5 mr-3" />
                {item.label}
              </button>
            ))}
          </nav>
        </aside>

        <main className="flex-1 overflow-y-auto">
          {activeTab === "dashboard" && (
            <div className="p-8">
              <Dashboard />
            </div>
          )}
          {activeTab === "finance" && (
            <div className="p-8">
              <Finance />
            </div>
          )}
          {activeTab === "facturation" && (
            <div className="p-8">
              <Facturation />
            </div>
          )}
          {activeTab === "contacts" && (
            <div className="p-8">
              <Contacts />
            </div>
          )}
          {activeTab === "settings" && (
            <div className="p-8">
              <Settings />
            </div>
          )}
          {activeTab === "theme" && <Theme />}
        </main>
      </div>
      <Toaster position="bottom-right" />
    </QueryClientProvider>
  );
}

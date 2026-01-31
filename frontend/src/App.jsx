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
import Treasury from "./pages/Treasury.jsx";
import BonDeCommande from "./pages/BonDeCommande.jsx";
import {
  Settings as SettingsIcon,
  FileText,
  Palette,
  Users,
  LayoutDashboard,
  CircleDollarSign,
  Landmark,
  ShoppingBag,
} from "lucide-react";

const queryClient = new QueryClient();

export default function App() {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [isVerified, setIsVerified] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Define the check as a reusable function
  const checkSecurity = async () => {
    try {
      if (
        window.electronAPI &&
        typeof window.electronAPI.checkLicenseStatus === "function"
      ) {
        const status = await window.electronAPI.checkLicenseStatus();
        const valid = status && status.valid === true;

        // If the status changed from valid to invalid, update the state
        setIsVerified(valid);
        return valid;
      } else {
        console.error("Critical Error: Electron API not found.");
        setIsVerified(false);
        return false;
      }
    } catch (e) {
      console.error("License check failed:", e);
      setIsVerified(false);
      return false;
    }
  };

  useEffect(() => {
    async function initSecurity() {
      await checkSecurity();
      setIsLoading(false);
    }
    initSecurity();

    // BACKGROUND HEARTBEAT: Re-verify every 15 minutes (900,000 ms)
    const heartbeatInterval = setInterval(() => {
      checkSecurity();
    }, 900000);

    return () => clearInterval(heartbeatInterval);
  }, []);

  if (isLoading)
    return (
      <div className="flex h-screen items-center justify-center bg-gray-100 dark:bg-gray-900 text-gray-500 font-bold">
        Initialisation du système sécurisé...
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
    { id: "dashboard", label: "Tableau de bord", icon: LayoutDashboard },
    { id: "treasury", label: "Trésorerie", icon: Landmark },
    { id: "finance", label: "Finance", icon: CircleDollarSign },
    { id: "facturation", label: "Facturation", icon: FileText },
    { id: "bon-de-commande", label: "Bon de Commande", icon: ShoppingBag },
    { id: "contacts", label: "Contacts", icon: Users },
    { id: "settings", label: "Paramètres", icon: SettingsIcon },
    { id: "theme", label: "Thème", icon: Palette },
  ];

  return (
    <QueryClientProvider client={queryClient}>
      <div className="flex h-screen bg-gray-100 dark:bg-gray-900">
        <aside className="w-64 bg-white dark:bg-gray-800 shadow-md flex flex-col">
          <div className="p-6 text-2xl font-black text-blue-600">
            Facturation Pro
          </div>
          <nav className="flex-1 px-4 space-y-2">
            {menuItems.map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`flex items-center w-full px-4 py-3 text-left rounded-xl font-bold transition-all ${
                  activeTab === item.id
                    ? "bg-blue-600 text-white shadow-lg shadow-blue-500/20"
                    : "text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700"
                }`}
              >
                <item.icon className="w-5 h-5 mr-3" />
                {item.label}
              </button>
            ))}
          </nav>
        </aside>

        <main className="flex-1 overflow-y-auto">
          <div className="p-8">
            {activeTab === "dashboard" && <Dashboard />}
            {activeTab === "treasury" && <Treasury />}
            {activeTab === "finance" && <Finance />}
            {activeTab === "facturation" && <Facturation />}
            {activeTab === "bon-de-commande" && <BonDeCommande />}
            {activeTab === "contacts" && <Contacts />}
            {activeTab === "settings" && <Settings />}
            {activeTab === "theme" && <Theme />}
          </div>
        </main>
      </div>
      <Toaster position="bottom-right" />
    </QueryClientProvider>
  );
}

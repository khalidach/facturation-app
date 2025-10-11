import React from "react";
import { HashRouter as Router, Route, Routes, NavLink } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "react-hot-toast";
import Facturation from "./pages/Facturation";
import Settings from "./pages/Settings";
import { FileText, Settings as SettingsIcon } from "lucide-react";

const queryClient = new QueryClient();

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <div className="flex h-screen bg-gray-100 dark:bg-gray-900">
          <nav className="w-64 bg-white dark:bg-gray-800 p-4">
            <ul>
              <li>
                <NavLink
                  to="/"
                  className={({ isActive }) =>
                    `flex items-center p-2 text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 ${
                      isActive ? "bg-gray-200 dark:bg-gray-700" : ""
                    }`
                  }
                >
                  <FileText className="w-5 h-5 mr-3" />
                  Facturation
                </NavLink>
              </li>
              <li>
                <NavLink
                  to="/settings"
                  className={({ isActive }) =>
                    `flex items-center p-2 text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 ${
                      isActive ? "bg-gray-200 dark:bg-gray-700" : ""
                    }`
                  }
                >
                  <SettingsIcon className="w-5 h-5 mr-3" />
                  Settings
                </NavLink>
              </li>
            </ul>
          </nav>
          <main className="flex-1 p-6 overflow-auto">
            <Routes>
              <Route path="/" element={<Facturation />} />
              <Route path="/settings" element={<Settings />} />
            </Routes>
          </main>
        </div>
      </Router>
      <Toaster />
    </QueryClientProvider>
  );
}

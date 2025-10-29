import React, { useState } from "react";
import ClientManager from "@/components/contacts/ClientManager.jsx";
import SupplierManager from "@/components/contacts/SupplierManager.jsx";

export default function Contacts() {
  const [activeTab, setActiveTab] = useState("clients");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
          Contacts
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">
          Manage your clients and suppliers.
        </p>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="-mb-px flex space-x-8" aria-label="Tabs">
          <button
            onClick={() => setActiveTab("clients")}
            className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === "clients"
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            }`}
          >
            Clients
          </button>
          <button
            onClick={() => setActiveTab("suppliers")}
            className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === "suppliers"
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            }`}
          >
            Suppliers
          </button>
        </nav>
      </div>

      {/* Tab Content */}
      <div>
        {activeTab === "clients" && <ClientManager />}
        {activeTab === "suppliers" && <SupplierManager />}
      </div>
    </div>
  );
}

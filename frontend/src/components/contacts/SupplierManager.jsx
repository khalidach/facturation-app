import React from "react";
import { HardHat } from "lucide-react";

export default function SupplierManager() {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-12 text-center">
      <HardHat className="w-16 h-16 mx-auto text-yellow-500" />
      <h3 className="mt-4 text-lg font-medium text-gray-900 dark:text-gray-100">
        Supplier Management
      </h3>
      <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
        This feature is under construction.
      </p>
    </div>
  );
}

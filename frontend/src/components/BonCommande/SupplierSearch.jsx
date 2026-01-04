import React, { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";

export default function SupplierSearch({ onSupplierSelect, initialName = "" }) {
  const [searchTerm, setSearchTerm] = useState(initialName);
  const [showResults, setShowResults] = useState(false);

  const { data: searchResults } = useQuery({
    queryKey: ["supplierSearch", searchTerm],
    queryFn: () =>
      window.electronAPI.getSuppliers({
        page: 1,
        limit: 5,
        search: searchTerm,
      }),
    enabled: searchTerm.length > 0 && showResults,
  });

  const suppliers = searchResults?.data || [];

  return (
    <div className="relative">
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
        Fournisseur
      </label>
      <input
        type="text"
        value={searchTerm}
        onChange={(e) => {
          setSearchTerm(e.target.value);
          setShowResults(true);
          onSupplierSelect({ name: e.target.value });
        }}
        onFocus={() => setShowResults(true)}
        onBlur={() => setTimeout(() => setShowResults(false), 200)}
        className="input"
        placeholder="Rechercher un fournisseur..."
      />
      {showResults && suppliers.length > 0 && (
        <ul className="absolute z-10 w-full bg-white dark:bg-gray-800 border border-gray-300 rounded-md shadow-lg mt-1 max-h-60 overflow-auto">
          {suppliers.map((s) => (
            <li
              key={s.id}
              onClick={() => {
                setSearchTerm(s.name);
                onSupplierSelect(s);
                setShowResults(false);
              }}
              className="px-4 py-2 hover:bg-gray-100 cursor-pointer dark:text-white"
            >
              {s.name}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

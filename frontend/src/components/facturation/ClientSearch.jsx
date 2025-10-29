import React, { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";

// Debounce hook
function useDebounce(value, delay) {
  const [debouncedValue, setDebouncedValue] = useState(value);
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);
    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);
  return debouncedValue;
}

export default function ClientSearch({ onClientSelect, initialName = "" }) {
  const [searchTerm, setSearchTerm] = useState(initialName);
  const [showResults, setShowResults] = useState(false);
  const debouncedSearchTerm = useDebounce(searchTerm, 300);

  const { data: searchResults } = useQuery({
    queryKey: ["clientSearch", debouncedSearchTerm],
    queryFn: () =>
      window.electronAPI.getClients({
        page: 1,
        limit: 5,
        search: debouncedSearchTerm,
      }),
    enabled: debouncedSearchTerm.length > 0 && showResults,
  });

  const clients = searchResults?.data || [];

  const handleSelect = (client) => {
    setSearchTerm(client.name);
    onClientSelect(client); // Send the full client object up
    setShowResults(false);
  };

  // When initialName changes (e.g., loading an existing facture), update the search term
  useEffect(() => {
    setSearchTerm(initialName);
  }, [initialName]);

  return (
    <div className="relative">
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
        Client Name
      </label>
      <input
        type="text"
        value={searchTerm}
        onChange={(e) => {
          setSearchTerm(e.target.value);
          setShowResults(true);
          // If the user is typing, we are no longer linked to a specific client
          // but just using the text. We only send the text value on change.
          onClientSelect({
            name: e.target.value,
            address: "",
            ice: "",
          });
        }}
        onFocus={() => setShowResults(true)}
        onBlur={() => setTimeout(() => setShowResults(false), 200)} // Delay to allow click
        className="input"
        placeholder="Type to search clients..."
      />
      {showResults && clients.length > 0 && (
        <ul className="absolute z-10 w-full bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md shadow-lg mt-1 max-h-60 overflow-auto">
          {clients.map((client) => (
            <li
              key={client.id}
              onClick={() => handleSelect(client)}
              className="px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer text-gray-900 dark:text-gray-100"
            >
              {client.name}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

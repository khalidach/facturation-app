import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Plus,
  Trash2,
  Edit2,
  ArrowUpCircle,
  ArrowDownCircle,
  Wallet,
  Receipt,
  Search,
} from "lucide-react";
import { toast } from "react-hot-toast";
import Modal from "../components/Modal.jsx";
import ConfirmationModal from "../components/modal/ConfirmationModal.jsx";
import PaginationControls from "../components/PaginationControls.jsx";

export default function Finance() {
  const queryClient = useQueryClient();

  // Tab & Pagination State
  const [activeTab, setActiveTab] = useState("income"); // 'income' or 'expense'
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  // Modal & Form State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTx, setEditingTx] = useState(null);
  const [txToDelete, setTxToDelete] = useState(null);
  const [contactSearch, setContactSearch] = useState("");
  const [showContactList, setShowContactList] = useState(false);

  const [formData, setFormData] = useState({
    type: "income",
    amount: "",
    description: "",
    category: "General",
    contact_person: "",
    date: new Date().toISOString().split("T")[0],
  });

  // Debounce main search input
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchTerm);
      setCurrentPage(1); // Reset to first page on new search
    }, 300);
    return () => clearTimeout(handler);
  }, [searchTerm]);

  // Fetch Transactions based on active tab (table), page, and search
  const { data: txResponse, isLoading } = useQuery({
    queryKey: ["transactions", currentPage, activeTab, debouncedSearch],
    queryFn: () =>
      window.electronAPI.getTransactions({
        page: currentPage,
        limit: 10,
        type: activeTab,
        search: debouncedSearch,
      }),
    keepPreviousData: true,
  });

  // Fetch contacts for the searchable dropdown (Clients for income, Suppliers for expense)
  const { data: contactsData } = useQuery({
    queryKey: ["contacts-search", activeTab, contactSearch],
    queryFn: () => {
      if (!isModalOpen) return null;
      return activeTab === "income"
        ? window.electronAPI.getClients({
            page: 1,
            limit: 10,
            search: contactSearch,
          })
        : window.electronAPI.getSuppliers({
            page: 1,
            limit: 10,
            search: contactSearch,
          });
    },
    enabled: isModalOpen,
  });

  const contacts = contactsData?.data || [];

  // Sync formData when editing or switching tabs
  useEffect(() => {
    if (editingTx) {
      setFormData({
        type: activeTab, // Use current tab's type
        amount: editingTx.amount,
        description: editingTx.description,
        category: editingTx.category || "General",
        contact_person: editingTx.contact_person || "",
        date: editingTx.date,
      });
    } else {
      setFormData((prev) => ({
        ...prev,
        type: activeTab,
        amount: "",
        description: "",
        category: "General",
        contact_person: "",
        date: new Date().toISOString().split("T")[0],
      }));
    }
    setContactSearch("");
  }, [editingTx, activeTab, isModalOpen]);

  // Mutations
  const { mutate: saveTx, isPending } = useMutation({
    mutationFn: (data) => {
      if (editingTx) {
        return window.electronAPI.updateTransaction(editingTx.id, data);
      }
      return window.electronAPI.createTransaction(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
      queryClient.invalidateQueries({ queryKey: ["dashboardStats"] });
      toast.success(`Record ${editingTx ? "updated" : "saved"} successfully`);
      setIsModalOpen(false);
      setEditingTx(null);
    },
    onError: (err) => toast.error(err.message),
  });

  const { mutate: deleteTx } = useMutation({
    mutationFn: (id) =>
      window.electronAPI.deleteTransaction({ id, type: activeTab }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
      queryClient.invalidateQueries({ queryKey: ["dashboardStats"] });
      toast.success("Transaction deleted");
      setTxToDelete(null);
    },
    onError: (err) => toast.error(err.message),
  });

  const handleEditClick = (tx) => {
    setEditingTx(tx);
    setIsModalOpen(true);
  };

  const contactLabel = activeTab === "income" ? "Client" : "Supplier";

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
            Financial Records
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Optimized storage for scaling to millions of transactions.
          </p>
        </div>
        <button
          onClick={() => {
            setEditingTx(null);
            setIsModalOpen(true);
          }}
          className="flex items-center justify-center px-5 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 shadow-lg shadow-blue-500/20 transition-all transform active:scale-95"
        >
          <Plus className="w-5 h-5 mr-2" />
          New {activeTab === "income" ? "Income" : "Expense"}
        </button>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => {
              setActiveTab("income");
              setCurrentPage(1);
            }}
            className={`flex items-center whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === "income"
                ? "border-green-500 text-green-600"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            }`}
          >
            <Wallet className="w-4 h-4 mr-2" />
            Incomes (Client Side)
          </button>
          <button
            onClick={() => {
              setActiveTab("expense");
              setCurrentPage(1);
            }}
            className={`flex items-center whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === "expense"
                ? "border-red-500 text-red-600"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            }`}
          >
            <Receipt className="w-4 h-4 mr-2" />
            Expenses (Supplier Side)
          </button>
        </nav>
      </div>

      {/* Controls */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1 group">
          <input
            type="text"
            placeholder={`Search ${activeTab}s by description, category or contact...`}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="input w-full pl-10 h-11"
          />
          <Search className="absolute left-3.5 top-3.5 w-4 h-4 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
        </div>
      </div>

      {/* Data Table */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-700/50">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Description
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  {contactLabel}
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Category
                </th>
                <th className="px-6 py-4 text-right text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Amount
                </th>
                <th className="px-6 py-4 text-center text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              {isLoading ? (
                <tr>
                  <td colSpan="6" className="text-center py-20 text-gray-500">
                    Loading data from persistent storage...
                  </td>
                </tr>
              ) : txResponse?.data.length === 0 ? (
                <tr>
                  <td colSpan="6" className="text-center py-24">
                    <div className="flex flex-col items-center">
                      {activeTab === "income" ? (
                        <ArrowUpCircle className="w-12 h-12 text-gray-200 mb-3" />
                      ) : (
                        <ArrowDownCircle className="w-12 h-12 text-gray-200 mb-3" />
                      )}
                      <p className="text-gray-400 italic">
                        No {activeTab} records found.
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                txResponse?.data.map((tx) => (
                  <tr
                    key={tx.id}
                    className="hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors group"
                  >
                    <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-300">
                      {new Date(tx.date).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-sm font-medium text-gray-900 dark:text-gray-100">
                      {tx.description}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400 italic">
                      {tx.contact_person || "-"}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                      <span className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded text-xs font-medium">
                        {tx.category}
                      </span>
                    </td>
                    <td
                      className={`px-6 py-4 text-sm text-right font-bold ${
                        activeTab === "income"
                          ? "text-green-600"
                          : "text-red-600"
                      }`}
                    >
                      {activeTab === "income" ? "+" : "-"}{" "}
                      {tx.amount.toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                      })}{" "}
                      MAD
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex items-center justify-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => handleEditClick(tx)}
                          className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setTxToDelete(tx.id)}
                          className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {txResponse?.pagination.totalPages > 1 && (
          <div className="p-4 border-t border-gray-100 dark:border-gray-700">
            <PaginationControls
              currentPage={currentPage}
              totalPages={txResponse.pagination.totalPages}
              onPageChange={setCurrentPage}
            />
          </div>
        )}
      </div>

      {/* Entry Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingTx(null);
        }}
        title={
          editingTx
            ? "Update Record"
            : `Add ${activeTab === "income" ? "Income" : "Expense"}`
        }
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            saveTx(formData);
          }}
          className="space-y-5"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1.5 text-gray-700 dark:text-gray-300">
                Amount (MAD)
              </label>
              <input
                type="number"
                step="0.01"
                required
                autoFocus
                value={formData.amount}
                onChange={(e) =>
                  setFormData({ ...formData, amount: e.target.value })
                }
                className="input"
                placeholder="0.00"
              />
            </div>
            <div className="relative">
              <label className="block text-sm font-medium mb-1.5 text-gray-700 dark:text-gray-300">
                {contactLabel}
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={formData.contact_person}
                  onChange={(e) => {
                    setFormData({
                      ...formData,
                      contact_person: e.target.value,
                    });
                    setContactSearch(e.target.value);
                    setShowContactList(true);
                  }}
                  onFocus={() => setShowContactList(true)}
                  onBlur={() =>
                    setTimeout(() => setShowContactList(false), 200)
                  }
                  className="input pr-8"
                  placeholder={`Search ${contactLabel.toLowerCase()}...`}
                />
                <Search className="absolute right-2.5 top-2.5 w-4 h-4 text-gray-400" />
              </div>
              {showContactList && contacts.length > 0 && (
                <ul className="absolute z-[60] w-full mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-xl max-h-40 overflow-auto">
                  {contacts.map((c) => (
                    <li
                      key={c.id}
                      onClick={() => {
                        setFormData({ ...formData, contact_person: c.name });
                        setShowContactList(false);
                      }}
                      className="px-4 py-2 hover:bg-blue-50 dark:hover:bg-blue-900/20 cursor-pointer text-sm"
                    >
                      {c.name}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5 text-gray-700 dark:text-gray-300">
              Description
            </label>
            <input
              type="text"
              required
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              className="input"
              placeholder={`e.g. ${
                activeTab === "income" ? "Service Payment" : "Office Supplies"
              }`}
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1.5 text-gray-700 dark:text-gray-300">
                Category
              </label>
              <input
                type="text"
                value={formData.category}
                onChange={(e) =>
                  setFormData({ ...formData, category: e.target.value })
                }
                className="input"
                placeholder="General, Travel, Utilities..."
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5 text-gray-700 dark:text-gray-300">
                Date
              </label>
              <input
                type="date"
                required
                value={formData.date}
                onChange={(e) =>
                  setFormData({ ...formData, date: e.target.value })
                }
                className="input"
              />
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-6 border-t dark:border-gray-700">
            <button
              type="button"
              onClick={() => {
                setIsModalOpen(false);
                setEditingTx(null);
              }}
              className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isPending}
              className={`px-8 py-2 text-white font-semibold rounded-lg shadow-md transition-all ${
                activeTab === "income"
                  ? "bg-green-600 hover:bg-green-700"
                  : "bg-red-600 hover:bg-red-700"
              }`}
            >
              {isPending
                ? "Processing..."
                : editingTx
                ? "Update"
                : "Save Entry"}
            </button>
          </div>
        </form>
      </Modal>

      <ConfirmationModal
        isOpen={!!txToDelete}
        onClose={() => setTxToDelete(null)}
        onConfirm={() => deleteTx(txToDelete)}
        title="Confirm Deletion"
        message="Are you sure you want to permanently remove this transaction? This cannot be undone."
      />
    </div>
  );
}

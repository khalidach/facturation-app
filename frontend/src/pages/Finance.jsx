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
} from "lucide-react";
import { toast } from "react-hot-toast";
import Modal from "../components/Modal.jsx";
import ConfirmationModal from "../components/modal/ConfirmationModal.jsx";
import PaginationControls from "../components/PaginationControls.jsx";

export default function Finance() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("income"); // 'income' or 'expense'
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTx, setEditingTx] = useState(null); // Tracks transaction being edited
  const [txToDelete, setTxToDelete] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  // Debounce search
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchTerm);
      setCurrentPage(1);
    }, 300);
    return () => clearTimeout(handler);
  }, [searchTerm]);

  const [formData, setFormData] = useState({
    type: "income",
    amount: "",
    description: "",
    category: "General",
    date: new Date().toISOString().split("T")[0],
  });

  // Effect to sync formData when editingTx changes or modal closes/opens
  useEffect(() => {
    if (editingTx) {
      setFormData({
        type: editingTx.type,
        amount: editingTx.amount,
        description: editingTx.description,
        category: editingTx.category || "General",
        date: editingTx.date,
      });
    } else {
      setFormData((prev) => ({
        ...prev,
        type: activeTab,
        amount: "",
        description: "",
        category: "General",
        date: new Date().toISOString().split("T")[0],
      }));
    }
  }, [editingTx, activeTab, isModalOpen]);

  const { data: txResponse, isLoading } = useQuery({
    queryKey: ["transactions", currentPage, activeTab, debouncedSearch],
    queryFn: () =>
      window.electronAPI.getTransactions({
        page: currentPage,
        limit: 10,
        type: activeTab,
        search: debouncedSearch,
      }),
  });

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
    mutationFn: window.electronAPI.deleteTransaction,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
      queryClient.invalidateQueries({ queryKey: ["dashboardStats"] });
      toast.success("Transaction deleted");
      setTxToDelete(null);
    },
  });

  const handleOpenModal = () => {
    setEditingTx(null);
    setIsModalOpen(true);
  };

  const handleEditClick = (tx) => {
    setEditingTx(tx);
    setIsModalOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
            Financial Records
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Manage your income and business expenses.
          </p>
        </div>
        <button
          onClick={handleOpenModal}
          className="flex items-center justify-center px-5 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 shadow-lg shadow-blue-500/20 transition-all"
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
            Incomes
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
            Expenses
          </button>
        </nav>
      </div>

      {/* Controls */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <input
            type="text"
            placeholder={`Search ${activeTab}s by description...`}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="input w-full pl-4"
          />
        </div>
      </div>

      {/* Data Table */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
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
                <td colSpan="5" className="text-center py-10 text-gray-500">
                  Loading data...
                </td>
              </tr>
            ) : txResponse?.data.length === 0 ? (
              <tr>
                <td colSpan="5" className="text-center py-20">
                  <div className="flex flex-col items-center">
                    {activeTab === "income" ? (
                      <ArrowUpCircle className="w-12 h-12 text-gray-200 mb-2" />
                    ) : (
                      <ArrowDownCircle className="w-12 h-12 text-gray-200 mb-2" />
                    )}
                    <p className="text-gray-400 italic">
                      No {activeTab}s found matching your search.
                    </p>
                  </div>
                </td>
              </tr>
            ) : (
              txResponse?.data.map((tx) => (
                <tr
                  key={tx.id}
                  className="hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors"
                >
                  <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-300">
                    {new Date(tx.date).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 text-sm font-medium text-gray-900 dark:text-gray-100">
                    {tx.description}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                    {tx.category}
                  </td>
                  <td
                    className={`px-6 py-4 text-sm text-right font-bold ${
                      tx.type === "income" ? "text-green-600" : "text-red-600"
                    }`}
                  >
                    {tx.type === "income" ? "+" : "-"}{" "}
                    {tx.amount.toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                    })}{" "}
                    MAD
                  </td>
                  <td className="px-6 py-4 text-center">
                    <div className="flex items-center justify-center space-x-1">
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

        {txResponse?.pagination.totalPages > 1 && (
          <div className="p-4 border-t dark:border-gray-700">
            <PaginationControls
              currentPage={currentPage}
              totalPages={txResponse.pagination.totalPages}
              onPageChange={setCurrentPage}
            />
          </div>
        )}
      </div>

      {/* Add/Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingTx(null);
        }}
        title={
          editingTx
            ? "Edit Financial Record"
            : `Record New ${activeTab === "income" ? "Income" : "Expense"}`
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
                Type
              </label>
              <select
                value={formData.type}
                onChange={(e) =>
                  setFormData({ ...formData, type: e.target.value })
                }
                className="input"
              >
                <option value="income">Income (Cash In)</option>
                <option value="expense">Expense (Cash Out)</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5 text-gray-700 dark:text-gray-300">
                Amount (MAD)
              </label>
              <input
                type="number"
                step="0.01"
                required
                value={formData.amount}
                onChange={(e) =>
                  setFormData({ ...formData, amount: e.target.value })
                }
                className="input"
                placeholder="0.00"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5 text-gray-700 dark:text-gray-300">
              Description
            </label>
            <input
              type="text"
              required
              placeholder={
                activeTab === "income"
                  ? "e.g. Flight Ticket Sale"
                  : "e.g. Office Rent or Airline Payment"
              }
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              className="input"
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
          <div className="flex justify-end gap-3 pt-4 border-t dark:border-gray-700">
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
              className={`px-6 py-2 text-white rounded-lg shadow-sm transition-all ${
                formData.type === "income"
                  ? "bg-green-600 hover:bg-green-700"
                  : "bg-red-600 hover:bg-red-700"
              }`}
            >
              {isPending
                ? "Saving..."
                : editingTx
                ? "Update Record"
                : `Save ${activeTab}`}
            </button>
          </div>
        </form>
      </Modal>

      <ConfirmationModal
        isOpen={!!txToDelete}
        onClose={() => setTxToDelete(null)}
        onConfirm={() => deleteTx(txToDelete)}
        title="Confirm Deletion"
        message="Are you sure you want to permanently delete this financial record?"
      />
    </div>
  );
}

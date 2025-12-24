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
  CreditCard,
  Banknote,
  Landmark,
  CheckSquare,
} from "lucide-react";
import { toast } from "react-hot-toast";
import Modal from "../components/Modal.jsx";
import ConfirmationModal from "../components/modal/ConfirmationModal.jsx";
import PaginationControls from "../components/PaginationControls.jsx";

export default function Finance() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("income");
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
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
    payment_method: "cash",
    is_cashed: true,
    in_bank: false,
  });

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchTerm);
      setCurrentPage(1);
    }, 300);
    return () => clearTimeout(handler);
  }, [searchTerm]);

  const { data: txResponse, isLoading } = useQuery({
    queryKey: ["transactions", currentPage, activeTab, debouncedSearch],
    queryFn: () =>
      window.electronAPI.getTransactions({
        page: currentPage,
        limit: 10,
        type: activeTab,
        search: debouncedSearch,
      }),
    placeholderData: (p) => p,
  });

  const { data: contactsData } = useQuery({
    queryKey: ["contacts-search", activeTab, contactSearch],
    queryFn: () => {
      if (!isModalOpen) return null;
      const api =
        activeTab === "income"
          ? window.electronAPI.getClients
          : window.electronAPI.getSuppliers;
      return api({ page: 1, limit: 10, search: contactSearch });
    },
    enabled: isModalOpen,
  });

  const contacts = contactsData?.data || [];

  useEffect(() => {
    if (editingTx) {
      setFormData({
        type: activeTab,
        amount: editingTx.amount,
        description: editingTx.description,
        category: editingTx.category || "General",
        contact_person: editingTx.contact_person || "",
        date: editingTx.date,
        payment_method: editingTx.payment_method || "cash",
        is_cashed: editingTx.is_cashed === 1,
        in_bank: editingTx.in_bank === 1,
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
        payment_method: "cash",
        is_cashed: true,
        in_bank: false,
      }));
    }
  }, [editingTx, activeTab, isModalOpen]);

  const { mutate: saveTx, isPending } = useMutation({
    mutationFn: (data) =>
      editingTx
        ? window.electronAPI.updateTransaction(editingTx.id, data)
        : window.electronAPI.createTransaction(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
      queryClient.invalidateQueries({ queryKey: ["treasuryStats"] });
      toast.success(`Record ${editingTx ? "updated" : "saved"}`);
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
      queryClient.invalidateQueries({ queryKey: ["treasuryStats"] });
      toast.success("Deleted");
      setTxToDelete(null);
    },
  });

  const getPaymentIcon = (method) => {
    switch (method) {
      case "virement":
        return <Landmark className="w-4 h-4" />;
      case "cheque":
        return <CheckSquare className="w-4 h-4" />;
      case "versement":
        return <CreditCard className="w-4 h-4" />;
      default:
        return <Banknote className="w-4 h-4" />;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
            Financial Records
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Track payments and manage cash flow.
          </p>
        </div>
        <button
          onClick={() => {
            setEditingTx(null);
            setIsModalOpen(true);
          }}
          className="btn-primary"
        >
          <Plus className="w-5 h-5 mr-2" /> New{" "}
          {activeTab === "income" ? "Income" : "Expense"}
        </button>
      </div>

      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab("income")}
            className={`tab-btn ${
              activeTab === "income" ? "active-tab-green" : ""
            }`}
          >
            <ArrowUpCircle className="w-4 h-4 mr-2" /> Incomes
          </button>
          <button
            onClick={() => setActiveTab("expense")}
            className={`tab-btn ${
              activeTab === "expense" ? "active-tab-red" : ""
            }`}
          >
            <ArrowDownCircle className="w-4 h-4 mr-2" /> Expenses
          </button>
        </nav>
      </div>

      <div className="relative flex-1 group">
        <input
          type="text"
          placeholder="Search..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="input w-full pl-10"
        />
        <Search className="absolute left-3.5 top-3.5 w-4 h-4 text-gray-400" />
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-gray-50 dark:bg-gray-700/50">
            <tr className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
              <th className="px-6 py-4">Date</th>
              <th className="px-6 py-4">Description</th>
              <th className="px-6 py-4">Payment</th>
              <th className="px-6 py-4">Status</th>
              <th className="px-6 py-4 text-right">Amount</th>
              <th className="px-6 py-4 text-center">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y dark:divide-gray-700">
            {txResponse?.data.map((tx) => (
              <tr
                key={tx.id}
                className="hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors group"
              >
                <td className="px-6 py-4 text-sm">
                  {new Date(tx.date).toLocaleDateString()}
                </td>
                <td className="px-6 py-4">
                  <div className="font-medium text-gray-900 dark:text-white">
                    {tx.description}
                  </div>
                  <div className="text-xs text-gray-400 italic">
                    {tx.contact_person || "-"}
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center text-sm gap-2 capitalize">
                    {getPaymentIcon(tx.payment_method)}
                    {tx.payment_method}
                  </div>
                </td>
                <td className="px-6 py-4">
                  {tx.payment_method === "cheque" ? (
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        tx.is_cashed
                          ? "bg-green-100 text-green-700"
                          : "bg-yellow-100 text-yellow-700"
                      }`}
                    >
                      {tx.is_cashed ? "CASHED" : "PENDING"}
                    </span>
                  ) : (
                    <span className="text-gray-300 text-[10px]">—</span>
                  )}
                </td>
                <td
                  className={`px-6 py-4 text-sm text-right font-bold ${
                    activeTab === "income" ? "text-green-600" : "text-red-600"
                  }`}
                >
                  {tx.amount.toLocaleString()} MAD
                </td>
                <td className="px-6 py-4 text-center">
                  <div className="flex justify-center space-x-1">
                    <button
                      onClick={() => {
                        setEditingTx(tx);
                        setIsModalOpen(true);
                      }}
                      className="p-2 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setTxToDelete(tx.id)}
                      className="p-2 hover:bg-red-50 dark:hover:bg-red-900/20 rounded"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {txResponse?.pagination.totalPages > 1 && (
          <div className="p-4 border-t">
            <PaginationControls
              currentPage={currentPage}
              totalPages={txResponse.pagination.totalPages}
              onPageChange={setCurrentPage}
            />
          </div>
        )}
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingTx(null);
        }}
        title={editingTx ? "Edit Entry" : "New Entry"}
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            saveTx(formData);
          }}
          className="space-y-4"
        >
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Amount (MAD)</label>
              <input
                type="number"
                step="0.01"
                required
                value={formData.amount}
                onChange={(e) =>
                  setFormData({ ...formData, amount: e.target.value })
                }
                className="input"
              />
            </div>
            <div>
              <label className="label">Date</label>
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
          <div>
            <label className="label">Description</label>
            <input
              type="text"
              required
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              className="input"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Payment Method</label>
              <select
                value={formData.payment_method}
                onChange={(e) =>
                  setFormData({ ...formData, payment_method: e.target.value })
                }
                className="input"
              >
                <option value="cash">Cash (Caisse)</option>
                <option value="virement">Virement (Bank)</option>
                <option value="cheque">Chèque (Bank)</option>
                <option value="versement">Versement (Bank)</option>
              </select>
            </div>
            <div>
              <label className="label">Category</label>
              <input
                type="text"
                value={formData.category}
                onChange={(e) =>
                  setFormData({ ...formData, category: e.target.value })
                }
                className="input"
              />
            </div>
          </div>

          {formData.payment_method === "cheque" && (
            <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-xl flex items-center justify-between">
              <span className="text-sm font-semibold">Check Status</span>
              <div className="flex gap-4">
                <label className="flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.is_cashed}
                    onChange={(e) =>
                      setFormData({ ...formData, is_cashed: e.target.checked })
                    }
                    className="mr-2"
                  />
                  <span className="text-sm">Is Cashed?</span>
                </label>
                <label className="flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.in_bank}
                    onChange={(e) =>
                      setFormData({ ...formData, in_bank: e.target.checked })
                    }
                    className="mr-2"
                  />
                  <span className="text-sm">In Bank?</span>
                </label>
              </div>
            </div>
          )}

          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 border rounded-lg"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isPending}
              className={`px-6 py-2 text-white rounded-lg ${
                activeTab === "income" ? "bg-green-600" : "bg-red-600"
              }`}
            >
              {isPending ? "Saving..." : "Save Entry"}
            </button>
          </div>
        </form>
      </Modal>

      <ConfirmationModal
        isOpen={!!txToDelete}
        onClose={() => setTxToDelete(null)}
        onConfirm={() => deleteTx(txToDelete)}
        title="Delete Record"
        message="Permanent removal. Proceed?"
      />
    </div>
  );
}

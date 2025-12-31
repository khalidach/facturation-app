import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Landmark,
  Banknote,
  ArrowLeftRight,
  History,
  TrendingUp,
  TrendingDown,
  Clock,
  Plus,
  Minus,
  Trash2,
} from "lucide-react";
import { toast } from "react-hot-toast";
import Modal from "@/components/Modal.jsx";
import PaginationControls from "@/components/PaginationControls.jsx";
import ConfirmationModal from "@/components/modal/ConfirmationModal.jsx";

export default function Treasury() {
  const queryClient = useQueryClient();
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  const [isAddBalanceModalOpen, setIsAddBalanceModalOpen] = useState(false);
  const [isRemoveBalanceModalOpen, setIsRemoveBalanceModalOpen] =
    useState(false);
  const [transferToDelete, setTransferToDelete] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);

  const [formData, setFormData] = useState({
    amount: "",
    from_account: "caisse",
    to_account: "banque",
    date: new Date().toISOString().split("T")[0],
    description: "Virement interne",
  });

  const [addBalanceData, setAddBalanceData] = useState({
    amount: "",
    account: "banque",
    date: new Date().toISOString().split("T")[0],
    description: "Dépôt initial / Ajout manuel",
  });

  const [removeBalanceData, setRemoveBalanceData] = useState({
    amount: "",
    account: "banque",
    date: new Date().toISOString().split("T")[0],
    description: "Correction / Retrait manuel",
  });

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ["treasuryStats"],
    queryFn: () => window.electronAPI.getTreasuryStats(),
  });

  const { data: transfersData, isLoading: transLoading } = useQuery({
    queryKey: ["transfers", currentPage],
    queryFn: () =>
      window.electronAPI.getTransfers({ page: currentPage, limit: 10 }),
  });

  const { mutate: createTransfer, isPending } = useMutation({
    mutationFn: (data) => window.electronAPI.createTransfer(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["treasuryStats"] });
      queryClient.invalidateQueries({ queryKey: ["transfers"] });
      toast.success("Transfer completed successfully");
      setIsTransferModalOpen(false);
      setFormData({ ...formData, amount: "" });
    },
  });

  const { mutate: deleteTransfer } = useMutation({
    mutationFn: (id) => window.electronAPI.deleteTransfer(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["treasuryStats"] });
      queryClient.invalidateQueries({ queryKey: ["transfers"] });
      toast.success("Transfer deleted successfully");
      setTransferToDelete(null);
    },
    onError: (err) => toast.error(err.message),
  });

  const { mutate: addBalance, isPending: isAddingBalance } = useMutation({
    mutationFn: (data) => {
      const transaction = {
        amount: parseFloat(data.amount),
        description: data.description,
        category: "Treasury Adjustment",
        contact_person: "Manual Adjustment",
        date: data.date,
        payment_method: data.account === "banque" ? "virement" : "cash",
        is_cashed: true,
        in_bank: data.account === "banque",
        type: "income",
      };
      return window.electronAPI.createTransaction(transaction);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["treasuryStats"] });
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
      toast.success("Balance added successfully");
      setIsAddBalanceModalOpen(false);
      setAddBalanceData({ ...addBalanceData, amount: "" });
    },
    onError: (err) => toast.error(err.message),
  });

  const { mutate: removeBalance, isPending: isRemovingBalance } = useMutation({
    mutationFn: (data) => {
      const transaction = {
        amount: parseFloat(data.amount),
        description: data.description,
        category: "Treasury Adjustment",
        contact_person: "Manual Adjustment",
        date: data.date,
        payment_method: data.account === "banque" ? "virement" : "cash",
        is_cashed: true,
        in_bank: data.account === "banque",
        type: "expense",
      };
      return window.electronAPI.createTransaction(transaction);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["treasuryStats"] });
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
      toast.success("Balance removed successfully");
      setIsRemoveBalanceModalOpen(false);
      setRemoveBalanceData({ ...removeBalanceData, amount: "" });
    },
    onError: (err) => toast.error(err.message),
  });

  const handleSwitch = () => {
    setFormData((prev) => ({
      ...prev,
      from_account: prev.to_account,
      to_account: prev.from_account,
    }));
  };

  const handleTransferSubmit = (e) => {
    e.preventDefault();
    const amount = parseFloat(formData.amount);
    const sourceBalance = stats?.[formData.from_account] || 0;

    if (amount <= 0) return toast.error("Invalid amount");
    if (amount > sourceBalance) {
      return toast.error(`Insufficient funds in ${formData.from_account}`);
    }

    createTransfer(formData);
  };

  const handleAddBalanceSubmit = (e) => {
    e.preventDefault();
    if (parseFloat(addBalanceData.amount) <= 0)
      return toast.error("Invalid amount");
    addBalance(addBalanceData);
  };

  const handleRemoveBalanceSubmit = (e) => {
    e.preventDefault();
    const amount = parseFloat(removeBalanceData.amount);
    const currentBalance = stats?.[removeBalanceData.account] || 0;

    if (amount <= 0) return toast.error("Invalid amount");
    if (amount > currentBalance) {
      return toast.error(
        `Cannot remove more than available in ${removeBalanceData.account}`
      );
    }
    removeBalance(removeBalanceData);
  };

  const currentSourceBalance = stats?.[formData.from_account] || 0;
  const isAmountValid =
    parseFloat(formData.amount) > 0 &&
    parseFloat(formData.amount) <= currentSourceBalance;

  return (
    <div className="space-y-8 p-4">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-4xl font-black text-gray-900 dark:text-white tracking-tight">
            Treasury
          </h1>
          <p className="text-gray-500 font-medium">
            Manage your cash flow and internal movements.
          </p>
        </div>
        <div className="flex flex-wrap gap-3 w-full md:w-auto">
          <button
            onClick={() => setIsRemoveBalanceModalOpen(true)}
            className="flex-1 md:flex-none bg-rose-600 text-white px-6 py-3 rounded-2xl font-bold flex items-center justify-center hover:bg-rose-700 transition-all shadow-lg shadow-rose-500/20"
          >
            <Minus className="w-5 h-5 mr-2" /> Remove Balance
          </button>
          <button
            onClick={() => setIsAddBalanceModalOpen(true)}
            className="flex-1 md:flex-none bg-emerald-600 text-white px-6 py-3 rounded-2xl font-bold flex items-center justify-center hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-500/20"
          >
            <Plus className="w-5 h-5 mr-2" /> Add Balance
          </button>
          <button
            onClick={() => setIsTransferModalOpen(true)}
            className="flex-1 md:flex-none bg-blue-600 text-white px-6 py-3 rounded-2xl font-bold flex items-center justify-center hover:bg-blue-700 transition-all shadow-lg shadow-blue-500/20"
          >
            <ArrowLeftRight className="w-5 h-5 mr-2" /> Internal Transfer
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-gradient-to-br from-indigo-600 to-blue-700 p-8 rounded-[2.5rem] text-white shadow-xl relative overflow-hidden group">
          <Landmark className="absolute -right-4 -bottom-4 w-32 h-32 opacity-10 group-hover:scale-110 transition-transform" />
          <p className="text-blue-100 font-bold uppercase tracking-widest text-[10px]">
            Compte Bancaire
          </p>
          <h2 className="text-4xl font-black mt-4">
            {statsLoading ? "..." : stats?.banque.toLocaleString()}{" "}
            <span className="text-xl">MAD</span>
          </h2>
          <div className="mt-8 flex items-center gap-2 text-blue-100 text-xs font-semibold">
            <TrendingUp className="w-4 h-4" /> Real-time Bank liquidity
          </div>
        </div>

        <div className="bg-gradient-to-br from-emerald-600 to-teal-700 p-8 rounded-[2.5rem] text-white shadow-xl relative overflow-hidden group">
          <Banknote className="absolute -right-4 -bottom-4 w-32 h-32 opacity-10 group-hover:scale-110 transition-transform" />
          <p className="text-emerald-100 font-bold uppercase tracking-widest text-[10px]">
            Caisse (Cash)
          </p>
          <h2 className="text-4xl font-black mt-4">
            {statsLoading ? "..." : stats?.caisse.toLocaleString()}{" "}
            <span className="text-xl">MAD</span>
          </h2>
          <div className="mt-8 flex items-center gap-2 text-emerald-100 text-xs font-semibold">
            <TrendingDown className="w-4 h-4" /> Physical cash on hand
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 p-8 rounded-[2.5rem] shadow-sm flex flex-col justify-center">
          <p className="text-gray-400 font-bold uppercase tracking-widest text-[10px]">
            Outstanding Checks
          </p>
          <h2 className="text-3xl font-black text-gray-900 dark:text-white mt-4">
            {statsLoading ? "..." : stats?.pendingChecks.toLocaleString()}{" "}
            <span className="text-lg">MAD</span>
          </h2>
          <p className="text-gray-400 text-[10px] mt-4 flex items-center">
            <Clock className="w-3 h-3 mr-1" /> Payments not yet cashed
          </p>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-[2.5rem] shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
        <div className="p-8 border-b border-gray-50 dark:border-gray-700 flex items-center justify-between">
          <h3 className="text-xl font-black flex items-center">
            <History className="w-5 h-5 mr-2 text-blue-600" /> Transfer Ledger
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-50 dark:bg-gray-700/30 text-xs font-bold uppercase text-gray-400">
              <tr>
                <th className="px-8 py-4">Date</th>
                <th className="px-8 py-4">Movement</th>
                <th className="px-8 py-4">Description</th>
                <th className="px-8 py-4 text-right">Amount</th>
                <th className="px-8 py-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 dark:divide-gray-700">
              {transfersData?.data.map((t) => (
                <tr
                  key={t.id}
                  className="hover:bg-gray-50 dark:hover:bg-gray-700/20 group"
                >
                  <td className="px-8 py-4 text-sm font-medium">
                    {new Date(t.date).toLocaleDateString()}
                  </td>
                  <td className="px-8 py-4">
                    <div className="flex items-center gap-3">
                      <span className="capitalize font-bold text-xs px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded-lg">
                        {t.from_account}
                      </span>
                      <ArrowLeftRight className="w-3 h-3 text-gray-400" />
                      <span className="capitalize font-bold text-xs px-2 py-1 bg-blue-50 text-blue-600 dark:bg-blue-900/20 rounded-lg">
                        {t.to_account}
                      </span>
                    </div>
                  </td>
                  <td className="px-8 py-4 text-sm text-gray-500">
                    {t.description}
                  </td>
                  <td className="px-8 py-4 text-right font-black text-gray-900 dark:text-white">
                    {t.amount.toLocaleString()} MAD
                  </td>
                  <td className="px-8 py-4 text-center">
                    <button
                      onClick={() => setTransferToDelete(t.id)}
                      className="p-2 text-gray-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-xl transition-all"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
              {transfersData?.data.length === 0 && (
                <tr>
                  <td
                    colSpan={5}
                    className="p-12 text-center text-gray-400 italic"
                  >
                    No transfer history found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
          <div className="p-6">
            <PaginationControls
              currentPage={currentPage}
              totalPages={transfersData?.pagination.totalPages || 1}
              onPageChange={setCurrentPage}
            />
          </div>
        </div>
      </div>

      <Modal
        isOpen={isTransferModalOpen}
        onClose={() => setIsTransferModalOpen(false)}
        title="Internal Transfer"
      >
        <form onSubmit={handleTransferSubmit} className="space-y-6">
          <div className="bg-gray-50 dark:bg-gray-700/30 p-6 rounded-2xl flex items-center justify-between gap-4">
            <div className="flex-1 text-center">
              <p className="text-[10px] font-black uppercase text-gray-400 mb-2">
                From
              </p>
              <div className="bg-white dark:bg-gray-800 p-3 rounded-xl shadow-sm font-bold capitalize border border-blue-200">
                {formData.from_account}
              </div>
              <p
                className={`text-[10px] mt-2 font-bold ${
                  currentSourceBalance <= 0 ? "text-red-500" : "text-gray-400"
                }`}
              >
                Balance: {currentSourceBalance.toLocaleString()} MAD
              </p>
            </div>

            <button
              type="button"
              onClick={handleSwitch}
              className="mt-6 p-3 bg-white dark:bg-gray-800 rounded-full shadow-lg hover:rotate-180 transition-all duration-500"
            >
              <ArrowLeftRight className="w-5 h-5 text-blue-600" />
            </button>

            <div className="flex-1 text-center">
              <p className="text-[10px] font-black uppercase text-gray-400 mb-2">
                To
              </p>
              <div className="bg-white dark:bg-gray-800 p-3 rounded-xl shadow-sm font-bold capitalize border border-blue-200">
                {formData.to_account}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-black uppercase text-gray-400 block mb-2">
                Amount
              </label>
              <input
                type="number"
                step="0.01"
                required
                className={`input text-lg font-bold ${
                  parseFloat(formData.amount) > currentSourceBalance
                    ? "border-red-500 focus:ring-red-500"
                    : ""
                }`}
                value={formData.amount}
                onChange={(e) =>
                  setFormData({ ...formData, amount: e.target.value })
                }
              />
              {parseFloat(formData.amount) > currentSourceBalance && (
                <p className="text-[10px] text-red-500 font-bold mt-1">
                  Insufficient funds
                </p>
              )}
            </div>
            <div>
              <label className="text-xs font-black uppercase text-gray-400 block mb-2">
                Date
              </label>
              <input
                type="date"
                required
                className="input font-bold"
                value={formData.date}
                onChange={(e) =>
                  setFormData({ ...formData, date: e.target.value })
                }
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-black uppercase text-gray-400 block mb-2">
              Description / Note
            </label>
            <input
              type="text"
              className="input"
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
            />
          </div>

          <button
            type="submit"
            disabled={isPending || !isAmountValid}
            className="w-full bg-blue-600 text-white py-4 rounded-2xl font-black text-lg hover:bg-blue-700 disabled:bg-gray-300 transition-all shadow-lg"
          >
            {isPending
              ? "Processing..."
              : currentSourceBalance <= 0
              ? "Insufficient Funds"
              : "Confirm Transfer"}
          </button>
        </form>
      </Modal>

      <Modal
        isOpen={isAddBalanceModalOpen}
        onClose={() => setIsAddBalanceModalOpen(false)}
        title="Add Account Balance"
      >
        <form onSubmit={handleAddBalanceSubmit} className="space-y-6">
          <div className="bg-gray-50 dark:bg-gray-700/30 p-4 rounded-2xl grid grid-cols-2 gap-4">
            <button
              type="button"
              onClick={() =>
                setAddBalanceData({ ...addBalanceData, account: "banque" })
              }
              className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${
                addBalanceData.account === "banque"
                  ? "border-blue-500 bg-white dark:bg-gray-800"
                  : "border-transparent opacity-50"
              }`}
            >
              <Landmark className="w-6 h-6 text-blue-600" />
              <span className="font-bold text-sm">Banque</span>
            </button>
            <button
              type="button"
              onClick={() =>
                setAddBalanceData({ ...addBalanceData, account: "caisse" })
              }
              className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${
                addBalanceData.account === "caisse"
                  ? "border-emerald-500 bg-white dark:bg-gray-800"
                  : "border-transparent opacity-50"
              }`}
            >
              <Banknote className="w-6 h-6 text-emerald-600" />
              <span className="font-bold text-sm">Caisse</span>
            </button>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-black uppercase text-gray-400 block mb-2">
                Amount to Add
              </label>
              <input
                type="number"
                step="0.01"
                required
                placeholder="0.00"
                className="input text-lg font-bold"
                value={addBalanceData.amount}
                onChange={(e) =>
                  setAddBalanceData({
                    ...addBalanceData,
                    amount: e.target.value,
                  })
                }
              />
            </div>
            <div>
              <label className="text-xs font-black uppercase text-gray-400 block mb-2">
                Date
              </label>
              <input
                type="date"
                required
                className="input font-bold"
                value={addBalanceData.date}
                onChange={(e) =>
                  setAddBalanceData({ ...addBalanceData, date: e.target.value })
                }
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-black uppercase text-gray-400 block mb-2">
              Reason / Source
            </label>
            <input
              type="text"
              placeholder="e.g. Dépôt initial"
              className="input"
              value={addBalanceData.description}
              onChange={(e) =>
                setAddBalanceData({
                  ...addBalanceData,
                  description: e.target.value,
                })
              }
            />
          </div>

          <button
            type="submit"
            disabled={isAddingBalance || !addBalanceData.amount}
            className="w-full bg-emerald-600 text-white py-4 rounded-2xl font-black text-lg hover:bg-emerald-700 disabled:bg-gray-300 transition-all shadow-lg"
          >
            {isAddingBalance ? "Saving..." : "Confirm Deposit"}
          </button>
        </form>
      </Modal>

      <Modal
        isOpen={isRemoveBalanceModalOpen}
        onClose={() => setIsRemoveBalanceModalOpen(false)}
        title="Remove Account Balance"
      >
        <form onSubmit={handleRemoveBalanceSubmit} className="space-y-6">
          <div className="bg-gray-50 dark:bg-gray-700/30 p-4 rounded-2xl grid grid-cols-2 gap-4">
            <button
              type="button"
              onClick={() =>
                setRemoveBalanceData({
                  ...removeBalanceData,
                  account: "banque",
                })
              }
              className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${
                removeBalanceData.account === "banque"
                  ? "border-rose-500 bg-white dark:bg-gray-800"
                  : "border-transparent opacity-50"
              }`}
            >
              <Landmark className="w-6 h-6 text-rose-600" />
              <span className="font-bold text-sm">Banque</span>
            </button>
            <button
              type="button"
              onClick={() =>
                setRemoveBalanceData({
                  ...removeBalanceData,
                  account: "caisse",
                })
              }
              className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${
                removeBalanceData.account === "caisse"
                  ? "border-rose-500 bg-white dark:bg-gray-800"
                  : "border-transparent opacity-50"
              }`}
            >
              <Banknote className="w-6 h-6 text-rose-600" />
              <span className="font-bold text-sm">Caisse</span>
            </button>
          </div>

          <div className="text-center">
            <p className="text-xs font-bold text-gray-400 uppercase">
              Available Balance
            </p>
            <p className="text-xl font-black text-rose-600">
              {(stats?.[removeBalanceData.account] || 0).toLocaleString()} MAD
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-black uppercase text-gray-400 block mb-2">
                Amount to Remove
              </label>
              <input
                type="number"
                step="0.01"
                required
                placeholder="0.00"
                className={`input text-lg font-bold ${
                  parseFloat(removeBalanceData.amount) >
                  (stats?.[removeBalanceData.account] || 0)
                    ? "border-rose-500 focus:ring-rose-500"
                    : ""
                }`}
                value={removeBalanceData.amount}
                onChange={(e) =>
                  setRemoveBalanceData({
                    ...removeBalanceData,
                    amount: e.target.value,
                  })
                }
              />
              {parseFloat(removeBalanceData.amount) >
                (stats?.[removeBalanceData.account] || 0) && (
                <p className="text-[10px] text-rose-500 font-bold mt-1">
                  Exceeds available balance
                </p>
              )}
            </div>
            <div>
              <label className="text-xs font-black uppercase text-gray-400 block mb-2">
                Date
              </label>
              <input
                type="date"
                required
                className="input font-bold"
                value={removeBalanceData.date}
                onChange={(e) =>
                  setRemoveBalanceData({
                    ...removeBalanceData,
                    date: e.target.value,
                  })
                }
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-black uppercase text-gray-400 block mb-2">
              Reason / Reference
            </label>
            <input
              type="text"
              placeholder="e.g. Correction d'erreur"
              className="input"
              value={removeBalanceData.description}
              onChange={(e) =>
                setRemoveBalanceData({
                  ...removeBalanceData,
                  description: e.target.value,
                })
              }
            />
          </div>

          <button
            type="submit"
            disabled={
              isRemovingBalance ||
              !removeBalanceData.amount ||
              parseFloat(removeBalanceData.amount) >
                (stats?.[removeBalanceData.account] || 0)
            }
            className="w-full bg-rose-600 text-white py-4 rounded-2xl font-black text-lg hover:bg-rose-700 disabled:bg-gray-300 transition-all shadow-lg"
          >
            {isRemovingBalance ? "Processing..." : "Confirm Removal"}
          </button>
        </form>
      </Modal>

      <ConfirmationModal
        isOpen={!!transferToDelete}
        onClose={() => setTransferToDelete(null)}
        onConfirm={() => deleteTransfer(transferToDelete)}
        title="Delete Transfer"
        message="Are you sure you want to delete this internal transfer entry? This will update your account balances immediately."
      />
    </div>
  );
}

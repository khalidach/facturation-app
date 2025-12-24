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
} from "lucide-react";
import { toast } from "react-hot-toast";
import Modal from "../components/Modal.jsx";
import PaginationControls from "../components/PaginationControls.jsx";

export default function Treasury() {
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [formData, setFormData] = useState({
    amount: "",
    from_account: "caisse",
    to_account: "banque",
    date: new Date().toISOString().split("T")[0],
    description: "Virement interne",
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
      setIsModalOpen(false);
      setFormData({ ...formData, amount: "" });
    },
  });

  const handleSwitch = () => {
    setFormData((prev) => ({
      ...prev,
      from_account: prev.to_account,
      to_account: prev.from_account,
    }));
  };

  const handleTransfer = (e) => {
    e.preventDefault();
    if (parseFloat(formData.amount) <= 0) return toast.error("Invalid amount");
    createTransfer(formData);
  };

  return (
    <div className="space-y-8 p-4">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-4xl font-black text-gray-900 dark:text-white tracking-tight">
            Treasury
          </h1>
          <p className="text-gray-500 font-medium">
            Manage your cash flow and internal movements.
          </p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="bg-blue-600 text-white px-6 py-3 rounded-2xl font-bold flex items-center hover:bg-blue-700 transition-all shadow-lg shadow-blue-500/20"
        >
          <ArrowLeftRight className="w-5 h-5 mr-2" /> New Internal Transfer
        </button>
      </div>

      {/* Account Balance Summary */}
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

      {/* History Section */}
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
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 dark:divide-gray-700">
              {transfersData?.data.map((t) => (
                <tr
                  key={t.id}
                  className="hover:bg-gray-50 dark:hover:bg-gray-700/20"
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
                </tr>
              ))}
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

      {/* Transfer Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="New Internal Transfer"
      >
        <form onSubmit={handleTransfer} className="space-y-6">
          <div className="bg-gray-50 dark:bg-gray-700/30 p-6 rounded-2xl flex items-center justify-between gap-4">
            <div className="flex-1 text-center">
              <p className="text-[10px] font-black uppercase text-gray-400 mb-2">
                From
              </p>
              <div className="bg-white dark:bg-gray-800 p-3 rounded-xl shadow-sm font-bold capitalize border border-blue-200">
                {formData.from_account}
              </div>
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
                className="input text-lg font-bold"
                value={formData.amount}
                onChange={(e) =>
                  setFormData({ ...formData, amount: e.target.value })
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
            disabled={isPending}
            className="w-full bg-blue-600 text-white py-4 rounded-2xl font-black text-lg hover:bg-blue-700 disabled:bg-gray-400 transition-all"
          >
            {isPending ? "Processing..." : "Confirm Transfer"}
          </button>
        </form>
      </Modal>
    </div>
  );
}

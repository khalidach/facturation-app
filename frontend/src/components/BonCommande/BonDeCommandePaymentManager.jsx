import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Plus,
  Trash2,
  Banknote,
  X,
  Calendar,
  Hash,
  Building2,
  ArrowRightLeft,
  CheckCircle2,
} from "lucide-react";
import { toast } from "react-hot-toast";

export default function BonDeCommandePaymentManager({ order }) {
  const queryClient = useQueryClient();
  const [isAdding, setIsAdding] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    amount: "",
    date: new Date().toISOString().split("T")[0],
    payment_method: "cash",
    description: `Paiement Bon de Commande ${order.order_number}`,
    cheque_number: "",
    bank_name: "",
    virement_number: "",
    bank_from: "",
    bank_to: "",
    is_cashed: true,
    in_bank: false,
  });

  const { data: payments = [], isLoading } = useQuery({
    queryKey: ["bc-payments", order.id],
    queryFn: () => window.electronAPI.getPaymentsByBonDeCommande(order.id),
  });

  const { mutate: savePayment, isLoading: isSaving } = useMutation({
    mutationFn: (data) =>
      window.electronAPI.createTransaction({
        ...data,
        type: "expense",
        bon_de_commande_id: order.id,
        contact_person: order.supplierName,
        category: "Achat Fournisseur",
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bc-payments"] });
      queryClient.invalidateQueries({ queryKey: ["bon-de-commandes"] });
      toast.success("Paiement fournisseur enregistré");
      setIsAdding(false);
      resetForm();
    },
    onError: () => toast.error("Erreur lors de l'enregistrement"),
  });

  const { mutate: deletePayment } = useMutation({
    mutationFn: (id) =>
      window.electronAPI.deleteTransaction({ id, type: "expense" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bc-payments"] });
      queryClient.invalidateQueries({ queryKey: ["bon-de-commandes"] });
      toast.success("Paiement supprimé");
    },
  });

  const resetForm = () => {
    setFormData({
      amount: "",
      date: new Date().toISOString().split("T")[0],
      payment_method: "cash",
      description: `Paiement Bon de Commande ${order.order_number}`,
      cheque_number: "",
      bank_name: "",
      virement_number: "",
      bank_from: "",
      bank_to: "",
      is_cashed: true,
      in_bank: false,
    });
  };

  const totalPaid = payments.reduce((sum, p) => sum + p.amount, 0);
  const remaining = order.total - totalPaid;

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  return (
    <div className="space-y-6">
      {/* Summary Header */}
      <div className="grid grid-cols-2 gap-4">
        <div className="p-4 bg-gray-50 dark:bg-gray-700/30 rounded-2xl border dark:border-gray-700">
          <p className="text-[10px] font-black uppercase text-gray-400">
            Total Commande
          </p>
          <p className="text-xl font-black dark:text-white">
            {order.total.toLocaleString()} MAD
          </p>
        </div>
        <div className="p-4 bg-rose-50 dark:bg-rose-900/10 rounded-2xl border border-rose-100 dark:border-rose-900/30">
          <p className="text-[10px] font-black uppercase text-rose-400">
            Reste à payer
          </p>
          <p className="text-xl font-black text-rose-600">
            {remaining.toLocaleString()} MAD
          </p>
        </div>
      </div>

      {!isAdding ? (
        <button
          onClick={() => {
            setIsAdding(true);
            setFormData((p) => ({
              ...p,
              amount: remaining > 0 ? remaining : "",
            }));
          }}
          className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold flex items-center justify-center transition-all"
        >
          <Plus className="w-5 h-5 mr-2" /> Nouveau Paiement
        </button>
      ) : (
        <div className="p-5 border-2 border-blue-100 dark:border-blue-900/30 rounded-2xl bg-white dark:bg-gray-800 space-y-4 animate-in fade-in slide-in-from-top-2">
          <div className="flex justify-between items-center mb-2">
            <h4 className="font-bold text-blue-600">Détails du Paiement</h4>
            <button
              onClick={() => setIsAdding(false)}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-400 uppercase ml-1">
                Montant
              </label>
              <input
                name="amount"
                type="number"
                value={formData.amount}
                onChange={handleInputChange}
                className="input w-full"
                placeholder="0.00"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-400 uppercase ml-1">
                Date
              </label>
              <input
                name="date"
                type="date"
                value={formData.date}
                onChange={handleInputChange}
                className="input w-full"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-gray-400 uppercase ml-1">
              Mode de Paiement
            </label>
            <select
              name="payment_method"
              value={formData.payment_method}
              onChange={handleInputChange}
              className="input w-full"
            >
              <option value="cash">Espèces (Caisse)</option>
              <option value="cheque">Chèque</option>
              <option value="virement">Virement Bancaire</option>
              <option value="versement">Versement</option>
              <option value="effet">Effet</option>
            </select>
          </div>

          {/* Conditional Fields based on method */}
          {formData.payment_method === "cheque" && (
            <div className="grid grid-cols-2 gap-4 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-xl border border-dashed">
              <input
                name="cheque_number"
                value={formData.cheque_number}
                onChange={handleInputChange}
                placeholder="N° Chèque"
                className="input text-sm"
              />
              <input
                name="bank_name"
                value={formData.bank_name}
                onChange={handleInputChange}
                placeholder="Nom de la Banque"
                className="input text-sm"
              />
            </div>
          )}

          {(formData.payment_method === "virement" ||
            formData.payment_method === "versement") && (
            <div className="space-y-3 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-xl border border-dashed">
              <input
                name="virement_number"
                value={formData.virement_number}
                onChange={handleInputChange}
                placeholder="N° Transaction / Référence"
                className="input text-sm"
              />
              <div className="grid grid-cols-2 gap-4">
                <input
                  name="bank_from"
                  value={formData.bank_from}
                  onChange={handleInputChange}
                  placeholder="De (Banque)"
                  className="input text-sm"
                />
                <input
                  name="bank_to"
                  value={formData.bank_to}
                  onChange={handleInputChange}
                  placeholder="Vers (Banque)"
                  className="input text-sm"
                />
              </div>
            </div>
          )}

          <div className="flex gap-4 px-2">
            <label className="flex items-center text-sm font-medium cursor-pointer">
              <input
                type="checkbox"
                name="is_cashed"
                checked={formData.is_cashed}
                onChange={handleInputChange}
                className="mr-2 rounded"
              />
              <span className="dark:text-gray-300">Encaissé</span>
            </label>
            <label className="flex items-center text-sm font-medium cursor-pointer">
              <input
                type="checkbox"
                name="in_bank"
                checked={formData.in_bank}
                onChange={handleInputChange}
                className="mr-2 rounded"
              />
              <span className="dark:text-gray-300">En banque</span>
            </label>
          </div>

          <button
            disabled={!formData.amount || isSaving}
            onClick={() =>
              savePayment({ ...formData, amount: parseFloat(formData.amount) })
            }
            className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold shadow-lg shadow-emerald-500/20 disabled:opacity-50"
          >
            {isSaving ? "Enregistrement..." : "Confirmer le Paiement"}
          </button>
        </div>
      )}

      {/* History */}
      <div className="space-y-3">
        <h4 className="text-xs font-black uppercase text-gray-400 ml-1">
          Historique des paiements
        </h4>
        {payments.length === 0 ? (
          <div className="text-center py-8 border-2 border-dashed rounded-2xl text-gray-400 text-sm">
            Aucun paiement enregistré pour ce bon.
          </div>
        ) : (
          <div className="space-y-2">
            {payments.map((p) => (
              <div
                key={p.id}
                className="group flex items-center justify-between p-4 bg-white dark:bg-gray-800 border dark:border-gray-700 rounded-2xl hover:border-blue-200 dark:hover:border-blue-900 transition-all"
              >
                <div className="flex items-center gap-4">
                  <div
                    className={`p-2 rounded-lg ${
                      p.payment_method === "cash"
                        ? "bg-amber-100 text-amber-600"
                        : "bg-blue-100 text-blue-600"
                    }`}
                  >
                    <Banknote className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-bold dark:text-white">
                        {p.amount.toLocaleString()} MAD
                      </p>
                      {p.is_cashed && (
                        <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                      )}
                    </div>
                    <p className="text-[10px] text-gray-400 flex items-center gap-2">
                      <Calendar className="w-3 h-3" />{" "}
                      {new Date(p.date).toLocaleDateString()}
                      <span className="capitalize">• {p.payment_method}</span>
                      {p.cheque_number && <span>• N° {p.cheque_number}</span>}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    if (confirm("Supprimer ce paiement ?")) deletePayment(p.id);
                  }}
                  className="p-2 text-gray-300 hover:text-rose-600 opacity-0 group-hover:opacity-100 transition-all"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

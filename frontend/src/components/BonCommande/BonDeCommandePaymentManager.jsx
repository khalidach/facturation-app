import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Plus,
  Trash2,
  Edit2,
  Banknote,
  X,
  Calendar,
  CheckCircle2,
} from "lucide-react";
import { toast } from "react-hot-toast";

export default function BonDeCommandePaymentManager({ order }) {
  const queryClient = useQueryClient();
  const [isAdding, setIsAdding] = useState(false);
  const [editingPayment, setEditingPayment] = useState(null);

  // État initial du formulaire
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

  // Récupération des paiements existants
  const { data: payments = [], isLoading } = useQuery({
    queryKey: ["bc-payments", order.id],
    queryFn: () => window.electronAPI.getPaymentsByBonDeCommande(order.id),
  });

  // Mutation pour sauvegarder (créer ou mettre à jour)
  const { mutate: savePayment, isPending: isSaving } = useMutation({
    mutationFn: (data) => {
      const payload = {
        ...data,
        type: "expense",
        bon_de_commande_id: order.id,
        contact_person: order.supplierName,
        category: "Achat Fournisseur",
      };
      // Si on édite, on appelle update, sinon create
      if (editingPayment) {
        return window.electronAPI.updateTransaction(editingPayment.id, payload);
      }
      return window.electronAPI.createTransaction(payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bc-payments"] });
      queryClient.invalidateQueries({ queryKey: ["bon-de-commandes"] });
      queryClient.invalidateQueries({ queryKey: ["treasuryStats"] });
      toast.success(
        editingPayment ? "Règlement mis à jour" : "Règlement enregistré"
      );
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
      queryClient.invalidateQueries({ queryKey: ["treasuryStats"] });
      toast.success("Paiement supprimé");
    },
  });

  const resetForm = () => {
    setIsAdding(false);
    setEditingPayment(null);
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

  const handleEdit = (p) => {
    setEditingPayment(p);
    setFormData({
      amount: p.amount,
      date: p.date,
      payment_method: p.payment_method,
      description: p.description,
      cheque_number: p.cheque_number || "",
      bank_name: p.bank_name || "",
      virement_number: p.virement_number || "",
      bank_from: p.bank_from || "",
      bank_to: p.bank_to || "",
      is_cashed: p.is_cashed === 1,
      in_bank: p.in_bank === 1,
    });
    setIsAdding(true);
  };

  // Calcul du solde
  const totalPaid = payments.reduce((sum, p) => sum + p.amount, 0);
  const remaining = order.total - totalPaid;

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  /**
   * Validation du montant avant soumission
   */
  const handleConfirmAction = () => {
    const inputAmount = parseFloat(formData.amount);

    if (isNaN(inputAmount) || inputAmount <= 0) {
      return toast.error("Veuillez saisir un montant valide.");
    }

    // Limite autorisée : Reste à payer + montant actuel si on est en modification
    const currentLimit =
      remaining + (editingPayment ? editingPayment.amount : 0);

    // Vérification stricte contre le dépassement du prix principal
    if (inputAmount > currentLimit + 0.01) {
      // Marge d'erreur minime pour les calculs flottants
      return toast.error(
        `Le paiement ne peut pas dépasser le solde restant (${currentLimit.toLocaleString()} MAD)`
      );
    }

    savePayment({ ...formData, amount: inputAmount });
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4">
        <div className="p-4 bg-gray-50 dark:bg-gray-700/30 rounded-2xl border dark:border-gray-700 text-center">
          <p className="text-[10px] font-black uppercase text-gray-400">
            Total Commande
          </p>
          <p className="text-xl font-black dark:text-white">
            {order.total.toLocaleString()} MAD
          </p>
        </div>
        <div className="p-4 bg-rose-50 dark:bg-rose-900/10 rounded-2xl border border-rose-100 dark:border-rose-900/30 text-center">
          <p className="text-[10px] font-black uppercase text-rose-400">
            Reste à payer
          </p>
          <p className="text-xl font-black text-rose-600">
            {Math.max(0, remaining).toLocaleString()} MAD
          </p>
        </div>
      </div>

      {!isAdding ? (
        <button
          onClick={() => {
            setIsAdding(true);
            setFormData((prev) => ({
              ...prev,
              amount: remaining > 0 ? remaining : "",
            }));
          }}
          className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold flex items-center justify-center transition-all shadow-lg shadow-blue-500/20"
        >
          <Plus className="w-5 h-5 mr-2" /> Nouveau Paiement
        </button>
      ) : (
        <div className="p-5 border-2 border-blue-100 dark:border-blue-900/30 rounded-2xl bg-white dark:bg-gray-800 space-y-4 animate-in slide-in-from-top-2">
          <div className="flex justify-between items-center mb-2">
            <h4 className="font-black text-blue-600 uppercase text-xs tracking-widest">
              {editingPayment
                ? "Modification du règlement"
                : "Saisie d'un règlement"}
            </h4>
            <button
              onClick={resetForm}
              className="text-gray-400 hover:text-gray-600"
            >
              <X />
            </button>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase text-gray-400 ml-1">
                Montant
              </label>
              <input
                name="amount"
                type="number"
                step="0.01"
                value={formData.amount}
                onChange={handleInputChange}
                className="input text-lg font-black"
                placeholder="0.00"
                autoFocus
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase text-gray-400 ml-1">
                Date
              </label>
              <input
                name="date"
                type="date"
                value={formData.date}
                onChange={handleInputChange}
                className="input font-bold"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-black uppercase text-gray-400 ml-1">
              Mode de règlement
            </label>
            <select
              name="payment_method"
              value={formData.payment_method}
              onChange={handleInputChange}
              className="input w-full font-bold"
            >
              <option value="cash">Espèces (Caisse)</option>
              <option value="cheque">Chèque</option>
              <option value="virement">Virement Bancaire</option>
              <option value="versement">Versement</option>
            </select>
          </div>

          {formData.payment_method === "cheque" && (
            <div className="grid grid-cols-2 gap-4 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-xl border border-dashed border-gray-300">
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
                placeholder="Banque émettrice"
                className="input text-sm"
              />
            </div>
          )}

          <div className="flex gap-6 px-1">
            <label className="flex items-center text-[10px] font-black uppercase text-gray-500 cursor-pointer">
              <input
                type="checkbox"
                name="is_cashed"
                checked={formData.is_cashed}
                onChange={handleInputChange}
                className="mr-2 rounded text-emerald-600"
              />
              Confirmé / Encaissé
            </label>
            <label className="flex items-center text-[10px] font-black uppercase text-gray-500 cursor-pointer">
              <input
                type="checkbox"
                name="in_bank"
                checked={formData.in_bank}
                onChange={handleInputChange}
                className="mr-2 rounded text-blue-600"
              />
              En banque
            </label>
          </div>

          <button
            disabled={!formData.amount || isSaving}
            onClick={handleConfirmAction}
            className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold shadow-lg shadow-emerald-500/20 disabled:opacity-50 transition-all"
          >
            {isSaving
              ? "Traitement..."
              : editingPayment
              ? "Mettre à jour le règlement"
              : "Confirmer le Paiement"}
          </button>
        </div>
      )}

      <div className="space-y-3">
        <h4 className="text-[10px] font-black uppercase text-gray-400 tracking-widest ml-1">
          Historique des transactions
        </h4>
        {isLoading ? (
          <div className="text-center py-4 animate-pulse text-gray-400 font-bold">
            Chargement...
          </div>
        ) : payments.length === 0 ? (
          <div className="text-center py-8 border-2 border-dashed rounded-2xl text-gray-400 text-sm italic">
            Aucun paiement enregistré pour ce bon.
          </div>
        ) : (
          <div className="space-y-2">
            {payments.map((p) => (
              <div
                key={p.id}
                className="group flex items-center justify-between p-4 bg-white dark:bg-gray-800 border dark:border-gray-700 rounded-2xl hover:border-blue-500/30 transition-all"
              >
                <div className="flex items-center gap-4">
                  <div
                    className={`p-2 rounded-lg ${
                      p.payment_method === "cash"
                        ? "bg-amber-100 text-amber-600 dark:bg-amber-900/20"
                        : "bg-blue-100 text-blue-600 dark:bg-blue-900/20"
                    }`}
                  >
                    <Banknote className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-black dark:text-white">
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
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all">
                  <button
                    onClick={() => handleEdit(p)}
                    className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => {
                      if (confirm("Supprimer ce règlement ?"))
                        deletePayment(p.id);
                    }}
                    className="p-2 text-gray-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/30 rounded-lg"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

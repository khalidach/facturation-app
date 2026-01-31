// frontend/src/components/facturation/PaymentManager.jsx

import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Plus,
  Trash2,
  Edit2,
  Banknote,
  Landmark,
  CheckSquare,
  CreditCard,
  X,
} from "lucide-react";
import { toast } from "react-hot-toast";

export default function PaymentManager({ facture }) {
  const queryClient = useQueryClient();
  const [isAdding, setIsAdding] = useState(false);
  const [editingPayment, setEditingPayment] = useState(null);

  const [formData, setFormData] = useState({
    amount: "",
    date: new Date().toISOString().split("T")[0],
    payment_method: "cash",
    description: `Paiement ${facture.type === "facture" ? "Facture" : "Devis"} ${facture.facture_number}`,
    is_cashed: true,
    in_bank: false,
    cheque_number: "",
    bank_name: "",
    // Bank Transaction Fields
    transaction_ref: "",
    bank_sender: "",
    bank_recipient: "",
    account_recipient: "",
    name_recipient: "",
    account_sender: "",
    name_sender: "",
  });

  const { data: payments = [], isLoading } = useQuery({
    queryKey: ["payments", facture.id],
    queryFn: () => window.electronAPI.getPaymentsByFacture(facture.id),
  });

  const { mutate: savePayment } = useMutation({
    mutationFn: (data) => {
      const payload = {
        ...data,
        type: "income",
        facture_id: facture.id,
        contact_person: facture.clientName,
        category: "Vente",
      };

      if (editingPayment) {
        return window.electronAPI.updateTransaction({
          id: editingPayment.id,
          data: payload,
        });
      }
      return window.electronAPI.createTransaction(payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["payments", facture.id] });
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
      queryClient.invalidateQueries({ queryKey: ["treasuryStats"] });
      toast.success("Mouvement financier enregistré");
      resetForm();
    },
    onError: (err) => toast.error(err.message),
  });

  const { mutate: deletePayment } = useMutation({
    mutationFn: (id) =>
      window.electronAPI.deleteTransaction({ id, type: "income" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["payments", facture.id] });
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
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
      description: `Paiement ${facture.type === "facture" ? "Facture" : "Devis"} ${facture.facture_number}`,
      is_cashed: true,
      in_bank: false,
      cheque_number: "",
      bank_name: "",
      transaction_ref: "",
      bank_sender: "",
      bank_recipient: "",
      account_recipient: "",
      name_recipient: "",
      account_sender: "",
      name_sender: "",
    });
  };

  const handleEdit = (p) => {
    setEditingPayment(p);
    setFormData({
      amount: p.amount,
      date: p.date,
      payment_method: p.payment_method,
      description: p.description,
      is_cashed: p.is_cashed === 1,
      in_bank: p.in_bank === 1,
      cheque_number: p.cheque_number || "",
      bank_name: p.bank_name || "",
      transaction_ref: p.transaction_ref || "",
      bank_sender: p.bank_sender || "",
      bank_recipient: p.bank_recipient || "",
      account_recipient: p.account_recipient || "",
      name_recipient: p.name_recipient || "",
      account_sender: p.account_sender || "",
      name_sender: p.name_sender || "",
    });
    setIsAdding(true);
  };

  const totalPaid = payments.reduce((sum, p) => sum + p.amount, 0);
  const remaining = facture.total - totalPaid;

  const handleSubmit = (e) => {
    e.preventDefault();
    const inputAmount = parseFloat(formData.amount);
    if (isNaN(inputAmount) || inputAmount <= 0)
      return toast.error("Montant invalide");

    // Calcul de la limite autorisée (solde restant + montant actuel si on modifie un paiement existant)
    const currentLimit =
      remaining + (editingPayment ? editingPayment.amount : 0);

    if (inputAmount > currentLimit + 0.01) {
      return toast.error(
        `Le paiement ne peut pas dépasser le montant restant (${currentLimit.toLocaleString()} MAD)`,
      );
    }
    savePayment(formData);
  };

  const getMethodIcon = (method) => {
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
      <div className="flex justify-between items-center p-5 bg-gray-50 dark:bg-gray-700/30 rounded-2xl border border-gray-100 dark:border-gray-700">
        <div>
          <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest">
            Balance de paiement
          </p>
          <div className="flex items-baseline gap-2 mt-1">
            <span
              className={`text-3xl font-black ${remaining <= 0.01 ? "text-emerald-600" : "text-rose-600"}`}
            >
              {Math.max(0, remaining).toLocaleString()}
            </span>
            <span className="text-xs font-bold text-gray-400">MAD RESTANT</span>
          </div>
        </div>
        {!isAdding && remaining > 0.01 && (
          <button
            onClick={() => setIsAdding(true)}
            className="px-6 py-3 bg-blue-600 text-white rounded-xl font-black text-sm flex items-center gap-2 hover:bg-blue-700 shadow-lg shadow-blue-500/20 transition-all"
          >
            <Plus className="w-4 h-4" /> Nouveau règlement
          </button>
        )}
      </div>

      {isAdding && (
        <form
          onSubmit={handleSubmit}
          className="p-6 bg-white dark:bg-gray-800 border-2 border-blue-500/20 rounded-2xl space-y-6 animate-in slide-in-from-top-4"
        >
          <div className="flex justify-between items-center mb-2">
            <h4 className="text-sm font-black uppercase text-blue-600 tracking-widest">
              {editingPayment
                ? "Édition du versement"
                : "Saisie d'un versement"}
            </h4>
            <button
              type="button"
              onClick={resetForm}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase text-gray-400 ml-1">
                Montant Encaissé
              </label>
              <input
                type="number"
                step="0.01"
                required
                value={formData.amount}
                onChange={(e) =>
                  setFormData({ ...formData, amount: e.target.value })
                }
                className="input text-lg font-black"
                placeholder="0.00"
                autoFocus
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase text-gray-400 ml-1">
                Date de Valeur
              </label>
              <input
                type="date"
                required
                value={formData.date}
                onChange={(e) =>
                  setFormData({ ...formData, date: e.target.value })
                }
                className="input font-bold"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase text-gray-400 ml-1">
                Mode de règlement
              </label>
              <select
                value={formData.payment_method}
                onChange={(e) => {
                  const method = e.target.value;
                  let updates = { payment_method: method };
                  if (method === "cash") {
                    updates.in_bank = false;
                    updates.is_cashed = true;
                  } else if (["virement", "versement"].includes(method)) {
                    updates.in_bank = true;
                    updates.is_cashed = true;
                  }
                  setFormData({ ...formData, ...updates });
                }}
                className="input font-black"
              >
                <option value="cash">Espèces (Caisse)</option>
                <option value="virement">Virement (Banque)</option>
                <option value="cheque">Chèque (En attente/Banque)</option>
                <option value="versement">Versement (Banque)</option>
              </select>
            </div>
            <div className="flex items-center gap-6 pt-6">
              {formData.payment_method === "cheque" && (
                <>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.is_cashed}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          is_cashed: e.target.checked,
                        })
                      }
                      className="w-4 h-4 rounded text-blue-600"
                    />
                    <span className="text-xs font-bold text-gray-500">
                      Encaissé / Confirmé
                    </span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.in_bank}
                      onChange={(e) =>
                        setFormData({ ...formData, in_bank: e.target.checked })
                      }
                      className="w-4 h-4 rounded text-blue-600"
                    />
                    <span className="text-xs font-bold text-gray-500">
                      En banque
                    </span>
                  </label>
                </>
              )}
            </div>
          </div>

          {/* Detailed Bank Tracking Section */}
          {["virement", "versement"].includes(formData.payment_method) && (
            <div className="space-y-4 p-5 bg-blue-50/50 dark:bg-blue-900/10 rounded-2xl border border-blue-100 dark:border-blue-800 animate-in slide-in-from-top-2">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-blue-500 ml-1">
                    Référence Transaction
                  </label>
                  <input
                    type="text"
                    value={formData.transaction_ref}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        transaction_ref: e.target.value,
                      })
                    }
                    placeholder="N° de virement/bordereau"
                    className="input font-bold"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-blue-500 ml-1">
                    Banque d'Envoi
                  </label>
                  <input
                    type="text"
                    value={formData.bank_sender}
                    onChange={(e) =>
                      setFormData({ ...formData, bank_sender: e.target.value })
                    }
                    placeholder="Banque source"
                    className="input font-bold"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-blue-500 ml-1">
                    Banque de Réception
                  </label>
                  <input
                    type="text"
                    value={formData.bank_recipient}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        bank_recipient: e.target.value,
                      })
                    }
                    placeholder="Banque de destination"
                    className="input font-bold"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-blue-500 ml-1">
                    N° Compte de Réception
                  </label>
                  <input
                    type="text"
                    value={formData.account_recipient}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        account_recipient: e.target.value,
                      })
                    }
                    placeholder="Compte crédité"
                    className="input font-bold"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-blue-500 ml-1">
                    Nom du Bénéficiaire
                  </label>
                  <input
                    type="text"
                    value={formData.name_recipient}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        name_recipient: e.target.value,
                      })
                    }
                    placeholder="Qui reçoit l'argent"
                    className="input font-bold"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-emerald-600 ml-1">
                    N° Compte de l'Envoyeur
                  </label>
                  <input
                    type="text"
                    value={formData.account_sender}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        account_sender: e.target.value,
                      })
                    }
                    placeholder="Compte débité"
                    className="input font-bold"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-emerald-600 ml-1">
                    Nom de l'Envoyeur
                  </label>
                  <input
                    type="text"
                    value={formData.name_sender}
                    onChange={(e) =>
                      setFormData({ ...formData, name_sender: e.target.value })
                    }
                    placeholder="Qui a envoyé l'argent"
                    className="input font-bold"
                  />
                </div>
              </div>
            </div>
          )}

          {formData.payment_method === "cheque" && (
            <div className="space-y-4 animate-in slide-in-from-top-2">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <input
                  type="text"
                  value={formData.cheque_number}
                  onChange={(e) =>
                    setFormData({ ...formData, cheque_number: e.target.value })
                  }
                  placeholder="N° Chèque"
                  className="input font-bold"
                />
                <input
                  type="text"
                  value={formData.bank_name}
                  onChange={(e) =>
                    setFormData({ ...formData, bank_name: e.target.value })
                  }
                  placeholder="Banque émettrice"
                  className="input font-bold"
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-gray-400 ml-1">
                  Statut et Destination du Chèque
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      setFormData({
                        ...formData,
                        is_cashed: false,
                        in_bank: false,
                      })
                    }
                    className={`py-2 px-3 rounded-xl text-[10px] font-black uppercase border-2 transition-all ${!formData.is_cashed ? "border-amber-500 bg-amber-50 text-amber-600" : "border-gray-100 text-gray-400"}`}
                  >
                    En attente
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setFormData({
                        ...formData,
                        is_cashed: true,
                        in_bank: true,
                      })
                    }
                    className={`py-2 px-3 rounded-xl text-[10px] font-black uppercase border-2 transition-all ${formData.is_cashed && formData.in_bank ? "border-blue-500 bg-blue-50 text-blue-600" : "border-gray-100 text-gray-400"}`}
                  >
                    En Banque
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setFormData({
                        ...formData,
                        is_cashed: true,
                        in_bank: false,
                      })
                    }
                    className={`py-2 px-3 rounded-xl text-[10px] font-black uppercase border-2 transition-all ${formData.is_cashed && !formData.in_bank ? "border-emerald-500 bg-emerald-50 text-emerald-600" : "border-gray-100 text-gray-400"}`}
                  >
                    En Caisse
                  </button>
                </div>
              </div>
            </div>
          )}

          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={resetForm}
              className="px-6 py-3 text-xs font-black uppercase text-gray-400 hover:text-gray-600 transition-colors"
            >
              Annuler
            </button>
            <button
              type="submit"
              className="px-8 py-3 bg-emerald-600 text-white rounded-xl font-black text-sm shadow-lg shadow-emerald-500/20 hover:bg-emerald-700 transition-all"
            >
              {editingPayment
                ? "Confirmer les modifications"
                : "Enregistrer le versement"}
            </button>
          </div>
        </form>
      )}

      <div className="space-y-3">
        <h4 className="text-[10px] font-black uppercase text-gray-400 tracking-widest ml-1">
          Historique des transactions liées
        </h4>
        {isLoading ? (
          <div className="py-10 text-center animate-pulse text-gray-400 font-bold">
            Synchronisation...
          </div>
        ) : payments.length === 0 ? (
          <div className="py-12 bg-gray-50 dark:bg-gray-700/20 rounded-2xl border-2 border-dashed border-gray-200 dark:border-gray-700 flex flex-col items-center justify-center text-gray-400 italic">
            <Banknote className="w-10 h-10 mb-2 opacity-20" />
            <span className="text-sm">
              Aucun mouvement financier associé à ce document.
            </span>
          </div>
        ) : (
          payments.map((p) => (
            <div
              key={p.id}
              className="flex items-center justify-between p-4 bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-2xl group hover:border-blue-500/30 transition-all"
            >
              <div className="flex items-center gap-4">
                <div
                  className={`p-3 rounded-xl ${p.payment_method === "cash" ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20" : "bg-blue-50 text-blue-600 dark:bg-blue-900/20"}`}
                >
                  {getMethodIcon(p.payment_method)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-black text-gray-900 dark:text-white leading-tight">
                    {p.amount.toLocaleString()}{" "}
                    <span className="text-[10px] opacity-40">MAD</span>
                  </p>
                  <div className="flex flex-wrap items-center gap-2 mt-1">
                    <span className="text-[10px] font-black uppercase text-gray-400">
                      {new Date(p.date).toLocaleDateString("fr-FR")}
                    </span>
                    <span className="w-1 h-1 bg-gray-300 rounded-full"></span>
                    <span className="text-[10px] font-black uppercase text-gray-400">
                      {p.payment_method}
                    </span>
                    {p.transaction_ref && (
                      <>
                        <span className="w-1 h-1 bg-gray-300 rounded-full"></span>
                        <span className="text-[10px] font-black uppercase text-blue-500">
                          Ref: {p.transaction_ref}
                        </span>
                      </>
                    )}
                    {p.cheque_number && (
                      <>
                        <span className="w-1 h-1 bg-gray-300 rounded-full"></span>
                        <span className="text-[10px] font-black uppercase text-blue-500">
                          N° {p.cheque_number}
                        </span>
                      </>
                    )}
                  </div>
                  {p.bank_sender && (
                    <p className="text-[9px] font-bold text-gray-400 uppercase mt-1 truncate">
                      {p.bank_sender} → {p.bank_recipient || "Banque"}
                    </p>
                  )}
                </div>
              </div>
              <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-all">
                <button
                  onClick={() => handleEdit(p)}
                  className="p-2.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-xl"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => {
                    if (window.confirm("Supprimer cette transaction ?"))
                      deletePayment(p.id);
                  }}
                  className="p-2.5 text-gray-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/30 rounded-xl"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

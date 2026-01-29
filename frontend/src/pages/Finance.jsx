// frontend/src/pages/Finance.jsx

import React, { useState, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Plus,
  Trash2,
  Edit2,
  ArrowUpCircle,
  ArrowDownCircle,
  Receipt,
  Search,
  CreditCard,
  Banknote,
  Landmark,
  CheckSquare,
  User,
  ChevronLeft,
  ChevronRight,
  X,
} from "lucide-react";
import { toast } from "react-hot-toast";

/**
 * COMPOSANTS UI INTERNES
 */

const InternalModal = ({ isOpen, onClose, title, children, size = "md" }) => {
  if (!isOpen) return null;
  const sizeClasses = {
    sm: "sm:max-w-lg",
    md: "sm:max-w-xl",
    lg: "sm:max-w-3xl",
    xl: "sm:max-w-5xl",
  };
  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-75 overflow-y-auto h-full w-full z-50 flex items-start justify-center pt-20 px-4">
      <div
        className={`relative bg-white dark:bg-gray-800 rounded-3xl shadow-2xl w-full border border-gray-100 dark:border-gray-700 overflow-hidden ${sizeClasses[size]} animate-in fade-in zoom-in duration-200`}
      >
        <div className="flex justify-between items-center p-6 border-b border-gray-50 dark:border-gray-700">
          <h2 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight">
            {title}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
          >
            <X className="w-6 h-6 text-gray-400" />
          </button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
};

const InternalPagination = ({ currentPage, totalPages, onPageChange }) => {
  if (totalPages <= 1) return null;
  return (
    <div className="flex items-center justify-between py-4">
      <button
        onClick={() => onPageChange(Math.max(1, currentPage - 1))}
        disabled={currentPage === 1}
        className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm font-bold text-gray-600 dark:text-gray-300 disabled:opacity-40 hover:bg-gray-50 transition-all"
      >
        <ChevronLeft className="w-4 h-4" /> Précédent
      </button>
      <span className="text-xs font-black text-gray-400 uppercase tracking-widest">
        Page {currentPage} / {totalPages}
      </span>
      <button
        onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
        disabled={currentPage === totalPages}
        className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm font-bold text-gray-600 dark:text-gray-300 disabled:opacity-40 hover:bg-gray-50 transition-all"
      >
        Suivant <ChevronRight className="w-4 h-4" />
      </button>
    </div>
  );
};

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
  const [showContactDropdown, setShowContactDropdown] = useState(false);
  const dropdownRef = useRef(null);

  const [formData, setFormData] = useState({
    type: "income",
    amount: "",
    description: "",
    category: "Général",
    contact_person: "",
    date: new Date().toISOString().split("T")[0],
    payment_method: "cash",
    is_cashed: true,
    in_bank: false,
    cheque_number: "",
    bank_name: "",
    virement_number: "",
    bank_from: "",
    bank_to: "",
    bon_de_commande_id: null,
  });

  const { data: linkedBC } = useQuery({
    queryKey: ["bc-details", formData.bon_de_commande_id],
    queryFn: () =>
      window.electronAPI.getBonDeCommandeById(formData.bon_de_commande_id),
    enabled: !!formData.bon_de_commande_id && isModalOpen,
  });

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target))
        setShowContactDropdown(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

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
  });

  const { data: contactsData } = useQuery({
    queryKey: ["contacts-search", activeTab, contactSearch],
    queryFn: () => {
      if (!isModalOpen || !contactSearch) return { data: [] };
      const api =
        activeTab === "income"
          ? window.electronAPI.getClients
          : window.electronAPI.getSuppliers;
      return api({ page: 1, limit: 10, search: contactSearch });
    },
    enabled: isModalOpen && contactSearch.length > 0,
  });

  const contacts = contactsData?.data || [];

  useEffect(() => {
    if (editingTx) {
      setFormData({
        type: activeTab,
        amount: editingTx.amount,
        description: editingTx.description,
        category: editingTx.category || "Général",
        contact_person: editingTx.contact_person || "",
        date: editingTx.date,
        payment_method: editingTx.payment_method || "cash",
        is_cashed: editingTx.is_cashed === 1,
        in_bank: editingTx.in_bank === 1,
        cheque_number: editingTx.cheque_number || "",
        bank_name: editingTx.bank_name || "",
        virement_number: editingTx.virement_number || "",
        bank_from: editingTx.bank_from || "",
        bank_to: editingTx.bank_to || "",
        facture_id: editingTx.facture_id || null,
        bon_de_commande_id: editingTx.bon_de_commande_id || null,
      });
      setContactSearch(editingTx.contact_person || "");
    } else {
      setFormData((prev) => ({
        ...prev,
        type: activeTab,
        amount: "",
        description: "",
        category: "Général",
        contact_person: "",
        date: new Date().toISOString().split("T")[0],
        payment_method: "cash",
        is_cashed: true,
        in_bank: false,
        cheque_number: "",
        bank_name: "",
        virement_number: "",
        bank_from: "",
        bank_to: "",
        facture_id: null,
        bon_de_commande_id: null,
      }));
      setContactSearch("");
    }
  }, [editingTx, activeTab, isModalOpen]);

  const { mutate: saveTx, isPending } = useMutation({
    mutationFn: (data) =>
      editingTx
        ? window.electronAPI.updateTransaction({ id: editingTx.id, data })
        : window.electronAPI.createTransaction(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
      queryClient.invalidateQueries({ queryKey: ["treasuryStats"] });
      queryClient.invalidateQueries({ queryKey: ["bon-de-commandes"] });
      if (formData.facture_id)
        queryClient.invalidateQueries({
          queryKey: ["payments", formData.facture_id],
        });
      toast.success(
        `Enregistrement ${editingTx ? "mis à jour" : "sauvegardé"}`,
      );
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
      queryClient.invalidateQueries({ queryKey: ["bon-de-commandes"] });
      toast.success("Supprimé");
      setTxToDelete(null);
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    const inputAmount = parseFloat(formData.amount);
    if (formData.bon_de_commande_id && linkedBC) {
      const currentLimit =
        linkedBC.total -
        linkedBC.totalPaid +
        (editingTx ? editingTx.amount : 0);
      if (inputAmount > currentLimit + 0.01)
        return toast.error(
          `Le montant dépasse le solde restant (${currentLimit.toLocaleString()} MAD)`,
        );
    }
    saveTx(formData);
  };

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
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl font-black text-gray-900 dark:text-white tracking-tight">
            Finance
          </h1>
          <div className="flex items-center mt-2 text-gray-500 font-medium">
            <Receipt className="w-4 h-4 mr-2" />
            Suivez chaque mouvement • Contrôle des flux de trésorerie
          </div>
        </div>
        <button
          onClick={() => {
            setEditingTx(null);
            setIsModalOpen(true);
          }}
          className={`flex items-center justify-center px-8 py-4 rounded-[1.5rem] font-black text-white transition-all shadow-xl hover:scale-[1.02] active:scale-[0.98] ${activeTab === "income" ? "bg-emerald-600 hover:bg-emerald-700 shadow-emerald-500/20" : "bg-rose-600 hover:bg-rose-700 shadow-rose-500/20"}`}
        >
          <Plus className="w-6 h-6 mr-2" />
          <span>Nouveau {activeTab === "income" ? "Revenu" : "Dépense"}</span>
        </button>
      </div>

      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div className="inline-flex p-1.5 bg-gray-200/50 dark:bg-gray-800/50 backdrop-blur-md rounded-2xl border border-gray-100 dark:border-gray-700">
          <button
            onClick={() => setActiveTab("income")}
            className={`flex items-center px-8 py-3 rounded-xl text-sm font-black transition-all ${activeTab === "income" ? "bg-white dark:bg-gray-700 text-emerald-600 shadow-lg" : "text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"}`}
          >
            <ArrowUpCircle className="w-4 h-4 mr-2" />
            Revenus
          </button>
          <button
            onClick={() => setActiveTab("expense")}
            className={`flex items-center px-8 py-3 rounded-xl text-sm font-black transition-all ${activeTab === "expense" ? "bg-white dark:bg-gray-700 text-rose-600 shadow-lg" : "text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"}`}
          >
            <ArrowDownCircle className="w-4 h-4 mr-2" />
            Dépenses
          </button>
        </div>
        <div className="relative flex-1 max-w-xl group">
          <input
            type="text"
            placeholder="Rechercher des transactions (Libellé, N° Chèque...)"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-6 py-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl text-sm font-bold focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all"
          />
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-[2.5rem] shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-gray-50 dark:bg-gray-700/30">
              <tr className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                <th className="px-8 py-6">Date d'Exécution</th>
                <th className="px-8 py-6">Description & Contact</th>
                <th className="px-8 py-6">Méthode</th>
                <th className="px-8 py-6">Statut</th>
                <th className="px-8 py-6 text-right">Montant</th>
                <th className="px-8 py-6 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 dark:divide-gray-700">
              {isLoading ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-8 py-20 text-center font-bold text-gray-400 animate-pulse"
                  >
                    Chargement...
                  </td>
                </tr>
              ) : txResponse?.data.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-8 py-20 text-center">
                    <Receipt className="w-16 h-16 text-gray-100 mx-auto mb-4" />
                    <p className="text-gray-400 font-bold text-xs uppercase">
                      Aucun mouvement trouvé
                    </p>
                  </td>
                </tr>
              ) : (
                txResponse?.data.map((tx) => (
                  <tr
                    key={tx.id}
                    className="hover:bg-gray-50 dark:hover:bg-gray-700/20 transition-all group"
                  >
                    <td className="px-8 py-6 text-sm font-black text-gray-400">
                      {new Date(tx.date).toLocaleDateString("fr-FR", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      })}
                    </td>
                    <td className="px-8 py-6">
                      <div className="font-black text-gray-900 dark:text-white leading-tight">
                        {tx.description}
                      </div>
                      <div className="flex items-center text-[10px] font-black text-blue-500 uppercase mt-1">
                        <User className="w-3 h-3 mr-1" />
                        {tx.contact_person || "Transaction Directe"}
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-gray-100 dark:bg-gray-700 rounded-xl text-[10px] font-black uppercase text-gray-600">
                        {getPaymentIcon(tx.payment_method)} {tx.payment_method}
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      {tx.payment_method === "cheque" ? (
                        <span
                          className={`inline-flex items-center px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-tighter ${tx.is_cashed ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"}`}
                        >
                          {tx.is_cashed ? "Encaissé" : "En cours"}
                        </span>
                      ) : (
                        <span className="text-gray-200">—</span>
                      )}
                    </td>
                    <td
                      className={`px-8 py-6 text-lg text-right font-black ${activeTab === "income" ? "text-emerald-600" : "text-rose-600"}`}
                    >
                      {tx.amount.toLocaleString()}{" "}
                      <span className="text-[10px] opacity-50">MAD</span>
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex justify-center items-center gap-2">
                        <button
                          onClick={() => {
                            setEditingTx(tx);
                            setIsModalOpen(true);
                          }}
                          className="p-3 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-2xl transition-all"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setTxToDelete(tx.id)}
                          className="p-3 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-2xl transition-all"
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
          <div className="px-8">
            <InternalPagination
              currentPage={currentPage}
              totalPages={txResponse?.pagination.totalPages || 1}
              onPageChange={setCurrentPage}
            />
          </div>
        </div>
      </div>

      <InternalModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingTx(null);
        }}
        title={
          editingTx
            ? `Modifier ${activeTab === "income" ? "revenu" : "dépense"}`
            : `Nouveau ${activeTab === "income" ? "revenu" : "dépense"}`
        }
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase text-gray-400 ml-1">
                Volume (Montant MAD)
              </label>
              <input
                type="number"
                step="0.01"
                required
                value={formData.amount}
                onChange={(e) =>
                  setFormData({ ...formData, amount: e.target.value })
                }
                className="w-full px-6 py-4 bg-gray-50 dark:bg-gray-700/50 rounded-2xl border-2 border-transparent focus:border-blue-500 focus:bg-white outline-none transition-all text-xl font-black"
                placeholder="0.00"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase text-gray-400 ml-1">
                Date d'effet
              </label>
              <input
                type="date"
                required
                value={formData.date}
                onChange={(e) =>
                  setFormData({ ...formData, date: e.target.value })
                }
                className="w-full px-6 py-4 bg-gray-50 dark:bg-gray-700/50 rounded-2xl border-2 border-transparent focus:border-blue-500 focus:bg-white outline-none transition-all font-bold"
              />
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase text-gray-400 ml-1">
              Libellé / Description
            </label>
            <input
              type="text"
              required
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              className="w-full px-6 py-4 bg-gray-50 dark:bg-gray-700/50 rounded-2xl border-2 border-transparent focus:border-blue-500 focus:bg-white outline-none transition-all font-bold"
              placeholder="Ex: Facture N°..."
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="relative space-y-2" ref={dropdownRef}>
              <label className="text-[10px] font-black uppercase text-gray-400 ml-1">
                {activeTab === "income" ? "Client" : "Fournisseur"} lié
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={contactSearch}
                  onChange={(e) => {
                    setContactSearch(e.target.value);
                    setFormData({
                      ...formData,
                      contact_person: e.target.value,
                    });
                    setShowContactDropdown(true);
                  }}
                  onFocus={() => setShowContactDropdown(true)}
                  placeholder={`Rechercher...`}
                  className="w-full pl-12 pr-6 py-4 bg-gray-50 dark:bg-gray-700/50 rounded-2xl border-2 border-transparent focus:border-blue-500 focus:bg-white outline-none transition-all font-bold"
                />
                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              </div>
              {showContactDropdown && contacts.length > 0 && (
                <div className="absolute z-30 w-full mt-2 bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-100 max-h-56 overflow-y-auto animate-in slide-in-from-top-2">
                  {contacts.map((contact) => (
                    <button
                      key={contact.id}
                      type="button"
                      onClick={() => {
                        setContactSearch(contact.name);
                        setFormData({
                          ...formData,
                          contact_person: contact.name,
                        });
                        setShowContactDropdown(false);
                      }}
                      className="w-full px-6 py-4 text-left text-sm font-black hover:bg-blue-50 border-b last:border-0 transition-colors"
                    >
                      {contact.name}
                      <span className="block text-[9px] text-gray-400 font-bold uppercase mt-0.5">
                        {contact.ice || contact.service_type || "Base"}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase text-gray-400 ml-1">
                Catégorie / Étiquette
              </label>
              <input
                type="text"
                value={formData.category}
                onChange={(e) =>
                  setFormData({ ...formData, category: e.target.value })
                }
                className="w-full px-6 py-4 bg-gray-50 dark:bg-gray-700/50 rounded-2xl border-2 border-transparent focus:border-blue-500 focus:bg-white outline-none transition-all font-bold"
                placeholder="Ex: Logistique..."
              />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-end">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase text-gray-400 ml-1">
                Protocole de Paiement
              </label>
              <select
                value={formData.payment_method}
                onChange={(e) => {
                  const method = e.target.value;
                  let updates = { payment_method: method };
                  if (method === "cash") {
                    updates.in_bank = false;
                    updates.is_cashed = true;
                  } else if (method === "virement" || method === "versement") {
                    updates.in_bank = true;
                    updates.is_cashed = true;
                  }
                  setFormData({ ...formData, ...updates });
                }}
                className="w-full px-6 py-4 bg-gray-50 dark:bg-gray-700/50 rounded-2xl border-2 border-transparent focus:border-blue-500 focus:bg-white outline-none transition-all font-black"
              >
                <option value="cash">Espèces</option>
                <option value="virement">Virement</option>
                <option value="cheque">Chèque</option>
                <option value="versement">Versement</option>
              </select>
            </div>
            <div className="flex items-center gap-8 bg-gray-50 p-4 rounded-2xl px-6 h-[60px]">
              {formData.payment_method === "cheque" && (
                <>
                  <label className="flex items-center cursor-pointer group">
                    <input
                      type="checkbox"
                      checked={formData.is_cashed}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          is_cashed: e.target.checked,
                        })
                      }
                      className="w-5 h-5 rounded-lg text-emerald-600 mr-2"
                    />
                    <span className="text-[10px] font-black uppercase text-gray-500">
                      Encaissé
                    </span>
                  </label>
                  <label className="flex items-center cursor-pointer group">
                    <input
                      type="checkbox"
                      checked={formData.in_bank}
                      onChange={(e) =>
                        setFormData({ ...formData, in_bank: e.target.checked })
                      }
                      className="w-5 h-5 rounded-lg text-blue-600 mr-2"
                    />
                    <span className="text-[10px] font-black uppercase text-gray-500">
                      En banque
                    </span>
                  </label>
                </>
              )}
            </div>
          </div>
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

              <div className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-2xl">
                <label className="text-[10px] font-black uppercase text-gray-400 block mb-3">
                  État du Chèque
                </label>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    {
                      id: "wait",
                      label: "En attente",
                      color: "amber",
                      vals: { is_cashed: false, in_bank: false },
                    },
                    {
                      id: "bank",
                      label: "En Banque",
                      color: "blue",
                      vals: { is_cashed: true, in_bank: true },
                    },
                    {
                      id: "cash",
                      label: "En Caisse",
                      color: "emerald",
                      vals: { is_cashed: true, in_bank: false },
                    },
                  ].map((opt) => (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => setFormData({ ...formData, ...opt.vals })}
                      className={`py-3 rounded-xl text-[10px] font-black uppercase border-2 transition-all ${
                        (opt.id === "wait" && !formData.is_cashed) ||
                        (opt.id === "bank" &&
                          formData.is_cashed &&
                          formData.in_bank) ||
                        (opt.id === "cash" &&
                          formData.is_cashed &&
                          !formData.in_bank)
                          ? `border-${opt.color}-500 bg-${opt.color}-50 text-${opt.color}-600 shadow-sm`
                          : "border-transparent bg-white dark:bg-gray-800 text-gray-400"
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
          <div className="flex justify-end gap-4 pt-6">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-8 py-4 rounded-2xl font-black text-gray-500 hover:bg-gray-100 text-sm uppercase"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={isPending}
              className={`px-10 py-4 rounded-2xl font-black text-white shadow-2xl transition-all active:scale-95 ${activeTab === "income" ? "bg-emerald-600 hover:bg-emerald-700 shadow-emerald-500/20" : "bg-rose-600 hover:bg-rose-700 shadow-rose-500/20"}`}
            >
              {isPending
                ? "Mise à jour..."
                : editingTx
                  ? "Mettre à jour"
                  : "Enregistrer"}
            </button>
          </div>
        </form>
      </InternalModal>

      <InternalModal
        isOpen={!!txToDelete}
        onClose={() => setTxToDelete(null)}
        title="Supprimer le Mouvement"
      >
        <div className="space-y-6">
          <p className="text-gray-600 dark:text-gray-300 font-bold">
            Cette action supprimera définitivement cette entrée.
          </p>
          <div className="flex justify-end gap-3">
            <button
              onClick={() => setTxToDelete(null)}
              className="px-6 py-3 rounded-xl font-bold text-gray-500"
            >
              Annuler
            </button>
            <button
              onClick={() => deleteTx(txToDelete)}
              className="px-6 py-3 bg-rose-600 text-white rounded-xl font-black shadow-lg"
            >
              Confirmer
            </button>
          </div>
        </div>
      </InternalModal>
    </div>
  );
}

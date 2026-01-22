import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Plus,
  CreditCard,
  Download,
  Edit2,
  Trash2,
  ShoppingBag,
  Search,
} from "lucide-react";
import Modal from "@/components/Modal.jsx";
import ConfirmationModal from "@/components/modal/ConfirmationModal.jsx";
import BonDeCommandeForm from "@/components/BonCommande/BonDeCommandeForm.jsx";
import BonDeCommandePaymentManager from "@/components/BonCommande/BonDeCommandePaymentManager.jsx";
import BonDeCommandePDF from "@/components/BonCommande/BonDeCommandePDF.jsx";
import PaginationControls from "@/components/PaginationControls.jsx";
import { toast } from "react-hot-toast";

export default function BonDeCommande() {
  const queryClient = useQueryClient();

  // State for filtering, sorting, and pagination
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingOrder, setEditingOrder] = useState(null);
  const [orderToDelete, setOrderToDelete] = useState(null);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [orderToPreview, setOrderToPreview] = useState(null);

  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState(searchTerm);
  const [sortBy, setSortBy] = useState("newest");
  const ordersPerPage = 10;

  // Debounce search input to avoid excessive API calls
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
      setCurrentPage(1); // Reset to first page on search
    }, 300);
    return () => clearTimeout(handler);
  }, [searchTerm]);

  // Reset page when sorting changes
  useEffect(() => {
    setCurrentPage(1);
  }, [sortBy]);

  // Fetch data with filters
  const { data: response, isLoading } = useQuery({
    queryKey: ["bon-de-commandes", currentPage, debouncedSearchTerm, sortBy],
    queryFn: () =>
      window.electronAPI.getBonDeCommandes({
        page: currentPage,
        limit: ordersPerPage,
        search: debouncedSearchTerm,
        sortBy: sortBy,
      }),
    placeholderData: (prev) => prev,
  });

  const orders = response?.data || [];
  const pagination = response?.pagination;

  const { mutate: deleteOrder } = useMutation({
    mutationFn: (id) => window.electronAPI.deleteBonDeCommande(id),
    onSuccess: () => {
      queryClient.invalidateQueries(["bon-de-commandes"]);
      toast.success("Bon de commande supprimé");
      setOrderToDelete(null);
    },
    onError: (err) => toast.error(err.message),
  });

  const handleSave = async (data) => {
    try {
      if (editingOrder) {
        await window.electronAPI.updateBonDeCommande({
          id: editingOrder.id,
          data,
        });
        toast.success("Bon de commande mis à jour");
      } else {
        await window.electronAPI.createBonDeCommande(data);
        toast.success("Bon de commande créé");
      }
      queryClient.invalidateQueries(["bon-de-commandes"]);
      setIsModalOpen(false);
      setEditingOrder(null);
    } catch (error) {
      toast.error(error.message);
    }
  };

  // PDF Generation Logic
  useEffect(() => {
    if (orderToPreview) {
      const generatePdf = async () => {
        const input = document.getElementById(
          `bc-preview-${orderToPreview.id}`,
        );
        if (input) {
          const toastId = toast.loading("Génération du PDF...", {
            id: "pdf-bc",
          });
          try {
            const result = await window.electronAPI.generateNativePDF({
              htmlContent: input.innerHTML,
              fileName: `BC_${orderToPreview.order_number}.pdf`,
            });
            if (result?.success)
              toast.success("Exporté avec succès !", { id: toastId });
            else toast.dismiss(toastId);
          } catch (e) {
            toast.error("Erreur lors de l'exportation PDF", { id: toastId });
          } finally {
            setOrderToPreview(null);
          }
        }
      };
      const timer = setTimeout(generatePdf, 150);
      return () => clearTimeout(timer);
    }
  }, [orderToPreview]);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold dark:text-white">
            Bons de Commande
          </h1>
          <p className="text-gray-500 mt-1">
            Gérez vos approvisionnements et commandes fournisseurs.
          </p>
        </div>
        <button
          onClick={() => {
            setEditingOrder(null);
            setIsModalOpen(true);
          }}
          className="bg-blue-600 text-white px-6 py-3 rounded-2xl font-bold flex items-center shadow-lg shadow-blue-500/20"
        >
          <Plus className="mr-2" /> Nouveau Bon
        </button>
      </div>

      {/* Search and Sort Controls */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="relative flex-1 w-full">
          <input
            type="text"
            placeholder="Rechercher par N°, Fournisseur ou Total..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all"
          />
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
        </div>
        <div className="w-full md:w-64">
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="w-full px-4 py-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl text-sm font-bold focus:ring-2 focus:ring-blue-500 outline-none"
          >
            <option value="newest">Plus récent</option>
            <option value="oldest">Plus ancien</option>
          </select>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-50 dark:bg-gray-700/50 text-[10px] font-black text-gray-400 uppercase tracking-widest">
              <tr>
                <th className="px-6 py-4">Date</th>
                <th className="px-6 py-4">N° Commande</th>
                <th className="px-6 py-4">Fournisseur</th>
                <th className="px-6 py-4">Total</th>
                <th className="px-6 py-4">Payé</th>
                <th className="px-6 py-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y dark:divide-gray-700">
              {isLoading ? (
                <tr>
                  <td
                    colSpan={6}
                    className="text-center py-20 animate-pulse text-gray-400 font-bold"
                  >
                    Chargement des commandes...
                  </td>
                </tr>
              ) : orders.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-20">
                    <ShoppingBag className="w-12 h-12 mx-auto text-gray-200 mb-4" />
                    <p className="text-gray-400 font-bold uppercase text-xs">
                      Aucun bon de commande trouvé
                    </p>
                  </td>
                </tr>
              ) : (
                orders.map((order) => (
                  <tr
                    key={order.id}
                    className="hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors group"
                  >
                    <td className="px-6 py-4 text-sm text-gray-400">
                      {new Date(order.date).toLocaleDateString("fr-FR")}
                    </td>
                    <td className="px-6 py-4 font-black dark:text-white">
                      {order.order_number}
                    </td>
                    <td className="px-6 py-4 dark:text-gray-300 font-bold">
                      {order.supplierName}
                    </td>

                    <td className="px-6 py-4 font-black dark:text-white">
                      {order.total.toLocaleString()}{" "}
                      <span className="text-[10px] opacity-40">MAD</span>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`text-sm font-bold ${order.totalPaid >= order.total - 0.1 ? "text-emerald-600" : "text-amber-600"}`}
                      >
                        {order.totalPaid.toLocaleString()} MAD
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex justify-center items-center gap-1">
                        <button
                          onClick={() => setSelectedOrder(order)}
                          className="p-2 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded-xl transition-all"
                          title="Gérer les paiements"
                        >
                          <CreditCard className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setOrderToPreview(order)}
                          className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-xl transition-all"
                          title="Télécharger PDF"
                        >
                          <Download className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => {
                            setEditingOrder(order);
                            setIsModalOpen(true);
                          }}
                          className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-gray-700 rounded-xl transition-all"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setOrderToDelete(order.id)}
                          className="p-2 text-gray-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-xl transition-all"
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

        {/* Pagination Controls */}
        {pagination && pagination.totalPages > 1 && (
          <div className="p-4 border-t dark:border-gray-700">
            <PaginationControls
              currentPage={currentPage}
              totalPages={pagination.totalPages}
              onPageChange={setCurrentPage}
            />
          </div>
        )}
      </div>

      {/* Modals */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingOrder ? "Modifier le Bon" : "Nouveau Bon de Commande"}
        size="xl"
      >
        <BonDeCommandeForm
          onSave={handleSave}
          onCancel={() => setIsModalOpen(false)}
          existingOrder={editingOrder}
        />
      </Modal>

      <Modal
        isOpen={!!selectedOrder}
        onClose={() => setSelectedOrder(null)}
        title={`Paiements Fournisseur - ${selectedOrder?.order_number}`}
        size="lg"
      >
        {selectedOrder && <BonDeCommandePaymentManager order={selectedOrder} />}
      </Modal>

      <ConfirmationModal
        isOpen={!!orderToDelete}
        onClose={() => setOrderToDelete(null)}
        onConfirm={() => deleteOrder(orderToDelete)}
        title="Supprimer la commande"
        message="Voulez-vous vraiment supprimer ce bon de commande ? Les transactions financières liées ne seront pas supprimées automatiquement."
      />

      {/* Hidden PDF Rendering Container */}
      {orderToPreview && (
        <div
          style={{
            position: "absolute",
            left: "-9999px",
            top: 0,
            width: "210mm",
            backgroundColor: "white",
          }}
        >
          <div id={`bc-preview-${orderToPreview.id}`}>
            <BonDeCommandePDF order={orderToPreview} />
          </div>
        </div>
      )}
    </div>
  );
}

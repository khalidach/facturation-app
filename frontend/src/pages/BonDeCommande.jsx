import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Plus,
  CreditCard,
  Download,
  Edit2,
  Trash2,
  ShoppingBag,
} from "lucide-react";
import Modal from "@/components/Modal.jsx";
import ConfirmationModal from "@/components/modal/ConfirmationModal.jsx";
import BonDeCommandeForm from "@/components/BonCommande/BonDeCommandeForm.jsx";
import BonDeCommandePaymentManager from "@/components/BonCommande/BonDeCommandePaymentManager.jsx";
import BonDeCommandePDF from "@/components/BonCommande/BonDeCommandePDF.jsx";
import { toast } from "react-hot-toast";
import { jsPDF } from "jspdf";
import html2canvas from "html2canvas";

export default function BonDeCommande() {
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingOrder, setEditingOrder] = useState(null);
  const [orderToDelete, setOrderToDelete] = useState(null);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [orderToPreview, setOrderToPreview] = useState(null);

  const { data: response, isLoading } = useQuery({
    queryKey: ["bon-de-commandes"],
    queryFn: () => window.electronAPI.getBonDeCommandes({ page: 1, limit: 50 }),
  });

  const orders = response?.data || [];

  const { mutate: deleteOrder } = useMutation({
    mutationFn: window.electronAPI.deleteBonDeCommande,
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
        await window.electronAPI.updateBonDeCommande(editingOrder.id, data);
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

  useEffect(() => {
    if (orderToPreview) {
      const generatePdf = async () => {
        const input = document.getElementById(
          `bc-preview-${orderToPreview.id}`
        );
        if (input) {
          try {
            toast.loading("Génération du PDF...", { id: "pdf-bc" });
            const canvas = await html2canvas(input, {
              scale: 2,
              useCORS: true,
              width: 794,
            });
            const imgData = canvas.toDataURL("image/png");
            const pdf = new jsPDF("p", "mm", "a4");
            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
            pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);
            pdf.save(`BC_${orderToPreview.order_number}.pdf`);
            toast.success("PDF téléchargé", { id: "pdf-bc" });
          } catch (e) {
            toast.error("Erreur PDF", { id: "pdf-bc" });
          } finally {
            setOrderToPreview(null);
          }
        }
      };
      setTimeout(generatePdf, 500);
    }
  }, [orderToPreview]);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold dark:text-white">Bons de Commande</h1>
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

      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-gray-50 dark:bg-gray-700/50 text-[10px] font-black text-gray-400 uppercase tracking-widest">
            <tr>
              <th className="px-6 py-4">N° Commande</th>
              <th className="px-6 py-4">Fournisseur</th>
              <th className="px-6 py-4">Total</th>
              <th className="px-6 py-4">Payé</th>
              <th className="px-6 py-4 text-center">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y dark:divide-gray-700">
            {orders.map((order) => (
              <tr
                key={order.id}
                className="hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors"
              >
                <td className="px-6 py-4 font-bold dark:text-white">
                  {order.order_number}
                </td>
                <td className="px-6 py-4 dark:text-gray-300">
                  {order.supplierName}
                </td>
                <td className="px-6 py-4 font-black dark:text-white">
                  {order.total.toLocaleString()} MAD
                </td>
                <td className="px-6 py-4 font-bold text-emerald-600">
                  {order.totalPaid.toLocaleString()} MAD
                </td>
                <td className="px-6 py-4">
                  <div className="flex justify-center items-center gap-1">
                    <button
                      onClick={() => setSelectedOrder(order)}
                      className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg"
                      title="Paiements"
                    >
                      <CreditCard className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setOrderToPreview(order)}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                      title="Télécharger PDF"
                    >
                      <Download className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => {
                        setEditingOrder(order);
                        setIsModalOpen(true);
                      }}
                      className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setOrderToDelete(order.id)}
                      className="p-2 text-rose-600 hover:bg-rose-50 rounded-lg"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

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
        message="Voulez-vous vraiment supprimer ce bon de commande ? Cette action est irréversible."
      />

      {orderToPreview && (
        <div style={{ position: "absolute", left: "-9999px", top: 0 }}>
          <div id={`bc-preview-${orderToPreview.id}`}>
            <BonDeCommandePDF order={orderToPreview} />
          </div>
        </div>
      )}
    </div>
  );
}

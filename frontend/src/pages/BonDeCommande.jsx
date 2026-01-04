import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, CreditCard, ShoppingBag, Trash2 } from "lucide-react";
import Modal from "@/components/Modal.jsx";
import BonDeCommandeForm from "@/components/BonCommande/BonDeCommandeForm.jsx"; // Create form based on FactureForm
import BonDeCommandePaymentManager from "@/components/BonCommande/BonDeCommandePaymentManager.jsx";
import { toast } from "react-hot-toast";

export default function BonDeCommande() {
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);

  const { data: response, isLoading } = useQuery({
    queryKey: ["bon-de-commandes"],
    queryFn: () => window.electronAPI.getBonDeCommandes({ page: 1, limit: 50 }),
  });

  const orders = response?.data || [];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold dark:text-white">Bons de Commande</h1>
        <button
          onClick={() => setIsModalOpen(true)}
          className="bg-blue-600 text-white px-6 py-3 rounded-2xl font-bold flex items-center"
        >
          <Plus className="mr-2" /> Nouveau Bon
        </button>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-gray-50 dark:bg-gray-700/50 text-xs font-bold text-gray-400 uppercase">
            <tr>
              <th className="px-6 py-4">N° Commande</th>
              <th className="px-6 py-4">Fournisseur</th>
              <th className="px-6 py-4">Total</th>
              <th className="px-6 py-4">Payé</th>
              <th className="px-6 py-4">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y dark:divide-gray-700">
            {orders.map((order) => (
              <tr
                key={order.id}
                className="hover:bg-gray-50 dark:hover:bg-gray-700/30 dark:text-white"
              >
                <td className="px-6 py-4 font-bold">{order.order_number}</td>
                <td className="px-6 py-4">{order.supplierName}</td>
                <td className="px-6 py-4">
                  {order.total.toLocaleString()} MAD
                </td>
                <td className="px-6 py-4 font-bold text-emerald-600">
                  {order.totalPaid.toLocaleString()} MAD
                </td>
                <td className="px-6 py-4">
                  <button
                    onClick={() => setSelectedOrder(order)}
                    className="p-2 hover:bg-blue-50 rounded-lg text-blue-600"
                  >
                    <CreditCard className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Nouveau Bon de Commande"
        size="xl"
      >
        <BonDeCommandeForm
          onSave={(data) => {
            window.electronAPI.createBonDeCommande(data).then(() => {
              queryClient.invalidateQueries(["bon-de-commandes"]);
              setIsModalOpen(false);
              toast.success("Bon de commande créé");
            });
          }}
          onCancel={() => setIsModalOpen(false)}
        />
      </Modal>

      <Modal
        isOpen={!!selectedOrder}
        onClose={() => setSelectedOrder(null)}
        title={`Paiements Fournisseur - ${selectedOrder?.order_number}`}
      >
        {selectedOrder && <BonDeCommandePaymentManager order={selectedOrder} />}
      </Modal>
    </div>
  );
}

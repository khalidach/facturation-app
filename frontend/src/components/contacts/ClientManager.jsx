import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Edit2, Trash2, User } from "lucide-react";
import { toast } from "react-hot-toast";
import Modal from "@/components/Modal.jsx";
import ConfirmationModal from "@/components/modal/ConfirmationModal.jsx";
import PaginationControls from "@/components/PaginationControls.jsx";
import ClientForm from "@/components/contacts/ClientForm.jsx";

export default function ClientManager() {
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingClient, setEditingClient] = useState(null);
  const [clientToDelete, setClientToDelete] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState(searchTerm);
  const clientsPerPage = 10;

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
      setCurrentPage(1);
    }, 300);
    return () => clearTimeout(handler);
  }, [searchTerm]);

  const { data: clientsResponse, isLoading } = useQuery({
    queryKey: ["clients", currentPage, debouncedSearchTerm],
    queryFn: () =>
      window.electronAPI.getClients({
        page: currentPage,
        limit: clientsPerPage,
        search: debouncedSearchTerm,
      }),
    placeholderData: (prev) => prev,
  });

  const clients = clientsResponse?.data ?? [];
  const pagination = clientsResponse?.pagination;

  const { mutate: createClient } = useMutation({
    mutationFn: window.electronAPI.createClient,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["clients"] });
      toast.success("Client créé avec succès !");
      setIsModalOpen(false);
    },
    onError: (error) => toast.error(error.message),
  });

  const { mutate: updateClient } = useMutation({
    mutationFn: (data) => window.electronAPI.updateClient(data.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["clients"] });
      toast.success("Client mis à jour avec succès !");
      setIsModalOpen(false);
    },
    onError: (error) => toast.error(error.message),
  });

  const { mutate: deleteClient } = useMutation({
    mutationFn: window.electronAPI.deleteClient,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["clients"] });
      toast.success("Client supprimé avec succès !");
      setClientToDelete(null);
    },
    onError: (error) => toast.error(error.message),
  });

  const handleSave = (data) => {
    if (editingClient) {
      updateClient({ ...editingClient, ...data });
    } else {
      createClient(data);
    }
  };

  return (
    <>
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="relative w-full md:max-w-md">
            <input
              type="text"
              placeholder="Rechercher par Nom, Email, Téléphone, ICE..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <button
            onClick={() => {
              setEditingClient(null);
              setIsModalOpen(true);
            }}
            className="inline-flex items-center justify-center w-full md:w-auto px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 shadow-sm"
          >
            <Plus className="w-5 h-5 mr-2" />
            Nouveau Client
          </button>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-700/50">
              <tr>
                {["Nom", "ICE", "Email", "Téléphone", "Actions"].map((h) => (
                  <th
                    key={h}
                    className="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="text-center p-4">
                    Chargement...
                  </td>
                </tr>
              ) : clients.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center p-12">
                    <User className="w-12 h-12 mx-auto text-gray-300 dark:text-gray-600" />
                    <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-gray-100">
                      Aucun client trouvé
                    </h3>
                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                      Essayez d'ajuster votre recherche ou créez un nouveau
                      client.
                    </p>
                  </td>
                </tr>
              ) : (
                clients.map((client) => (
                  <tr
                    key={client.id}
                    className="hover:bg-gray-50 dark:hover:bg-gray-700/50"
                  >
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-100">
                      {client.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">
                      {client.ice || "N/A"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">
                      {client.email || "N/A"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">
                      {client.phone || "N/A"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => {
                            setEditingClient(client);
                            setIsModalOpen(true);
                          }}
                          className="p-2 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-gray-700 rounded-lg"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setClientToDelete(client.id)}
                          className="p-2 text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-gray-700 rounded-lg"
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
          {pagination && pagination.totalPages > 1 && (
            <div className="p-4">
              <PaginationControls
                currentPage={currentPage}
                totalPages={pagination.totalPages}
                onPageChange={setCurrentPage}
              />
            </div>
          )}
        </div>
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingClient(null);
        }}
        title={editingClient ? "Modifier le Client" : "Nouveau Client"}
        size="lg"
      >
        <ClientForm
          onSave={handleSave}
          onCancel={() => setIsModalOpen(false)}
          existingClient={editingClient}
        />
      </Modal>

      <ConfirmationModal
        isOpen={!!clientToDelete}
        onClose={() => setClientToDelete(null)}
        onConfirm={() => deleteClient(clientToDelete)}
        title="Supprimer le Client"
        message="Êtes-vous sûr de vouloir supprimer ce client ? Cette action est irréversible."
      />
    </>
  );
}

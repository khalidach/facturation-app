import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Plus,
  Download,
  Edit2,
  Trash2,
  FileText,
  CreditCard,
} from "lucide-react";
import Modal from "@/components/Modal.jsx";
import ConfirmationModal from "@/components/modal/ConfirmationModal.jsx";
import FactureForm from "@/components/facturation/FactureForm.jsx";
import FacturePDF from "@/components/facturation/FacturePDF.jsx";
import PaymentManager from "@/components/facturation/PaymentManager.jsx";
import { toast } from "react-hot-toast";
import PaginationControls from "@/components/PaginationControls.jsx";

export default function Facturation() {
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingFacture, setEditingFacture] = useState(null);
  const [factureToDelete, setFactureToDelete] = useState(null);
  const [factureToPreview, setFactureToPreview] = useState(null);
  const [factureForPayment, setFactureForPayment] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("newest");
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState(searchTerm);
  const facturesPerPage = 10;

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
      setCurrentPage(1);
    }, 300);
    return () => clearTimeout(handler);
  }, [searchTerm]);

  useEffect(() => {
    setCurrentPage(1);
  }, [sortBy]);

  const { data: facturesResponse, isLoading } = useQuery({
    queryKey: ["factures", currentPage, debouncedSearchTerm, sortBy],
    queryFn: () =>
      window.electronAPI.getFactures({
        page: currentPage,
        limit: facturesPerPage,
        search: debouncedSearchTerm,
        sortBy: sortBy,
      }),
    placeholderData: (prev) => prev,
  });

  const factures = facturesResponse?.data ?? [];
  const pagination = facturesResponse?.pagination;

  const getPaymentStatus = (total, totalPaid) => {
    if (totalPaid <= 0) {
      return {
        label: "Impayé",
        class: "bg-rose-100 text-rose-600 dark:bg-rose-900/20",
      };
    }
    if (totalPaid < total - 0.1) {
      return {
        label: "Partiel",
        class: "bg-amber-100 text-amber-600 dark:bg-amber-900/20",
      };
    }
    return {
      label: "Payé",
      class: "bg-emerald-100 text-emerald-600 dark:bg-emerald-900/20",
    };
  };

  const { mutate: createFacture } = useMutation({
    mutationFn: window.electronAPI.createFacture,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["factures"] });
      toast.success("Document créé avec succès !");
      setIsModalOpen(false);
    },
    onError: (error) => toast.error(error.message),
  });

  const { mutate: updateFacture } = useMutation({
    mutationFn: (mergedData) => {
      // 1. Destructure to remove fields that the backend Schema doesn't expect
      const {
        id,
        totalPaid,
        createdAt,
        updatedAt,
        facture_number_int,
        ...cleanData
      } = mergedData;

      // 2. Explicitly ensure showMargin is a boolean before sending
      const finalData = {
        ...cleanData,
        showMargin: Boolean(cleanData.showMargin),
      };

      return window.electronAPI.updateFacture({
        id: id,
        data: finalData,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["factures"] });
      toast.success("Document mis à jour avec succès !");
      setIsModalOpen(false);
      setEditingFacture(null);
    },
    onError: (error) => {
      console.error("Update failed:", error);
      toast.error(`Erreur: ${error.message}`);
    },
  });

  const { mutate: deleteFacture } = useMutation({
    mutationFn: (id) => window.electronAPI.deleteFacture(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["factures"] });
      toast.success("Document supprimé avec succès !");
      setFactureToDelete(null);
    },
    onError: (error) => toast.error(error.message),
  });

  const handleSave = (data) => {
    if (editingFacture) {
      // Merge editingFacture (contains ID) with new data from form
      updateFacture({ ...editingFacture, ...data });
    } else {
      createFacture(data);
    }
  };

  useEffect(() => {
    if (factureToPreview) {
      const generatePdf = async () => {
        const input = document.getElementById(
          `pdf-preview-${factureToPreview.id}`,
        );
        if (input) {
          const toastId = toast.loading(
            "Préparation du PDF haute définition...",
            { id: "pdf-toast" },
          );
          try {
            const result = await window.electronAPI.generateNativePDF({
              htmlContent: input.innerHTML,
              fileName: `${factureToPreview.type}_${factureToPreview.facture_number}.pdf`,
            });

            if (result.success) {
              toast.success("Document exporté avec succès !", {
                id: "pdf-toast",
              });
            } else {
              toast.dismiss("pdf-toast");
            }
          } catch (error) {
            console.error("Erreur PDF Native:", error);
            toast.error("Erreur lors de la génération du PDF.", {
              id: "pdf-toast",
            });
          } finally {
            setFactureToPreview(null);
          }
        }
      };
      const timer = setTimeout(generatePdf, 150);
      return () => clearTimeout(timer);
    }
  }, [factureToPreview]);

  const handleDownloadPDF = (facture) => {
    setFactureToPreview(facture);
  };

  return (
    <>
      <div className="space-y-6">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
              Facturation
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2">
              Gérez vos factures et vos devis.
            </p>
          </div>
          <button
            onClick={() => {
              setEditingFacture(null);
              setIsModalOpen(true);
            }}
            className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-2xl hover:bg-blue-700 shadow-xl shadow-blue-500/20 transition-all font-black text-sm"
          >
            <Plus className="w-5 h-5 mr-2" /> Nouveau Document
          </button>
        </div>

        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="relative flex-1 w-full">
            <input
              type="text"
              placeholder="Chercher par N°, Client ou Total..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="w-full md:w-auto">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="newest">Trier par plus récent</option>
              <option value="oldest">Trier par plus ancien</option>
            </select>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-700/50">
              <tr>
                {[
                  "Date",
                  "N°",
                  "Type",
                  "Client",
                  "Total",
                  "Paiement",
                  "Actions",
                ].map((h) => (
                  <th
                    key={h}
                    className="px-6 py-4 text-left text-xs font-black text-gray-400 uppercase tracking-widest"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {isLoading ? (
                <tr>
                  <td
                    colSpan={7}
                    className="text-center p-10 italic text-gray-500 font-bold animate-pulse"
                  >
                    Synchronisation de la base...
                  </td>
                </tr>
              ) : factures.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center p-12">
                    <FileText className="w-12 h-12 mx-auto text-gray-300 dark:text-gray-600" />
                    <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-gray-100">
                      Aucun document trouvé
                    </h3>
                  </td>
                </tr>
              ) : (
                factures.map((facture) => {
                  const status = getPaymentStatus(
                    facture.total,
                    facture.totalPaid,
                  );
                  return (
                    <tr
                      key={facture.id}
                      className="hover:bg-gray-50 dark:hover:bg-gray-700/50 group transition-colors"
                    >
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-400">
                        {new Date(facture.date).toLocaleDateString("fr-FR")}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-black text-gray-900 dark:text-gray-100">
                        {facture.facture_number}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-xs font-black uppercase text-gray-400">
                        <span
                          className={`px-2 py-1 rounded-md ${
                            facture.type === "facture"
                              ? "bg-blue-50 text-blue-600 dark:bg-blue-900/20"
                              : "bg-amber-50 text-amber-600 dark:bg-amber-900/20"
                          }`}
                        >
                          {facture.type === "facture" ? "Facture" : "Devis"}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-700 dark:text-gray-300">
                        {facture.clientName}
                      </td>

                      <td className="px-6 py-4 whitespace-nowrap text-sm font-black text-gray-900 dark:text-white">
                        {facture.total.toLocaleString()}{" "}
                        <span className="text-[10px] opacity-40">MAD</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${status.class}`}
                        >
                          {status.label}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex items-center space-x-1">
                          <button
                            onClick={() => setFactureForPayment(facture)}
                            className="p-2 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/30 rounded-xl transition-all"
                            title="Gérer les règlements"
                          >
                            <CreditCard className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDownloadPDF(facture)}
                            className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-xl transition-all"
                          >
                            <Download className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => {
                              setEditingFacture(facture);
                              setIsModalOpen(true);
                            }}
                            className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-xl transition-all"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setFactureToDelete(facture.id)}
                            className="p-2 text-gray-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/30 rounded-xl transition-all"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
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

        <Modal
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setEditingFacture(null);
          }}
          title={
            editingFacture
              ? "Modification du document"
              : "Création d'un document"
          }
          size="xl"
        >
          <FactureForm
            onSave={handleSave}
            onCancel={() => setIsModalOpen(false)}
            existingFacture={editingFacture}
          />
        </Modal>

        <Modal
          isOpen={!!factureForPayment}
          onClose={() => setFactureForPayment(null)}
          title={`Gestion des règlements • ${factureForPayment?.facture_number}`}
          size="lg"
        >
          {factureForPayment && <PaymentManager facture={factureForPayment} />}
        </Modal>

        <ConfirmationModal
          isOpen={!!factureToDelete}
          onClose={() => setFactureToDelete(null)}
          onConfirm={() => deleteFacture(factureToDelete)}
          title="Confirmer la suppression"
          message="Voulez-vous vraiment supprimer ce document ? Cette action n'impactera pas les transactions financières déjà enregistrées."
        />
      </div>

      {factureToPreview && (
        <div
          style={{
            position: "absolute",
            left: "-9999px",
            top: 0,
            width: "210mm",
            backgroundColor: "white",
          }}
        >
          <div id={`pdf-preview-${factureToPreview.id}`}>
            <FacturePDF facture={factureToPreview} />
          </div>
        </div>
      )}
    </>
  );
}

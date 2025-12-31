import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Download, Edit2, Trash2, FileText } from "lucide-react";
import Modal from "@/components/Modal.jsx";
import ConfirmationModal from "@/components/modal/ConfirmationModal.jsx";
import FactureForm from "@/components/facturation/FactureForm.jsx";
import FacturePDF from "@/components/facturation/FacturePDF.jsx";
import { toast } from "react-hot-toast";
import { jsPDF } from "jspdf";
import html2canvas from "html2canvas";
import PaginationControls from "@/components/PaginationControls.jsx";

export default function Facturation() {
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingFacture, setEditingFacture] = useState(null);
  const [factureToDelete, setFactureToDelete] = useState(null);
  const [factureToPreview, setFactureToPreview] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("newest");
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState(searchTerm);
  const facturesPerPage = 10;

  // Délai pour la recherche
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
      setCurrentPage(1); // Retour à la première page lors d'une nouvelle recherche
    }, 300);

    return () => {
      clearTimeout(handler);
    };
  }, [searchTerm]);

  // Réinitialiser la page lors du changement de tri
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
    mutationFn: (data) => window.electronAPI.updateFacture(data.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["factures"] });
      toast.success("Document mis à jour avec succès !");
      setIsModalOpen(false);
    },
    onError: (error) => toast.error(error.message),
  });

  const { mutate: deleteFacture } = useMutation({
    mutationFn: window.electronAPI.deleteFacture,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["factures"] });
      toast.success("Document supprimé avec succès !");
      setFactureToDelete(null);
    },
    onError: (error) => toast.error(error.message),
  });

  const handleSave = (data) => {
    if (editingFacture) {
      updateFacture({ ...editingFacture, ...data });
    } else {
      createFacture(data);
    }
  };

  useEffect(() => {
    if (factureToPreview) {
      const generatePdf = async () => {
        const input = document.getElementById(
          `pdf-preview-${factureToPreview.id}`
        );
        if (input) {
          try {
            toast.loading("Génération du PDF...", { id: "pdf-toast" });
            const canvas = await html2canvas(input, {
              scale: 2,
              useCORS: true,
            });
            const imgData = canvas.toDataURL("image/png");
            const pdf = new jsPDF("p", "mm", "a4");
            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
            pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);
            pdf.save(
              `${factureToPreview.type}_${factureToPreview.facture_number}.pdf`
            );
            toast.success("PDF téléchargé !", { id: "pdf-toast" });
          } catch (error) {
            console.error("Échec de la génération du PDF :", error);
            toast.error("Échec de la génération du PDF.", { id: "pdf-toast" });
          } finally {
            setFactureToPreview(null);
          }
        }
      };

      const timer = setTimeout(generatePdf, 100);
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
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 shadow-sm transition-colors"
          >
            <Plus className="w-5 h-5 mr-2" />
            Nouveau Document
          </button>
        </div>

        {/* Contrôles de recherche et de filtrage */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="relative w-full md:max-w-md">
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
                {["N°", "Type", "Client", "Date", "Total", "Actions"].map(
                  (h) => (
                    <th
                      key={h}
                      className="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
                    >
                      {h}
                    </th>
                  )
                )}
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {isLoading ? (
                <tr>
                  <td
                    colSpan={6}
                    className="text-center p-4 italic text-gray-500"
                  >
                    Chargement...
                  </td>
                </tr>
              ) : factures.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center p-12">
                    <FileText className="w-12 h-12 mx-auto text-gray-300 dark:text-gray-600" />
                    <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-gray-100">
                      Aucun document trouvé
                    </h3>
                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                      Essayez d'ajuster votre recherche ou créez un nouveau
                      document.
                    </p>
                  </td>
                </tr>
              ) : (
                factures.map((facture) => (
                  <tr
                    key={facture.id}
                    className="hover:bg-gray-50 dark:hover:bg-gray-700/50"
                  >
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-100">
                      {facture.facture_number}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm capitalize text-gray-700 dark:text-gray-300">
                      {facture.type === "facture" ? "Facture" : "Devis"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">
                      {facture.clientName}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">
                      {new Date(facture.date).toLocaleDateString("fr-FR")}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">
                      {facture.total.toLocaleString()} MAD
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => handleDownloadPDF(facture)}
                          className="p-2 text-gray-400 hover:text-green-600 dark:hover:text-green-400 hover:bg-green-50 dark:hover:bg-gray-700 rounded-lg transition-colors"
                          title="Télécharger PDF"
                        >
                          <Download className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => {
                            setEditingFacture(facture);
                            setIsModalOpen(true);
                          }}
                          className="p-2 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-gray-700 rounded-lg transition-colors"
                          title="Modifier"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setFactureToDelete(facture.id)}
                          className="p-2 text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-gray-700 rounded-lg transition-colors"
                          title="Supprimer"
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

        <Modal
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setEditingFacture(null);
          }}
          title={editingFacture ? "Modifier le document" : "Nouveau document"}
          size="xl"
        >
          <FactureForm
            onSave={handleSave}
            onCancel={() => setIsModalOpen(false)}
            existingFacture={editingFacture}
          />
        </Modal>

        <ConfirmationModal
          isOpen={!!factureToDelete}
          onClose={() => setFactureToDelete(null)}
          onConfirm={() => deleteFacture(factureToDelete)}
          title="Supprimer le document"
          message="Êtes-vous sûr de vouloir supprimer ce document ?"
        />
      </div>

      {/* Conteneur caché pour la génération du PDF */}
      {factureToPreview && (
        <div style={{ position: "absolute", left: "-9999px", top: 0 }}>
          <div id={`pdf-preview-${factureToPreview.id}`}>
            <FacturePDF facture={factureToPreview} />
          </div>
        </div>
      )}
    </>
  );
}

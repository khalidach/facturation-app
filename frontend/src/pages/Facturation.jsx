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

// API helper to handle responses and errors
const handleApiResponse = async (response) => {
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(
      errorData.error || `Request failed: ${response.statusText}`
    );
  }
  return response.json();
};

// Mock API functions - replace with actual API calls to your backend
const api = {
  getFactures: (page = 1, limit = 10) =>
    fetch(
      `http://localhost:3001/api/factures?page=${page}&limit=${limit}`
    ).then(handleApiResponse),
  createFacture: (data) =>
    fetch("http://localhost:3001/api/factures", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    }).then(handleApiResponse),
  updateFacture: (id, data) =>
    fetch(`http://localhost:3001/api/factures/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    }).then(handleApiResponse),
  deleteFacture: (id) =>
    fetch(`http://localhost:3001/api/factures/${id}`, {
      method: "DELETE",
    }).then((res) => {
      if (!res.ok) {
        throw new Error("Failed to delete");
      }
      // DELETE might not return a body, so we don't call .json()
      return;
    }),
};

export default function Facturation() {
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingFacture, setEditingFacture] = useState(null);
  const [factureToDelete, setFactureToDelete] = useState(null);
  const [factureToPreview, setFactureToPreview] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const facturesPerPage = 10;

  const { data: facturesResponse, isLoading } = useQuery({
    queryKey: ["factures", currentPage],
    queryFn: () => api.getFactures(currentPage, facturesPerPage),
    placeholderData: (prev) => prev,
  });

  const factures = facturesResponse?.data ?? [];
  const pagination = facturesResponse?.pagination;

  const { mutate: createFacture } = useMutation({
    mutationFn: api.createFacture,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["factures"] });
      toast.success("Document created successfully!");
      setIsModalOpen(false);
    },
    onError: (error) => toast.error(error.message),
  });

  const { mutate: updateFacture } = useMutation({
    mutationFn: (data) => api.updateFacture(data.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["factures"] });
      toast.success("Document updated successfully!");
      setIsModalOpen(false);
    },
    onError: (error) => toast.error(error.message),
  });

  const { mutate: deleteFacture } = useMutation({
    mutationFn: api.deleteFacture,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["factures"] });
      toast.success("Document deleted successfully!");
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
        // A short delay to ensure all content (like images) is loaded
        await new Promise((resolve) => setTimeout(resolve, 300));

        const input = document.getElementById("pdf-preview");
        if (input) {
          try {
            toast.loading("Generating PDF...", { id: "pdf-toast" });
            const canvas = await html2canvas(input, { scale: 2 });
            const imgData = canvas.toDataURL("image/png");
            const pdf = new jsPDF("p", "mm", "a4");
            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
            pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);
            pdf.save(
              `${factureToPreview.type}_${factureToPreview.clientName.replace(
                /\s/g,
                "_"
              )}.pdf`
            );
            toast.success("PDF Downloaded!", { id: "pdf-toast" });
          } catch (error) {
            console.error("Failed to generate PDF:", error);
            toast.error("Failed to generate PDF.", { id: "pdf-toast" });
          } finally {
            // Reset the state to remove the preview component from the DOM
            setFactureToPreview(null);
          }
        } else {
          toast.error("PDF preview element not found.");
          setFactureToPreview(null);
        }
      };

      generatePdf();
    }
  }, [factureToPreview]);

  const handleDownloadPDF = (facture) => {
    setFactureToPreview(facture);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
            Facturation
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Manage your invoices and quotes.
          </p>
        </div>
        <button
          onClick={() => {
            setEditingFacture(null);
            setIsModalOpen(true);
          }}
          className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 shadow-sm"
        >
          <Plus className="w-5 h-5 mr-2" />
          New Document
        </button>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 dark:bg-gray-700/50">
            <tr>
              {["N°", "Type", "Client", "Date", "Total", "Actions"].map((h) => (
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
                <td colSpan={6} className="text-center p-4">
                  Loading...
                </td>
              </tr>
            ) : factures.length === 0 ? (
              <tr>
                <td colSpan={6} className="text-center p-12">
                  <FileText className="w-12 h-12 mx-auto text-gray-300 dark:text-gray-600" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-gray-100">
                    No documents
                  </h3>
                  <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                    Create your first document to get started.
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
                    {facture.type}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">
                    {facture.clientName}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">
                    {new Date(facture.date).toLocaleDateString("en-GB")}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">
                    {facture.total.toLocaleString()} MAD
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleDownloadPDF(facture)}
                        className="p-2 text-gray-400 hover:text-green-600 dark:hover:text-green-400 hover:bg-green-50 dark:hover:bg-gray-700 rounded-lg"
                      >
                        <Download className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => {
                          setEditingFacture(facture);
                          setIsModalOpen(true);
                        }}
                        className="p-2 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-gray-700 rounded-lg"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setFactureToDelete(facture.id)}
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

      <Modal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingFacture(null);
        }}
        title={editingFacture ? "Update Document" : "New Document"}
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
        title="Delete Document"
        message="Are you sure you want to delete this document?"
      />

      {factureToPreview && (
        <div style={{ position: "fixed", left: "-9999px", top: "-9999px" }}>
          <div id="pdf-preview">
            <FacturePDF facture={factureToPreview} />
          </div>
        </div>
      )}
    </div>
  );
}
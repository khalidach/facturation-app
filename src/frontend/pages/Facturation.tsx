import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Download, Edit2, Trash2, FileText } from "lucide-react";
import FactureForm from "@/components/FactureForm";
import FacturePDF from "@/components/FacturePDF";
import { toast } from "react-hot-toast";
import { jsPDF } from "jspdf";
import html2canvas from "html2canvas";
import { Facture, PaginatedResponse } from "@/models";

export default function Facturation() {
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingFacture, setEditingFacture] = useState<Facture | null>(null);
  const [factureToDelete, setFactureToDelete] = useState<number | null>(null);
  const [factureToPreview, setFactureToPreview] = useState<Facture | null>(
    null
  );
  const [currentPage, setCurrentPage] = useState(1);
  const facturesPerPage = 10;

  const { data: facturesResponse, isLoading } = useQuery<
    PaginatedResponse<Facture>
  >({
    queryKey: ["factures", currentPage],
    queryFn: () => window.electronAPI.getFactures(currentPage, facturesPerPage),
  });

  const factures = facturesResponse?.data ?? [];
  const pagination = facturesResponse?.pagination;

  const { mutate: createFacture } = useMutation({
    mutationFn: (data: Omit<Facture, "id" | "facture_number">) =>
      window.electronAPI.createFacture(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["factures"] });
      toast.success("Document created successfully!");
      setIsModalOpen(false);
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const { mutate: updateFacture } = useMutation({
    mutationFn: (data: Facture) => window.electronAPI.updateFacture(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["factures"] });
      toast.success("Document updated successfully!");
      setIsModalOpen(false);
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const { mutate: deleteFacture } = useMutation({
    mutationFn: (id: number) => window.electronAPI.deleteFacture(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["factures"] });
      toast.success("Document deleted successfully!");
      setFactureToDelete(null);
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const handleSave = (data: Omit<Facture, "id" | "facture_number">) => {
    if (editingFacture) {
      updateFacture({ ...editingFacture, ...data });
    } else {
      createFacture(data);
    }
  };

  const handleDownloadPDF = async (facture: Facture) => {
    setFactureToPreview(facture);
    await new Promise((resolve) => setTimeout(resolve, 100));

    const input = document.getElementById("pdf-preview");
    if (input) {
      html2canvas(input, { scale: 2 }).then((canvas) => {
        const imgData = canvas.toDataURL("image/png");
        const pdf = new jsPDF("p", "mm", "a4");
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
        pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);
        pdf.save(
          `${facture.type}_${facture.clientName.replace(/\s/g, "_")}.pdf`
        );
        setFactureToPreview(null);
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
            Facturation
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Create and manage your invoices and quotes.
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

      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 dark:bg-gray-700/50">
            <tr>
              {["N°", "Type", "Client Name", "Date", "Total", "Actions"].map(
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
                <td colSpan={6} className="text-center p-4">
                  Loading...
                </td>
              </tr>
            ) : factures.length === 0 ? (
              <tr>
                <td colSpan={6} className="text-center p-12">
                  <FileText className="w-12 h-12 mx-auto text-gray-300 dark:text-gray-600" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-gray-100">
                    No Documents
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
                    {new Date(facture.date).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">
                    {facture.total.toLocaleString()} MAD
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleDownloadPDF(facture)}
                        className="p-2 text-gray-400 hover:text-green-600"
                      >
                        <Download className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => {
                          setEditingFacture(facture);
                          setIsModalOpen(true);
                        }}
                        className="p-2 text-gray-400 hover:text-blue-600"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setFactureToDelete(facture.id)}
                        className="p-2 text-gray-400 hover:text-red-600"
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

      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 w-full max-w-4xl">
            <h2 className="text-xl font-bold mb-4">
              {editingFacture ? "Update Document" : "New Document"}
            </h2>
            <FactureForm
              onSave={handleSave}
              onCancel={() => setIsModalOpen(false)}
              existingFacture={editingFacture}
            />
          </div>
        </div>
      )}

      {factureToDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6">
            <h3 className="text-lg font-bold">Delete Document</h3>
            <p className="my-4">
              Are you sure you want to delete this document?
            </p>
            <div className="flex justify-end gap-4">
              <button
                onClick={() => setFactureToDelete(null)}
                className="px-4 py-2 rounded-lg border"
              >
                Cancel
              </button>
              <button
                onClick={() => deleteFacture(factureToDelete)}
                className="px-4 py-2 rounded-lg bg-red-600 text-white"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

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

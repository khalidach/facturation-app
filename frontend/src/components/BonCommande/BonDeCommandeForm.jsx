import React, { useState, useEffect, useMemo } from "react";
import { Plus, Trash2 } from "lucide-react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import SupplierSearch from "./SupplierSearch.jsx";

const emptyItem = {
  description: "",
  quantity: 1,
  prixUnitaire: 0,
  fraisServiceUnitaire: 0,
};

export default function BonDeCommandeForm({ onSave, onCancel, existingOrder }) {
  const [supplierName, setSupplierName] = useState("");
  const [supplierAddress, setSupplierAddress] = useState("");
  const [supplierICE, setSupplierICE] = useState("");
  const [date, setDate] = useState(new Date());
  const [items, setItems] = useState([emptyItem]);
  const [notes, setNotes] = useState("");
  const [orderNumber, setOrderNumber] = useState("");

  useEffect(() => {
    if (existingOrder) {
      setSupplierName(existingOrder.supplierName || "");
      setSupplierAddress(existingOrder.supplierAddress || "");
      setSupplierICE(existingOrder.supplierICE || "");

      if (existingOrder.date) {
        const dateParts = existingOrder.date.split("-");
        const year = parseInt(dateParts[0], 10);
        const month = parseInt(dateParts[1], 10) - 1;
        const day = parseInt(dateParts[2], 10);
        setDate(new Date(year, month, day));
      }

      setOrderNumber(existingOrder.order_number || "");

      let parsedItems = [emptyItem];
      if (existingOrder.items) {
        try {
          const itemsData =
            typeof existingOrder.items === "string"
              ? JSON.parse(existingOrder.items)
              : existingOrder.items;
          if (Array.isArray(itemsData) && itemsData.length > 0) {
            parsedItems = itemsData.map((item) => ({
              description: item.description || "",
              quantity: Number(item.quantity) || 1,
              prixUnitaire: Number(item.prixUnitaire) || 0,
              fraisServiceUnitaire: Number(item.fraisServiceUnitaire) || 0,
            }));
          }
        } catch (e) {
          console.error("Failed to parse items:", e);
        }
      }
      setItems(parsedItems);
      setNotes(existingOrder.notes || "");
    } else {
      setSupplierName("");
      setSupplierAddress("");
      setSupplierICE("");
      setDate(new Date());
      setItems([emptyItem]);
      setNotes("");
      setOrderNumber("");
    }
  }, [existingOrder]);

  const handleSupplierSelect = (supplier) => {
    setSupplierName(supplier.name);
    setSupplierAddress(supplier.address || "");
    setSupplierICE(supplier.ice || "");
  };

  const handleItemChange = (index, field, value) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };
    setItems(newItems);
  };

  const addItem = () => setItems([...items, { ...emptyItem }]);
  const removeItem = (index) => setItems(items.filter((_, i) => i !== index));

  const calculatedTotals = useMemo(() => {
    let prixTotalHorsFrais = 0;
    let totalFraisServiceTTC = 0;

    const itemsWithTotals = items.map((item) => {
      const quantite = Number(item.quantity) || 0;
      const prixUnitaire = Number(item.prixUnitaire) || 0;
      const fraisServiceUnitaireTTC = Number(item.fraisServiceUnitaire) || 0;

      const montantTotal =
        quantite * prixUnitaire + quantite * fraisServiceUnitaireTTC;

      prixTotalHorsFrais += quantite * prixUnitaire;
      totalFraisServiceTTC += quantite * fraisServiceUnitaireTTC;

      return { ...item, total: montantTotal };
    });

    const totalFraisServiceHT = totalFraisServiceTTC / 1.2;
    const tva = totalFraisServiceHT * 0.2;
    const totalOrder = prixTotalHorsFrais + totalFraisServiceTTC;

    return {
      itemsWithTotals,
      prixTotalHorsFrais,
      totalFraisServiceHT,
      tva,
      totalOrder,
    };
  }, [items]);

  const handleSubmit = (e) => {
    e.preventDefault();
    const finalItems = calculatedTotals.itemsWithTotals.map((item) => ({
      description: item.description,
      quantity: item.quantity,
      prixUnitaire: item.prixUnitaire,
      fraisServiceUnitaire: item.fraisServiceUnitaire,
      total: item.total,
    }));

    const dateForBackend = new Date(
      date.getTime() - date.getTimezoneOffset() * 60000
    )
      .toISOString()
      .split("T")[0];

    onSave({
      order_number: orderNumber,
      supplierName,
      supplierAddress,
      supplierICE,
      date: dateForBackend,
      items: finalItems,
      prixTotalHorsFrais: calculatedTotals.prixTotalHorsFrais,
      totalFraisServiceHT: calculatedTotals.totalFraisServiceHT,
      tva: calculatedTotals.tva,
      total: calculatedTotals.totalOrder,
      notes,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Numéro de Commande
          </label>
          <input
            type="text"
            value={orderNumber}
            onChange={(e) => setOrderNumber(e.target.value)}
            placeholder="Auto-généré si vide"
            className="input"
            disabled={!!existingOrder}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Date
          </label>
          <DatePicker
            selected={date}
            onChange={(d) => setDate(d)}
            dateFormat="dd/MM/yyyy"
            className="input"
            required
          />
        </div>
      </div>

      <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 border-b dark:border-gray-700 pb-2">
        Informations Fournisseur
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <SupplierSearch
            onSupplierSelect={handleSupplierSelect}
            initialName={supplierName}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Adresse
          </label>
          <input
            type="text"
            value={supplierAddress}
            onChange={(e) => setSupplierAddress(e.target.value)}
            className="input"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            ICE
          </label>
          <input
            type="text"
            value={supplierICE}
            onChange={(e) => setSupplierICE(e.target.value)}
            className="input"
          />
        </div>
      </div>

      <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 border-b dark:border-gray-700 pb-2">
        Articles
      </h3>
      <div className="space-y-4">
        <div className="hidden md:grid grid-cols-12 gap-2 text-sm font-medium text-gray-500 dark:text-gray-400">
          <div className="col-span-4">DÉSIGNATION</div>
          <div className="col-span-1 text-center">QTÉ</div>
          <div className="col-span-2 text-left">PRIX UNITAIRE</div>
          <div className="col-span-2 text-left">FRAIS SERV. UNITAIRE</div>
          <div className="col-span-2 text-left">MONTANT TOTAL</div>
          <div className="col-span-1"></div>
        </div>
        {calculatedTotals.itemsWithTotals.map((item, index) => (
          <div key={index} className="grid grid-cols-12 gap-2 items-center">
            <div className="col-span-12 md:col-span-4">
              <textarea
                placeholder="Description"
                value={item.description}
                onChange={(e) =>
                  handleItemChange(index, "description", e.target.value)
                }
                className="input resize-none"
                rows={1}
                required
              />
            </div>
            <div className="col-span-4 md:col-span-1">
              <input
                type="number"
                value={item.quantity}
                onChange={(e) =>
                  handleItemChange(index, "quantity", Number(e.target.value))
                }
                className="input text-center"
                required
              />
            </div>
            <div className="col-span-8 md:col-span-2">
              <input
                type="number"
                value={item.prixUnitaire}
                onChange={(e) =>
                  handleItemChange(
                    index,
                    "prixUnitaire",
                    Number(e.target.value)
                  )
                }
                className="input text-right"
                required
              />
            </div>
            <div className="col-span-8 md:col-span-2">
              <input
                type="number"
                value={item.fraisServiceUnitaire}
                onChange={(e) =>
                  handleItemChange(
                    index,
                    "fraisServiceUnitaire",
                    Number(e.target.value)
                  )
                }
                className="input text-right"
              />
            </div>
            <div className="col-span-10 md:col-span-2">
              <div className="w-full px-3 py-2 text-right font-medium bg-gray-100 dark:bg-gray-800 dark:text-gray-200 rounded-md">
                {item.total.toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                })}
              </div>
            </div>
            <div className="col-span-2 md:col-span-1 flex justify-center">
              <button
                type="button"
                onClick={() => removeItem(index)}
                className="text-red-500 hover:text-red-700"
              >
                <Trash2 className="w-5 h-5" />
              </button>
            </div>
          </div>
        ))}
        <button
          type="button"
          onClick={addItem}
          className="inline-flex items-center px-3 py-1 text-sm bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-200"
        >
          <Plus className="w-4 h-4 mr-1" /> Ajouter un Article
        </button>
      </div>

      <div className="flex justify-end mt-6">
        <div className="w-full max-w-sm space-y-2 text-sm">
          <div className="flex justify-between font-bold text-lg border-t dark:border-gray-700 pt-2 p-2 bg-gray-100 dark:bg-gray-700 rounded-md text-gray-900 dark:text-gray-100">
            <span>Total Commande</span>
            <span>
              {calculatedTotals.totalOrder.toLocaleString(undefined, {
                minimumFractionDigits: 2,
              })}{" "}
              MAD
            </span>
          </div>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          Notes
        </label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          className="input"
          rows={3}
        ></textarea>
      </div>

      <div className="flex justify-end space-x-3 pt-6 border-t dark:border-gray-700">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 text-gray-700 border rounded-lg hover:bg-gray-50 dark:text-gray-300"
        >
          Annuler
        </button>
        <button
          type="submit"
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 shadow-sm"
        >
          {existingOrder ? "Mettre à jour" : "Créer le Bon de Commande"}
        </button>
      </div>
    </form>
  );
}

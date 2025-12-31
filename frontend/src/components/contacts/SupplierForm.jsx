import React, { useState, useEffect } from "react";

export default function SupplierForm({ onSave, onCancel, existingSupplier }) {
  const [name, setName] = useState("");
  const [service_type, setServiceType] = useState("");
  const [contact_person, setContactPerson] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [notes, setNotes] = useState("");

  useEffect(() => {
    if (existingSupplier) {
      setName(existingSupplier.name || "");
      setServiceType(existingSupplier.service_type || "");
      setContactPerson(existingSupplier.contact_person || "");
      setEmail(existingSupplier.email || "");
      setPhone(existingSupplier.phone || "");
      setNotes(existingSupplier.notes || "");
    } else {
      setName("");
      setServiceType("");
      setContactPerson("");
      setEmail("");
      setPhone("");
      setNotes("");
    }
  }, [existingSupplier]);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({ name, service_type, contact_person, email, phone, notes });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Nom du Fournisseur*
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="input"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Type de Service
          </label>
          <input
            type="text"
            value={service_type}
            onChange={(e) => setServiceType(e.target.value)}
            className="input"
            placeholder="ex: Hôtel, Transport, Assurance"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Personne de Contact
          </label>
          <input
            type="text"
            value={contact_person}
            onChange={(e) => setContactPerson(e.target.value)}
            className="input"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Email
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="input"
          />
        </div>
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Téléphone
          </label>
          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="input"
          />
        </div>
        <div className="md:col-span-2">
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
      </div>

      <div className="flex justify-end space-x-3 pt-6 border-t dark:border-gray-700 mt-6">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-700"
        >
          Annuler
        </button>
        <button
          type="submit"
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          {existingSupplier
            ? "Mettre à jour le Fournisseur"
            : "Créer le Fournisseur"}
        </button>
      </div>
    </form>
  );
}

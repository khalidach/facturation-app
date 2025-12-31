import React, { useState, useEffect } from "react";

export default function ClientForm({ onSave, onCancel, existingClient }) {
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [ice, setIce] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [notes, setNotes] = useState("");

  useEffect(() => {
    if (existingClient) {
      setName(existingClient.name || "");
      setAddress(existingClient.address || "");
      setIce(existingClient.ice || "");
      setEmail(existingClient.email || "");
      setPhone(existingClient.phone || "");
      setNotes(existingClient.notes || "");
    } else {
      setName("");
      setAddress("");
      setIce("");
      setEmail("");
      setPhone("");
      setNotes("");
    }
  }, [existingClient]);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({ name, address, ice, email, phone, notes });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Nom du Client*
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
            ICE
          </label>
          <input
            type="text"
            value={ice}
            onChange={(e) => setIce(e.target.value)}
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
        <div>
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
            Adresse
          </label>
          <input
            type="text"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
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
          {existingClient ? "Mettre à jour le Client" : "Créer le Client"}
        </button>
      </div>
    </form>
  );
}

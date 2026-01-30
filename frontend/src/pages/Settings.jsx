import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-hot-toast";
import { Save, LogOut } from "lucide-react";

export default function Settings() {
  const queryClient = useQueryClient();
  const [settings, setSettings] = useState({});

  const { data: initialSettings, isLoading } = useQuery({
    queryKey: ["settings"],
    queryFn: window.electronAPI.getSettings,
  });

  useEffect(() => {
    if (initialSettings) {
      setSettings(initialSettings);
    }
  }, [initialSettings]);

  const { mutate: updateSettings, isPending } = useMutation({
    mutationFn: window.electronAPI.updateSettings,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["settings"] });
      toast.success("Paramètres enregistrés avec succès !");
    },
    onError: (error) => {
      toast.error(error.message || "Échec de l'enregistrement des paramètres.");
    },
  });

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setSettings((prev) => ({ ...prev, logo: reader.result }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setSettings((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    updateSettings(settings);
  };

  /**
   * Deactivates the local license and reloads the application.
   */
  const handleSignOut = async () => {
    if (
      window.confirm(
        "Voulez-vous vraiment désactiver la licence sur cet appareil ? L'application retournera à l'écran d'activation.",
      )
    ) {
      try {
        const result = await window.electronAPI.signOut();
        if (result.success) {
          // Clear any redundant local storage flags
          localStorage.removeItem("facturation-app-license");

          toast.success("Licence désactivée. Redémarrage...");

          // Force a hard reload to trigger the checkSecurity() logic in App.jsx
          setTimeout(() => {
            window.location.href = window.location.href;
          }, 1000);
        } else {
          toast.error(result.message);
        }
      } catch (error) {
        toast.error("Erreur technique lors de la désactivation.");
      }
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-gray-500 font-medium italic">Chargement...</p>
      </div>
    );
  }

  const companyFields = [
    { key: "ice", label: "ICE" },
    { key: "if", label: "IF" },
    { key: "rc", label: "RC" },
    { key: "patente", label: "Patente" },
    { key: "cnss", label: "CNSS" },
    { key: "address", label: "Adresse" },
    { key: "phone", label: "Téléphone" },
    { key: "email", label: "Email" },
    { key: "bankName", label: "Nom de la Banque" },
    { key: "rib", label: "RIB" },
    { key: "typeSociete", label: "Forme Juridique" },
    { key: "capital", label: "Capital" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
            Paramètres
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Gérez les informations de votre entreprise et les paramètres de
            facturation.
          </p>
        </div>

        <button
          onClick={handleSignOut}
          className="flex items-center px-4 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 border border-red-200 transition-colors font-medium text-sm"
        >
          <LogOut className="w-4 h-4 mr-2" />
          Désactiver la Licence
        </button>
      </div>

      <form
        onSubmit={handleSubmit}
        className="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700"
      >
        <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-6">
          Configuration de Facturation
        </h2>

        <div className="space-y-6">
          <h3 className="text-lg font-medium text-gray-700 dark:text-gray-300 border-b pb-2">
            Informations sur l'Entreprise
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-600 dark:text-gray-400">
                Nom de l'Agence
              </label>
              <input
                type="text"
                name="agencyName"
                value={settings.agencyName || ""}
                onChange={handleChange}
                className="mt-1 block w-full input"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600 dark:text-gray-400">
                Logo de l'Agence
              </label>
              <input
                type="file"
                name="logo"
                onChange={handleFileChange}
                accept="image/*"
                className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
              />
              {settings.logo && (
                <img
                  src={settings.logo}
                  alt="Aperçu du Logo"
                  className="mt-4 h-20 w-auto rounded-md shadow-sm"
                />
              )}
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {companyFields.map((field) => (
              <div key={field.key}>
                <label className="block text-sm font-medium text-gray-600 dark:text-gray-400">
                  {field.label}
                </label>
                <input
                  type="text"
                  name={field.key}
                  value={settings[field.key] || ""}
                  onChange={handleChange}
                  className="mt-1 block w-full input"
                />
              </div>
            ))}
          </div>
        </div>

        <div className="mt-8 flex justify-end">
          <button
            type="submit"
            disabled={isPending}
            className="inline-flex items-center px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 shadow-sm disabled:bg-gray-400 transition-colors"
          >
            <Save className="w-5 h-5 mr-2" />
            {isPending ? "Enregistrement..." : "Enregistrer les paramètres"}
          </button>
        </div>
      </form>
    </div>
  );
}

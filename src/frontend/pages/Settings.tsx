import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-hot-toast";
import { Save } from "lucide-react";

interface FacturationSettings {
  agencyName?: string;
  logo?: string;
  ice?: string;
  if?: string;
  rc?: string;
  patente?: string;
  cnss?: string;
  address?: string;
  phone?: string;
  email?: string;
  bankName?: string;
  rib?: string;
}

export default function Settings() {
  const queryClient = useQueryClient();
  const [settings, setSettings] = useState<FacturationSettings>({});

  const { data: initialSettings, isLoading } = useQuery<FacturationSettings>({
    queryKey: ["settings"],
    queryFn: () => window.electronAPI.getSettings(),
  });

  useEffect(() => {
    if (initialSettings) {
      setSettings(initialSettings);
    }
  }, [initialSettings]);

  const { mutate: updateSettings, isPending } = useMutation({
    mutationFn: (data: FacturationSettings) =>
      window.electronAPI.updateSettings(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["settings"] });
      toast.success("Settings saved successfully!");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to save settings.");
    },
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setSettings((prev) => ({ ...prev, [name]: value }));
  };

  const handleLogoUpload = async () => {
    const filePath = await window.electronAPI.openFileDialog();
    if (filePath) {
      setSettings((prev) => ({ ...prev, logo: filePath }));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateSettings(settings);
  };

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
          Settings
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">
          Manage your agency and facturation settings.
        </p>
      </div>

      <form
        onSubmit={handleSubmit}
        className="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700"
      >
        <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-6">
          Facturation Settings
        </h2>

        <div className="space-y-6">
          <h3 className="text-lg font-medium text-gray-700 dark:text-gray-300 border-b pb-2 border-gray-200 dark:border-gray-600">
            Agency Info
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-600 dark:text-gray-400">
                Agency Name
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
                Logo
              </label>
              <button
                type="button"
                onClick={handleLogoUpload}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md text-left"
              >
                {settings.logo ? settings.logo : "Upload Logo"}
              </button>
            </div>
          </div>
          <h3 className="text-lg font-medium text-gray-700 dark:text-gray-300 border-b pb-2 border-gray-200 dark:border-gray-600">
            Company Info
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-medium">ICE</label>
              <input
                type="text"
                name="ice"
                value={settings.ice || ""}
                onChange={handleChange}
                className="mt-1 block w-full input"
              />
            </div>
            <div>
              <label className="block text-sm font-medium">IF</label>
              <input
                type="text"
                name="if"
                value={settings.if || ""}
                onChange={handleChange}
                className="mt-1 block w-full input"
              />
            </div>
            <div>
              <label className="block text-sm font-medium">RC</label>
              <input
                type="text"
                name="rc"
                value={settings.rc || ""}
                onChange={handleChange}
                className="mt-1 block w-full input"
              />
            </div>
            <div>
              <label className="block text-sm font-medium">Patente</label>
              <input
                type="text"
                name="patente"
                value={settings.patente || ""}
                onChange={handleChange}
                className="mt-1 block w-full input"
              />
            </div>
            <div>
              <label className="block text-sm font-medium">CNSS</label>
              <input
                type="text"
                name="cnss"
                value={settings.cnss || ""}
                onChange={handleChange}
                className="mt-1 block w-full input"
              />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium">Address</label>
              <input
                type="text"
                name="address"
                value={settings.address || ""}
                onChange={handleChange}
                className="mt-1 block w-full input"
              />
            </div>
            <div>
              <label className="block text-sm font-medium">Phone</label>
              <input
                type="text"
                name="phone"
                value={settings.phone || ""}
                onChange={handleChange}
                className="mt-1 block w-full input"
              />
            </div>
            <div>
              <label className="block text-sm font-medium">Email</label>
              <input
                type="email"
                name="email"
                value={settings.email || ""}
                onChange={handleChange}
                className="mt-1 block w-full input"
              />
            </div>
          </div>

          <h3 className="text-lg font-medium text-gray-700 dark:text-gray-300 border-b pb-2 pt-4 border-gray-200 dark:border-gray-600">
            Bank Info
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium">Bank Name</label>
              <input
                type="text"
                name="bankName"
                value={settings.bankName || ""}
                onChange={handleChange}
                className="mt-1 block w-full input"
              />
            </div>
            <div>
              <label className="block text-sm font-medium">RIB</label>
              <input
                type="text"
                name="rib"
                value={settings.rib || ""}
                onChange={handleChange}
                className="mt-1 block w-full input"
              />
            </div>
          </div>
        </div>

        <div className="mt-8 flex justify-end">
          <button
            type="submit"
            disabled={isPending}
            className="inline-flex items-center px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700"
          >
            <Save className="w-5 h-5 mr-2" />
            {isPending ? "Saving..." : "Save Settings"}
          </button>
        </div>
      </form>
    </div>
  );
}

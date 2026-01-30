import React, { useState } from "react";
import {
  ShieldCheck,
  ShieldAlert,
  CheckCircle,
  XCircle,
  Globe,
  Clock,
} from "lucide-react";
import { toast } from "react-hot-toast";

// Clés localStorage
const STORAGE_KEY = "facturation-app-license";

export default function Verification({ onSuccess }) {
  const [licenseCode, setLicenseCode] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [verificationStatus, setVerificationStatus] = useState({
    checked: false,
    valid: false,
    message: "",
    isTrial: false,
    expiryDate: null,
  });

  const handleVerify = async () => {
    // 1. VÉRIFICATION DÉFENSIVE : S'assurer que nous sommes dans Electron
    if (
      !window.electronAPI ||
      typeof window.electronAPI.verifyLicense !== "function"
    ) {
      setVerificationStatus((prev) => ({
        ...prev,
        checked: true,
        valid: false,
        message:
          "Erreur Critique : Pont Electron non configuré ou fonction de licence manquante. Veuillez vérifier preload.js.",
      }));
      toast.error("Incompatibilité d'environnement détectée.");
      return;
    }

    setIsLoading(true);
    setVerificationStatus({
      checked: false,
      valid: false,
      message: "",
      isTrial: false,
      expiryDate: null,
    });

    try {
      // 2. APPEL DE L'API
      const data = await window.electronAPI.verifyLicense({
        licenseCode: licenseCode.trim(),
      });

      if (data.success) {
        setVerificationStatus({
          checked: true,
          valid: true,
          message: data.message,
          isTrial: data.isTrial,
          expiryDate: data.expiryDate,
        });

        // Mise à jour du localStorage avec les informations de période d'essai
        localStorage.setItem(
          STORAGE_KEY,
          JSON.stringify({
            valid: true,
            isTrial: data.isTrial,
            expiryDate: data.expiryDate,
          }),
        );

        toast.success(data.message || "Application activée !");

        if (onSuccess) {
          // Léger délai pour l'UX avant la transition
          setTimeout(onSuccess, 1500);
        }
      } else {
        setVerificationStatus({
          checked: true,
          valid: false,
          message: data.message || "Code de licence invalide.",
          isTrial: false,
          expiryDate: null,
        });
        toast.error(data.message || "Code de licence invalide.");
      }
    } catch (error) {
      console.error("Erreur de vérification :", error);
      setVerificationStatus({
        checked: true,
        valid: false,
        message: `Erreur de Connexion : ${error.message}`,
        isTrial: false,
        expiryDate: null,
      });
      toast.error("Impossible de joindre le serveur de vérification.");
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusIcon = () => {
    if (!window.electronAPI) {
      return <Globe className="w-16 h-16 text-rose-500 animate-pulse" />;
    }
    if (!verificationStatus.checked) {
      return (
        <ShieldAlert className="w-16 h-16 text-yellow-500 dark:text-yellow-400" />
      );
    }
    if (verificationStatus.valid) {
      if (verificationStatus.isTrial) {
        return <Clock className="w-16 h-16 text-blue-500" />;
      }
      return (
        <CheckCircle className="w-16 h-16 text-green-600 dark:text-green-500" />
      );
    }
    return <XCircle className="w-16 h-16 text-red-600 dark:text-red-500" />;
  };

  const getStatusMessage = () => {
    if (!window.electronAPI) {
      return "Erreur d'Environnement : Cette application doit être exécutée dans son conteneur Electron pour accéder aux fonctionnalités de sécurité du système.";
    }
    if (verificationStatus.valid && verificationStatus.isTrial) {
      const date = new Date(verificationStatus.expiryDate).toLocaleDateString();
      const time = new Date(verificationStatus.expiryDate).toLocaleTimeString(
        [],
        { hour: "2-digit", minute: "2-digit" },
      );
      return `Mode Essai Actif : Votre accès expirera le ${date} à ${time}.`;
    }
    if (verificationStatus.message) {
      return verificationStatus.message;
    }
    return "Veuillez saisir votre code de licence pour activer l'application.";
  };

  return (
    <div className="flex h-screen w-full items-center justify-center bg-gray-100 dark:bg-gray-900 p-4">
      <div className="bg-white dark:bg-gray-800 p-10 rounded-[2.5rem] shadow-2xl border border-gray-100 dark:border-gray-700 max-w-lg w-full mx-auto text-center">
        <div className="flex justify-center mb-8">{getStatusIcon()}</div>

        <h2 className="text-2xl font-black text-gray-900 dark:text-white mb-3 tracking-tight">
          {verificationStatus.valid && verificationStatus.isTrial
            ? "Période d'Essai"
            : "Activation du Système"}
        </h2>

        <p
          className={`text-sm font-medium mb-8 leading-relaxed ${
            !window.electronAPI
              ? "text-rose-600"
              : verificationStatus.valid && verificationStatus.isTrial
                ? "text-blue-600 dark:text-blue-400"
                : "text-gray-500 dark:text-gray-400"
          }`}
        >
          {getStatusMessage()}
        </p>

        {window.electronAPI && !verificationStatus.valid && (
          <div className="space-y-4">
            <div className="relative">
              <input
                type="text"
                value={licenseCode}
                onChange={(e) => setLicenseCode(e.target.value)}
                placeholder="XXXX-XXXX-XXXX-XXXX"
                className="w-full px-6 py-4 bg-gray-50 dark:bg-gray-700/50 border-2 border-transparent rounded-2xl dark:text-white focus:border-blue-500 focus:bg-white outline-none transition-all font-mono text-center tracking-widest"
              />
            </div>
            <button
              onClick={handleVerify}
              disabled={isLoading || !licenseCode.trim()}
              className="w-full flex items-center justify-center px-6 py-4 bg-blue-600 text-white rounded-2xl font-black text-lg hover:bg-blue-700 shadow-xl shadow-blue-500/20 disabled:bg-gray-300 disabled:shadow-none transition-all active:scale-95"
            >
              <ShieldCheck className="w-6 h-6 mr-2" />
              {isLoading
                ? "Vérification de l'Autorité..."
                : "Activer Maintenant"}
            </button>
            <p className="text-[10px] text-gray-400 uppercase tracking-widest font-bold">
              Les codes commençant par TRIAL- activent le mode d'essai
            </p>
          </div>
        )}

        {!window.electronAPI && (
          <div className="p-4 bg-rose-50 dark:bg-rose-900/20 rounded-2xl text-rose-700 dark:text-rose-400 text-xs font-bold uppercase tracking-widest">
            Conteneur de Bureau Requis
          </div>
        )}
      </div>
    </div>
  );
}

import React, { useState } from "react";
import {
  ShieldCheck,
  ShieldAlert,
  CheckCircle,
  XCircle,
  Globe,
} from "lucide-react";
import { toast } from "react-hot-toast";

// localStorage keys
const STORAGE_KEY = "facturation-app-license";

export default function Verification({ onSuccess }) {
  const [licenseCode, setLicenseCode] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [verificationStatus, setVerificationStatus] = useState({
    checked: false,
    valid: false,
    message: "",
  });

  const handleVerify = async () => {
    // 1. DEFENSIVE CHECK: Ensure we are inside Electron
    if (!window.electronAPI) {
      setVerificationStatus({
        checked: true,
        valid: false,
        message:
          "Critical Error: Electron Bridge not found. Please launch the application via the desktop launcher, not a web browser.",
      });
      toast.error("Environment mismatch detected.");
      return;
    }

    setIsLoading(true);
    setVerificationStatus({ checked: false, valid: false, message: "" });

    try {
      // 2. CALL THE API
      const data = await window.electronAPI.licenseVerify(licenseCode.trim());

      if (data.success) {
        setVerificationStatus({
          checked: true,
          valid: true,
          message: data.message,
        });
        localStorage.setItem(STORAGE_KEY, JSON.stringify({ valid: true }));
        toast.success(data.message || "Application activated!");

        if (onSuccess) {
          // Delay success transition slightly for UX
          setTimeout(onSuccess, 1500);
        }
      } else {
        setVerificationStatus({
          checked: true,
          valid: false,
          message: data.message || "Invalid license code.",
        });
        toast.error(data.message || "Invalid license code.");
      }
    } catch (error) {
      console.error("Verification error:", error);
      setVerificationStatus({
        checked: true,
        valid: false,
        message: `Connection Error: ${error.message}`,
      });
      toast.error("Failed to reach verification server.");
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
      return (
        <CheckCircle className="w-16 h-16 text-green-600 dark:text-green-500" />
      );
    }
    return <XCircle className="w-16 h-16 text-red-600 dark:text-red-500" />;
  };

  const getStatusMessage = () => {
    if (!window.electronAPI) {
      return "Environment Error: This application must be run inside its Electron container to access system security features.";
    }
    if (verificationStatus.message) {
      return verificationStatus.message;
    }
    return "Please enter your license code to activate the application.";
  };

  return (
    <div className="flex h-screen w-full items-center justify-center bg-gray-100 dark:bg-gray-900 p-4">
      <div className="bg-white dark:bg-gray-800 p-10 rounded-[2.5rem] shadow-2xl border border-gray-100 dark:border-gray-700 max-w-lg w-full mx-auto text-center">
        <div className="flex justify-center mb-8">{getStatusIcon()}</div>

        <h2 className="text-2xl font-black text-gray-900 dark:text-white mb-3 tracking-tight">
          System Activation
        </h2>

        <p
          className={`text-sm font-medium mb-8 leading-relaxed ${
            !window.electronAPI
              ? "text-rose-600"
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
              {isLoading ? "Verifying Authority..." : "Activate Now"}
            </button>
          </div>
        )}

        {!window.electronAPI && (
          <div className="p-4 bg-rose-50 dark:bg-rose-900/20 rounded-2xl text-rose-700 dark:text-rose-400 text-xs font-bold uppercase tracking-widest">
            Desktop Container Required
          </div>
        )}
      </div>
    </div>
  );
}

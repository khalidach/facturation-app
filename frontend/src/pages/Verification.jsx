import React, { useState } from "react";
import { ShieldCheck, ShieldAlert, CheckCircle, XCircle } from "lucide-react";
import { toast } from "react-hot-toast";

// localStorage keys
const STORAGE_KEY = "facturation-app-license";
// MACHINE_ID_KEY is no longer needed.
// const MACHINE_ID_KEY = "facturation-app-machine-id";

// Accept 'onSuccess' prop from App.jsx
export default function Verification({ onSuccess }) {
  const [licenseCode, setLicenseCode] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [verificationStatus, setVerificationStatus] = useState({
    checked: false,
    valid: false,
    message: "",
  });

  const handleVerify = async () => {
    setIsLoading(true);
    setVerificationStatus({ checked: false, valid: false, message: "" });

    try {
      // --- THIS IS THE FIX ---
      // 1. All machineId logic is removed from here.
      // We no longer get/set it in localStorage or generate a UUID.

      // 2. Call the main process via IPC, sending *only* the license code.
      // The 'licenseVerify' function in preload.js now only takes one argument.
      const data = await window.electronAPI.licenseVerify(licenseCode.trim());
      // --- END OF FIX ---

      // 3. Check the response from the main process
      if (data.success) {
        // SUCCESS
        setVerificationStatus({
          checked: true,
          valid: true,
          message: data.message, // Use the success message from server
        });
        localStorage.setItem(
          STORAGE_KEY,
          // We only store validity. The code itself is not needed here.
          JSON.stringify({ valid: true })
        );
        toast.success(data.message || "Application activated!");

        if (onSuccess) {
          onSuccess();
        }
      } else {
        // FAIL
        setVerificationStatus({
          checked: true,
          valid: false,
          message: data.message || "Invalid license code.",
        });
        toast.error(data.message || "Invalid license code.");
      }
    } catch (error) {
      // CATCH (Catches errors from main.js)
      console.error("Verification error:", error);
      setVerificationStatus({
        checked: true,
        valid: false,
        message: error.message,
      });
      toast.error(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusIcon = () => {
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
    if (verificationStatus.message) {
      return verificationStatus.message;
    }
    return "Please enter your license code to activate the application.";
  };

  return (
    <div className="flex h-screen w-full items-center justify-center bg-gray-100 dark:bg-gray-900 p-4">
      <div className="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 max-w-2xl w-full mx-auto text-center">
        <div className="flex justify-center mb-6">{getStatusIcon()}</div>
        <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-2">
          License Status
        </h2>
        <p className="text-gray-600 dark:text-gray-400 mb-6 text-sm">
          {getStatusMessage()}
        </p>

        {!verificationStatus.valid && (
          <div className="flex flex-col sm:flex-row gap-2">
            <input
              type="text"
              value={licenseCode}
              onChange={(e) => setLicenseCode(e.target.value)}
              placeholder="Enter license code..."
              className="w-full px-4 py-2 border border-gray-300 rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 flex-1"
            />
            <button
              onClick={handleVerify}
              disabled={isLoading}
              className="inline-flex items-center justify-center px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 shadow-sm disabled:bg-gray-400"
            >
              <ShieldCheck className="w-5 h-5 mr-2" />
              {isLoading ? "Verifying..." : "Verify"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

import React, { useState } from "react";
import { ShieldCheck, ShieldAlert, CheckCircle, XCircle } from "lucide-react";
import { toast } from "react-hot-toast";

const VERIFICATION_API_URL = "https://verification-code.netlify.app/api/verify";
const STORAGE_KEY = "facturation-app-license";
// We no longer need a separate key for the machine ID, as we get it from the hardware.

// Accept 'onSuccess' prop from App.jsx
export default function Verification({ onSuccess }) {
  const [licenseCode, setLicenseCode] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [verificationStatus, setVerificationStatus] = useState({
    checked: false,
    valid: false,
    message: "",
  });

  const getPersistentMachineId = () => {
    // Check if the preload script (electronAPI) was successfully injected
    if (
      window.electronAPI &&
      typeof window.electronAPI.getMachineId === "function"
    ) {
      return window.electronAPI.getMachineId();
    }

    // Fallback or error
    console.warn(
      "electronAPI is not available. Running in browser mode or preload failed."
    );
    // Return null to indicate failure
    return null;
  };

  const handleVerify = async () => {
    setIsLoading(true);
    setVerificationStatus({ checked: false, valid: false, message: "" });

    // --- THIS IS THE FIX ---
    // Get the persistent hardware ID from the preload script
    const machineId = getPersistentMachineId();

    // Check if we successfully got the machine ID
    if (!machineId) {
      const errorMsg =
        "Could not retrieve machine identifier. Please restart the application.";
      setVerificationStatus({
        checked: true,
        valid: false,
        message: errorMsg,
      });
      toast.error(errorMsg);
      setIsLoading(false);
      return; // Stop the verification
    }
    // --- END OF FIX ---

    try {
      const response = await fetch(VERIFICATION_API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        // Send the license code AND the persistent hardware ID
        body: JSON.stringify({ licenseCode, machineId }),
      });

      const data = await response.json();

      // Check for 'success' (from our Netlify function)
      if (response.ok && data.success) {
        // SUCCESS
        setVerificationStatus({
          checked: true,
          valid: true,
          message: data.message,
        });
        localStorage.setItem(
          STORAGE_KEY,
          JSON.stringify({
            code: licenseCode,
            valid: true,
            machineId: machineId,
          }) // Save the machineId for good measure
        );
        toast.success("Application activated!");

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
      // CATCH
      console.error("Verification error:", error);
      let errorMessage = "Could not connect to verification service.";

      if (error instanceof SyntaxError) {
        errorMessage = "Received an invalid response from the server.";
      }

      setVerificationStatus({
        checked: true,
        valid: false,
        message: errorMessage,
      });
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // ... rest of your component (getStatusIcon, getStatusMessage, JSX) ...
  // ... no changes needed below this line ...

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

  // Wrap the component in a full-screen container
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

        {/* Don't show the form if verification is successful */}
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

import React, { useState } from "react";
import { ShieldCheck, ShieldAlert, CheckCircle, XCircle } from "lucide-react";
import { toast } from "react-hot-toast";

// The API endpoint for your Netlify function
const VERIFICATION_API_URL = "https://verification-code.netlify.app/api/verify";

// localStorage keys
const STORAGE_KEY = "facturation-app-license";
const MACHINE_ID_KEY = "facturation-app-machine-id"; // Key to store our persistent ID

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

      // 1. Get or create a persistent Machine ID
      let machineId = localStorage.getItem(MACHINE_ID_KEY);
      if (!machineId) {
        // If no ID exists, create one and store it.
        // This ensures the same machine always uses the same ID.
        machineId = crypto.randomUUID();
        localStorage.setItem(MACHINE_ID_KEY, machineId);
      }

      // 2. Send BOTH licenseCode and machineId to the server
      const response = await fetch(VERIFICATION_API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        // The server expects both pieces of data
        body: JSON.stringify({
          licenseCode: licenseCode.trim(), // Send the code
          machineId: machineId, // Send the persistent machine ID
        }),
      });
      // --- END OF FIX ---

      const data = await response.json();

      // --- BUG FIX ---
      // Our Netlify function returns `{ success: true }`, not `valid`.
      // We must check for `data.success`.
      if (response.ok && data.success) {
        // SUCCESS
        setVerificationStatus({
          checked: true,
          valid: true,
          message: data.message, // Use the success message from server
        });
        localStorage.setItem(
          STORAGE_KEY,
          JSON.stringify({ code: licenseCode, valid: true })
        );
        toast.success(data.message || "Application activated!");

        // Call the 'onSuccess' function passed from App.jsx
        if (onSuccess) {
          onSuccess();
        }
      } else {
        // FAIL (e.g., 404, 403, or data.success === false)
        setVerificationStatus({
          checked: true,
          valid: false,
          message: data.message || "Invalid license code.",
        });
        toast.error(data.message || "Invalid license code.");
      }
    } catch (error) {
      // CATCH (e.g., server down, or the JSON parse error)
      console.error("Verification error:", error);
      let errorMessage =
        "Could not connect to verification service. Please check your internet connection.";

      // Check if it was the JSON parse error
      if (error instanceof SyntaxError) {
        errorMessage =
          "Received an invalid (non-JSON) response from the server. Check server logs.";
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

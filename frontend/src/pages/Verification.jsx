import React, { useState } from "react";
import { ShieldCheck, ShieldAlert, CheckCircle, XCircle } from "lucide-react";
import { toast } from "react-hot-toast";

const VERIFICATION_API_URL = "http://localhost:3002/api/verify";
const STORAGE_KEY = "facturation-app-license";

// Accept 'onSuccess' prop from App.jsx
export default function Verification({ onSuccess }) {
  const [licenseCode, setLicenseCode] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [verificationStatus, setVerificationStatus] = useState({
    checked: false,
    valid: false,
    message: "",
  });

  // Removed the 'useEffect' that checked localStorage, as App.jsx now handles this.

  const handleVerify = async () => {
    if (!licenseCode) {
      toast.error("Please enter a license code.");
      return;
    }

    setIsLoading(true);
    setVerificationStatus({ checked: false, valid: false, message: "" });

    try {
      const response = await fetch(`${VERIFICATION_API_URL}/${licenseCode}`);
      const data = await response.json();

      if (response.ok && data.valid) {
        // SUCCESS
        setVerificationStatus({
          checked: true,
          valid: true,
          message: "Verification successful! Application is active.",
        });
        localStorage.setItem(
          STORAGE_KEY,
          JSON.stringify({ code: licenseCode, valid: true })
        );
        toast.success("Application activated!");

        // Call the 'onSuccess' function passed from App.jsx
        onSuccess();
      } else {
        // FAIL
        setVerificationStatus({
          checked: true,
          valid: false,
          message: data.error || "Invalid license code. Please try again.",
        });
        localStorage.removeItem(STORAGE_KEY);
        toast.error("Invalid license code.");
      }
    } catch (error) {
      console.error("Verification error:", error);
      const errorMessage =
        "Could not connect to verification service. Make sure it's running on port 3002.";
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
    if (!verificationStatus.checked && !isLoading) {
      return <ShieldAlert className="w-12 h-12 text-gray-400" />;
    }
    if (isLoading) {
      return (
        <svg
          className="animate-spin h-12 w-12 text-blue-600"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          ></circle>
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          ></path>
        </svg>
      );
    }
    if (verificationStatus.valid) {
      return <CheckCircle className="w-12 h-12 text-green-500" />;
    }
    if (!verificationStatus.valid) {
      return <XCircle className="w-12 h-12 text-red-500" />;
    }
    return null;
  };

  const getStatusMessage = () => {
    if (isLoading) return "Verifying, please wait...";
    if (verificationStatus.message) return verificationStatus.message;
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
        <p
          className={`text-sm mb-6 ${
            verificationStatus.valid
              ? "text-green-600 dark:text-green-400"
              : "text-red-500 dark:text-red-400"
          } ${
            !verificationStatus.checked && !isLoading
              ? "text-gray-500 dark:text-gray-400"
              : ""
          }`}
        >
          {getStatusMessage()}
        </p>

        {!verificationStatus.valid && (
          <div className="flex flex-col sm:flex-row items-center gap-4 max-w-md mx-auto">
            <input
              type="text"
              name="licenseCode"
              value={licenseCode}
              onChange={(e) => setLicenseCode(e.target.value)}
              placeholder="Enter your license code"
              className="mt-1 block w-full input text-center tracking-wider"
              disabled={isLoading}
            />
            <button
              type="button"
              onClick={handleVerify}
              disabled={isLoading}
              className="w-full sm:w-auto inline-flex justify-center items-center px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 shadow-sm disabled:bg-gray-400"
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

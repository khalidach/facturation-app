const { ipcMain, app } = require("electron");
const path = require("path");
const fs = require("fs");
const { machineIdSync } = require("node-machine-id");
const crypto = require("crypto");

const persistentMachineId = machineIdSync({ original: true });
const licensePath = path.join(app.getPath("userData"), ".license_data");

const PUBLIC_KEY = `-----BEGIN PUBLIC KEY-----
MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEArtJtmr/8JITF4QFJlht8
HRqUQQRdh/ez2U9IP3+Tq6EzLii2UfXrZsCGpTeo8tVpum38DplPH4Cee7DZjJ4F
E7JGSq6h6fWUIVJ/OVFpG9+sUpS8fleMv++aG2XkB3+podo11h5Zy0UFseOsd7QW
kQ936eWMJ9qp1zCPmN5m3+dTxi7uVcYEVInzi33VYyC9OlF6ceZpOnuFX+FQ2V3g
0hCTW/aKHqomiuHuOMQNenAYygR+sxI3NefrK6qzLuajT86OzjfPiZIRLOU+3PUO
RNTrqucENfEpMwC1ib3z2skSEqndyMMyU6cDq/PumW6Sob3sFai864m0P2u1t4Xn
ywIDAQAB
-----END PUBLIC KEY-----`;

/**
 * Enhanced Offline Verification with Anti-Clock-Rewind
 */
function getLicenseStatus() {
  try {
    if (fs.existsSync(licensePath)) {
      const data = JSON.parse(fs.readFileSync(licensePath, "utf8"));

      // 1. Machine ID Check
      if (data.machineId !== persistentMachineId) return { valid: false };

      const now = new Date();

      // 2. Anti-Clock-Rewind Check
      if (data.lastUsage) {
        const lastUsage = new Date(data.lastUsage);
        if (now < lastUsage) {
          return {
            valid: false,
            message:
              "System clock manipulation detected. Please correct your date.",
            isTrial: data.isTrial,
          };
        }
      }

      // 3. Expiry Check (for Trials)
      if (data.isTrial) {
        const expiry = new Date(data.expiryDate);
        if (now > expiry) {
          return {
            valid: false,
            message: "Trial period expired.",
            isTrial: true,
          };
        }
      }

      // 4. Update Last Usage (if valid)
      data.lastUsage = now.toISOString();
      fs.writeFileSync(licensePath, JSON.stringify(data));

      return {
        valid: true,
        isTrial: data.isTrial,
        expiryDate: data.expiryDate,
      };
    }
  } catch (e) {
    console.error("License check error:", e);
  }
  return { valid: false };
}

function initLicenseService() {
  ipcMain.handle("license:checkStatus", () => getLicenseStatus());

  ipcMain.handle("license:verify", async (event, { licenseCode }) => {
    try {
      const res = await fetch(
        "https://verification-code.netlify.app/api/verify",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ licenseCode, machineId: persistentMachineId }),
        },
      );

      const responseData = await res.json();

      if (responseData.signature) {
        const verify = crypto.createVerify("SHA256");
        verify.update(
          JSON.stringify({
            success: responseData.success,
            message: responseData.message,
            machineId: persistentMachineId,
            isTrial: responseData.isTrial || false,
            expiryDate: responseData.expiryDate || null,
          }),
        );

        if (!verify.verify(PUBLIC_KEY, responseData.signature, "base64")) {
          return {
            success: false,
            message: "Security Error: Invalid signature.",
          };
        }
      }

      if (responseData.success) {
        const now = new Date().toISOString();
        fs.writeFileSync(
          licensePath,
          JSON.stringify({
            valid: true,
            machineId: persistentMachineId,
            activatedAt: now,
            lastUsage: now, // Initialize lastUsage on activation
            isTrial: responseData.isTrial,
            expiryDate: responseData.expiryDate,
          }),
        );
      }
      return responseData;
    } catch (e) {
      const offline = getLicenseStatus();
      if (offline.valid) {
        return {
          success: true,
          message: "Offline verification successful.",
          ...offline,
        };
      }
      return {
        success: false,
        message: "Service unreachable and no valid license found.",
      };
    }
  });
}

module.exports = { initLicenseService };

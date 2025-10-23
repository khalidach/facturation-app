const { contextBridge } = require("electron");
const { machineIdSync } = require("node-machine-id");

try {
  // Get the true, stable hardware ID
  // { original: true } gets the true hardware ID, not an anonymized one
  const persistentMachineId = machineIdSync({ original: true });

  // Securely expose this ID to your React app (the renderer process)
  // It will be available at window.electronAPI.getMachineId()
  contextBridge.exposeInMainWorld("electronAPI", {
    getMachineId: () => persistentMachineId,
  });
} catch (error) {
  console.error("Failed to get machine ID in preload.js:", error);
  // Expose a function that returns null if an error occurs
  contextBridge.exposeInMainWorld("electronAPI", {
    getMachineId: () => null,
  });
}

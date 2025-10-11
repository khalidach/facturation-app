/// <reference types="vite/client" />

import {
  Facture,
  PaginatedResponse,
  FacturationSettings,
} from "./src/frontend/models";

export interface IElectronAPI {
  getFactures: (
    page: number,
    limit: number
  ) => Promise<PaginatedResponse<Facture>>;
  createFacture: (
    facture: Omit<Facture, "id" | "facture_number">
  ) => Promise<Facture>;
  updateFacture: (facture: Facture) => Promise<Facture>;
  deleteFacture: (id: number) => Promise<{ id: number }>;
  getSettings: () => Promise<FacturationSettings>;
  updateSettings: (
    settings: FacturationSettings
  ) => Promise<FacturationSettings>;
  openFileDialog: () => Promise<string | undefined>;
}

declare global {
  interface Window {
    electronAPI: IElectronAPI;
  }
}

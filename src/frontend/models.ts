// src/frontend/models.ts

export interface FactureItem {
  description: string;
  quantity: number;
  prixUnitaire: number;
  fraisServiceUnitaire: number;
  total: number;
}

export interface Facture {
  id: number;
  facture_number: string;
  type: "facture" | "devis";
  clientName: string;
  clientAddress?: string;
  clientICE?: string;
  date: string;
  items: FactureItem[];
  notes?: string;
  showMargin?: boolean;
  prixTotalHorsFrais?: number;
  totalFraisServiceHT?: number;
  tva?: number;
  total: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    currentPage: number;
    totalCount: number;
    totalPages: number;
  };
}

export interface FacturationSettings {
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

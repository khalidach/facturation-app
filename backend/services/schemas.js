const { z } = require("zod");

const PaginationSchema = z.object({
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(100).default(10),
  search: z.string().optional().default(""),
  type: z.enum(["income", "expense"]).optional().default("income"),
  sortBy: z.enum(["newest", "oldest"]).optional().default("newest"),
});

const DashboardSchema = z.object({
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});

const TransactionSchema = z.object({
  amount: z.coerce.number().positive(),
  description: z.string().nullable().optional(),
  category: z.string().min(1).default("General"),
  contact_person: z.string().nullable().optional(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  payment_method: z
    .enum(["cash", "cheque", "virement", "versement"])
    .default("cash"),
  is_cashed: z.boolean().default(true),
  in_bank: z.boolean().default(false),
  type: z.enum(["income", "expense"]),
  facture_id: z.number().nullable().optional(),
  bon_de_commande_id: z.number().nullable().optional(),
  cheque_number: z.string().nullable().optional(),
  bank_name: z.string().nullable().optional(),
  transaction_ref: z.string().nullable().optional(),
  bank_sender: z.string().nullable().optional(),
  bank_recipient: z.string().nullable().optional(),
  account_recipient: z.string().nullable().optional(),
  name_recipient: z.string().nullable().optional(),
  account_sender: z.string().nullable().optional(),
  name_sender: z.string().nullable().optional(),
});

const FactureSchema = z.object({
  clientName: z.string().min(1),
  clientAddress: z.string().nullable().optional(),
  clientICE: z.string().nullable().optional(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  items: z.array(z.any()),
  type: z.enum(["facture", "devis"]),
  // Update this line to handle both booleans and numbers (0/1)
  showMargin: z.preprocess((val) => {
    if (typeof val === "number") return val === 1;
    if (typeof val === "string") return val === "true" || val === "1";
    return val;
  }, z.boolean().default(true)),
  prixTotalHorsFrais: z.coerce.number(),
  totalFraisServiceHT: z.coerce.number(),
  tva: z.coerce.number(),
  total: z.coerce.number(),
  notes: z.string().nullable().optional(),
  facture_number: z.string().nullable().optional(),
});

const ClientSchema = z.object({
  name: z.string().min(1),
  address: z.string().nullable().optional(),
  ice: z.string().nullable().optional(),
  email: z.string().email().nullable().or(z.literal("")),
  phone: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
});

const SupplierSchema = z.object({
  name: z.string().min(1),
  service_type: z.string().nullable().optional(),
  contact_person: z.string().nullable().optional(),
  email: z.string().email().nullable().or(z.literal("")),
  phone: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
});

module.exports = {
  PaginationSchema,
  DashboardSchema,
  TransactionSchema,
  FactureSchema,
  ClientSchema,
  SupplierSchema,
};

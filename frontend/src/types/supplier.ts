/**
 * Defines supplier used by frontend domain models.
 */
export interface Supplier {
  id: string;
  name: string;
  serviceCategory: string;
  contactPerson: string | null;
  contactNumber: string | null;
  address: string | null;
  createdAt: string;
  updatedAt: string;
}

/**
 * Defines supplier transaction used by frontend domain models.
 */
export interface SupplierTransaction {
  id: string;
  itemsPurchased: string;
  totalCost: number;
  transactionDate: string;
  supplierId: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Defines supplier form data used by frontend domain models.
 */
export interface SupplierFormData {
  name: string;
  serviceCategory: string;
  contactPerson: string;
  contactNumber: string;
  address: string;
}

/**
 * Defines transaction form data used by frontend domain models.
 */
export interface TransactionFormData {
  supplierId: string;
  itemsPurchased: string;
  totalCost: number;
  transactionDate?: string;
}

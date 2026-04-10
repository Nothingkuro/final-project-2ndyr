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

export interface SupplierTransaction {
  id: string;
  itemsPurchased: string;
  totalCost: number;
  transactionDate: string;
  supplierId: string;
  createdAt: string;
  updatedAt: string;
}

export interface SupplierFormData {
  name: string;
  serviceCategory: string;
  contactPerson: string;
  contactNumber: string;
  address: string;
}

export interface TransactionFormData {
  supplierId: string;
  itemsPurchased: string;
  totalCost: number;
  transactionDate?: string;
}

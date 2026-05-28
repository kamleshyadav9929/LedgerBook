export interface Customer {
  id: string;
  name: string;
  phone: string;
  totalGheeKg: number;
  pendingAmount: number;
  notes: string;
  createdAt: number;
}

export interface Transaction {
  id: string;
  customerId: string;
  customerName: string;
  type: 'sale' | 'payment';
  quantityKg: number;
  ratePerKg: number;
  totalAmount: number;
  amountPaid: number;
  date: string;
  notes: string;
}

export interface QuickTxState {
  customerId: string;
  type: 'sale' | 'payment';
  quantityKg: number;
  ratePerKg: number;
  amountPaid: number;
  notes: string;
  date: string;
}

export interface ParsedPreviewState {
  customerId: string;
  customerName: string;
  type: 'sale' | 'payment';
  quantityKg: number;
  ratePerKg: number;
  amountPaid: number;
  notes?: string;
}

export interface InventoryEntry {
  id: string;
  type: 'add' | 'dispatch';
  quantityKg: number;
  date: string;
  notes: string;
  txId?: string; // linked transaction ID for auto-dispatches
}

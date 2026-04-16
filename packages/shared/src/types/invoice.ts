export type InvoiceStatusName =
  | 'DRAFT'
  | 'ISSUED'
  | 'PARTIAL'
  | 'PAID'
  | 'OVERDUE'
  | 'CANCELLED';

export interface InvoiceLineItem {
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

export interface InvoiceDto {
  id: string;
  tenantId: string;
  invoiceNumber: string;
  contractId: string | null;
  clientId: string;
  issueDate: string;
  dueDate: string | null;
  subtotal: string;
  taxRate: string;
  taxAmount: string;
  total: string;
  amountPaid: string;
  balance: string;
  status: InvoiceStatusName;
  paidAt: string | null;
  lineItems: InvoiceLineItem[];
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateInvoiceInput {
  clientId: string;
  contractId?: string;
  issueDate?: string;
  dueDate?: string;
  taxRate?: number;
  lineItems: InvoiceLineItem[];
  notes?: string;
}

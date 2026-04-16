export type PaymentMethodName = 'CASH' | 'CHECK' | 'CARD' | 'BANK_TRANSFER' | 'ONLINE';
export type PaymentStatusName = 'PENDING' | 'CONFIRMED' | 'REFUNDED' | 'FAILED';

export interface PaymentDto {
  id: string;
  tenantId: string;
  paymentCode: string;
  contractId: string | null;
  invoiceId: string | null;
  clientId: string;
  amount: string;
  method: PaymentMethodName;
  reference: string | null;
  paidAt: string;
  status: PaymentStatusName;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreatePaymentInput {
  clientId: string;
  contractId?: string;
  invoiceId?: string;
  amount: number;
  method?: PaymentMethodName;
  reference?: string;
  paidAt?: string;
  notes?: string;
}

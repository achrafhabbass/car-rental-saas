export type CreditTypeName = 'BANK_CREDIT' | 'LEASING';
export type CreditStatusName = 'ACTIVE' | 'PAID_OFF' | 'DEFAULTED';
export type CreditPaymentStatusName = 'SCHEDULED' | 'PAID' | 'LATE' | 'SKIPPED';

export interface VehicleCreditDto {
  id: string;
  tenantId: string;
  vehicleId: string;
  bankName: string;
  accountNumber: string | null;
  creditType: CreditTypeName;
  principal: string;
  downPayment: string;
  interestRate: string;
  termMonths: number;
  monthlyPayment: string;
  residualValue: string | null;
  startDate: string;
  endDate: string;
  remainingBalance: string;
  totalPaid: string;
  status: CreditStatusName;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreditPaymentDto {
  id: string;
  tenantId: string;
  creditId: string;
  installmentNumber: number;
  scheduledDate: string;
  scheduledAmount: string;
  principalPortion: string;
  interestPortion: string;
  paidAt: string | null;
  paidAmount: string | null;
  reference: string | null;
  status: CreditPaymentStatusName;
  notes: string | null;
}

export interface CreateVehicleCreditInput {
  vehicleId: string;
  bankName: string;
  accountNumber?: string;
  creditType?: CreditTypeName;
  principal: number;
  downPayment?: number;
  interestRate: number;
  termMonths: number;
  residualValue?: number;
  startDate: string;
  notes?: string;
}

export interface RecordCreditPaymentInput {
  paidAmount: number;
  paidAt?: string;
  reference?: string;
  notes?: string;
}

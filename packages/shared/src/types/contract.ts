export type ContractStatusName = 'DRAFT' | 'ACTIVE' | 'COMPLETED' | 'CANCELLED';
export type DepositMethodName =
  | 'CASH'
  | 'CHECK'
  | 'CARD'
  | 'CARD_IMPRINT'
  | 'BANK_TRANSFER';

export interface RentalContractDto {
  id: string;
  tenantId: string;
  contractNumber: string;
  vehicleId: string;
  clientId: string;
  reservationId: string | null;
  createdByUserId: string | null;
  startDate: string;
  endDate: string;
  actualReturnDate: string | null;
  kmStart: number;
  kmEnd: number | null;
  kmAllowance: number | null;
  dailyRate: string;
  totalAmount: string;
  depositAmount: string;
  depositMethod: DepositMethodName | null;
  depositReference: string | null;
  extraCharges: string;
  discountAmount: string;
  pickupLocation: string | null;
  returnLocation: string | null;
  additionalDriver: string | null;
  additionalDriverLicense: string | null;
  status: ContractStatusName;
  signatureUrl: string | null;
  signedAt: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateContractInput {
  vehicleId: string;
  clientId: string;
  reservationId?: string;
  startDate: string;
  endDate: string;
  kmStart: number;
  kmAllowance?: number;
  dailyRate?: number;
  depositAmount?: number;
  depositMethod?: DepositMethodName;
  depositReference?: string;
  discountAmount?: number;
  pickupLocation?: string;
  returnLocation?: string;
  additionalDriver?: string;
  additionalDriverLicense?: string;
  notes?: string;
}

export interface CompleteContractInput {
  actualReturnDate?: string;
  kmEnd: number;
  extraCharges?: number;
  notes?: string;
}

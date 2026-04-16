import type { DepositMethodName } from './contract';

export type DepositStatusName = 'HELD' | 'REFUNDED' | 'PARTIAL_REFUND' | 'CONSUMED';

export interface DepositDto {
  id: string;
  tenantId: string;
  depositNumber: string;
  contractId: string;
  clientId: string;
  amount: string;
  method: DepositMethodName;
  reference: string | null;
  refundedAmount: string;
  consumedAmount: string;
  status: DepositStatusName;
  collectedAt: string;
  settledAt: string | null;
  settledByUserId: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CollectDepositInput {
  contractId: string;
  amount: number;
  method: DepositMethodName;
  reference?: string;
  notes?: string;
}

export interface SettleDepositInput {
  amount?: number;
  notes?: string;
}

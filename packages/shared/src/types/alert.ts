export type AlertTypeName =
  | 'INSURANCE_EXPIRY'
  | 'TECHNICAL_VISIT_EXPIRY'
  | 'VIGNETTE_EXPIRY'
  | 'MAINTENANCE_DUE'
  | 'MAINTENANCE_OVERDUE'
  | 'CREDIT_PAYMENT_DUE'
  | 'INVOICE_OVERDUE';

export type AlertSeverityName = 'INFO' | 'WARNING' | 'CRITICAL';
export type AlertStatusName = 'OPEN' | 'ACKNOWLEDGED' | 'RESOLVED';

export interface AlertDto {
  id: string;
  tenantId: string;
  type: AlertTypeName;
  severity: AlertSeverityName;
  status: AlertStatusName;
  title: string;
  message: string;
  vehicleId: string | null;
  contractId: string | null;
  invoiceId: string | null;
  creditId: string | null;
  scheduleId: string | null;
  dueAt: string | null;
  acknowledgedAt: string | null;
  resolvedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AlertSummaryDto {
  total: number;
  open: number;
  critical: number;
  byType: Record<AlertTypeName, number>;
}

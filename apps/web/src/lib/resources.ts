import type {
  AlertDto,
  AlertSummaryDto,
  AuthProfileDto,
  ClientPerformanceDto,
  DashboardKpisDto,
  PlatformMetricsDto,
  ReportGranularity,
  RevenuePointDto,
  TenantDto,
  TenantSummaryDto,
  UpdateTenantPlatformInput,
  VehiclePerformanceDto,
  AuthTokensDto,
  ClientDto,
  CreateClientInput,
  CreateContractInput,
  CreateInvoiceInput,
  CreateMaintenanceRecordInput,
  CreateMaintenanceScheduleInput,
  CreatePaymentInput,
  CreateReservationInput,
  CreateVehicleCreditInput,
  CreateVehicleInput,
  CreditPaymentDto,
  InvoiceDto,
  LoginRequest,
  MaintenanceRecordDto,
  MaintenanceScheduleDto,
  NotificationDto,
  NotificationSummaryDto,
  PaginatedResult,
  PaginationQuery,
  PaymentDto,
  RecordCreditPaymentInput,
  RegisterRequest,
  RentalContractDto,
  ReservationDto,
  UpdateClientInput,
  UpdateVehicleInput,
  VehicleCreditDto,
  VehicleDto,
} from '@autosphere/shared';

import { api } from './api';

function qs(params: object | undefined): string {
  if (!params) return '';
  const pairs = Object.entries(params as Record<string, unknown>)
    .filter(([, v]) => v !== undefined && v !== null && v !== '')
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`);
  return pairs.length ? `?${pairs.join('&')}` : '';
}

// -------- Auth --------

export const authApi = {
  login: (body: LoginRequest) =>
    api.post<AuthTokensDto & { userId: string; tenantId: string | null }>(
      '/auth/login',
      body,
      { skipAuth: true },
    ),
  register: (body: RegisterRequest) =>
    api.post<AuthTokensDto & { userId: string; tenantId: string }>(
      '/auth/register',
      body,
      { skipAuth: true },
    ),
  logout: () => api.post<void>('/auth/logout'),
  me: () => api.get<AuthProfileDto>('/auth/me'),
};

// -------- Vehicles --------

export interface ListVehiclesQuery extends PaginationQuery {
  status?: string;
}

export const vehiclesApi = {
  list: (q?: ListVehiclesQuery) =>
    api.get<PaginatedResult<VehicleDto>>(`/vehicles${qs(q)}`),
  get: (id: string) => api.get<VehicleDto>(`/vehicles/${id}`),
  create: (body: CreateVehicleInput) => api.post<VehicleDto>('/vehicles', body),
  update: (id: string, body: UpdateVehicleInput) =>
    api.patch<VehicleDto>(`/vehicles/${id}`, body),
  delete: (id: string) => api.delete<void>(`/vehicles/${id}`),
};

// -------- Clients --------

export interface ListClientsQuery extends PaginationQuery {
  type?: string;
  segment?: string;
  blacklisted?: boolean;
}

export const clientsApi = {
  list: (q?: ListClientsQuery) =>
    api.get<PaginatedResult<ClientDto>>(`/clients${qs(q)}`),
  get: (id: string) => api.get<ClientDto>(`/clients/${id}`),
  create: (body: CreateClientInput) => api.post<ClientDto>('/clients', body),
  update: (id: string, body: UpdateClientInput) =>
    api.patch<ClientDto>(`/clients/${id}`, body),
  delete: (id: string) => api.delete<void>(`/clients/${id}`),
};

// -------- Reservations --------

export interface ListReservationsQuery extends PaginationQuery {
  status?: string;
  vehicleId?: string;
  clientId?: string;
  fromDate?: string;
  toDate?: string;
}

export const reservationsApi = {
  list: (q?: ListReservationsQuery) =>
    api.get<PaginatedResult<ReservationDto>>(`/reservations${qs(q)}`),
  get: (id: string) => api.get<ReservationDto>(`/reservations/${id}`),
  create: (body: CreateReservationInput) =>
    api.post<ReservationDto>('/reservations', body),
  cancel: (id: string) => api.post<ReservationDto>(`/reservations/${id}/cancel`),
  updatePaymentStatus: (
    id: string,
    paymentStatus: 'PENDING' | 'PARTIAL' | 'PAID' | 'REFUNDED',
  ) =>
    api.patch<ReservationDto>(`/reservations/${id}/payment-status`, { paymentStatus }),
  convertToContract: (
    id: string,
    body: {
      kmStart: number;
      depositAmount?: number;
      depositMethod?: 'CASH' | 'CHECK' | 'CARD' | 'CARD_IMPRINT' | 'BANK_TRANSFER';
      depositReference?: string;
    },
  ) => api.post<{ contractId: string }>(`/reservations/${id}/convert-to-contract`, body),
  sweepOverdue: () =>
    api.post<{ marked: number; notified: number }>('/reservations/overdue/sweep'),
};

// -------- Contracts --------

export interface ListContractsQuery extends PaginationQuery {
  status?: string;
  vehicleId?: string;
  clientId?: string;
}

export const contractsApi = {
  list: (q?: ListContractsQuery) =>
    api.get<PaginatedResult<RentalContractDto>>(`/contracts${qs(q)}`),
  get: (id: string) => api.get<RentalContractDto>(`/contracts/${id}`),
  create: (body: CreateContractInput) =>
    api.post<RentalContractDto>('/contracts', body),
  complete: (id: string, body: { kmEnd: number; extraCharges?: number; actualReturnDate?: string; notes?: string }) =>
    api.post<RentalContractDto>(`/contracts/${id}/complete`, body),
  cancel: (id: string) => api.post<RentalContractDto>(`/contracts/${id}/cancel`),
  /// PDF download path. Use with downloadFile() for the auth-aware blob.
  pdfPath: (id: string) => `/contracts/${id}/pdf`,
};

// -------- Payments --------

export interface ListPaymentsQuery extends PaginationQuery {
  status?: string;
  method?: string;
  contractId?: string;
  clientId?: string;
  invoiceId?: string;
}

export const paymentsApi = {
  list: (q?: ListPaymentsQuery) =>
    api.get<PaginatedResult<PaymentDto>>(`/payments${qs(q)}`),
  get: (id: string) => api.get<PaymentDto>(`/payments/${id}`),
  create: (body: CreatePaymentInput) => api.post<PaymentDto>('/payments', body),
};

// -------- Invoices --------

export interface ListInvoicesQuery extends PaginationQuery {
  status?: string;
  contractId?: string;
  clientId?: string;
}

export const invoicesApi = {
  list: (q?: ListInvoicesQuery) =>
    api.get<PaginatedResult<InvoiceDto>>(`/invoices${qs(q)}`),
  get: (id: string) => api.get<InvoiceDto>(`/invoices/${id}`),
  create: (body: CreateInvoiceInput) => api.post<InvoiceDto>('/invoices', body),
};

// -------- Vehicle Credits --------

export interface ListCreditsQuery extends PaginationQuery {
  status?: string;
  creditType?: string;
  vehicleId?: string;
}

export const creditsApi = {
  list: (q?: ListCreditsQuery) =>
    api.get<PaginatedResult<VehicleCreditDto>>(`/vehicle-credits${qs(q)}`),
  get: (id: string) => api.get<VehicleCreditDto>(`/vehicle-credits/${id}`),
  schedule: (id: string) =>
    api.get<CreditPaymentDto[]>(`/vehicle-credits/${id}/schedule`),
  create: (body: CreateVehicleCreditInput) =>
    api.post<VehicleCreditDto>('/vehicle-credits', body),
  recordPayment: (id: string, paymentId: string, body: RecordCreditPaymentInput) =>
    api.post<CreditPaymentDto>(`/vehicle-credits/${id}/payments/${paymentId}`, body),
};

// -------- Maintenance --------

export interface ListMaintenanceRecordsQuery extends PaginationQuery {
  vehicleId?: string;
  type?: string;
}

export const maintenanceApi = {
  listRecords: (q?: ListMaintenanceRecordsQuery) =>
    api.get<PaginatedResult<MaintenanceRecordDto>>(`/maintenance/records${qs(q)}`),
  getRecord: (id: string) =>
    api.get<MaintenanceRecordDto>(`/maintenance/records/${id}`),
  createRecord: (body: CreateMaintenanceRecordInput) =>
    api.post<MaintenanceRecordDto>('/maintenance/records', body),
  listSchedules: (q?: { vehicleId?: string; status?: string }) =>
    api.get<MaintenanceScheduleDto[]>(`/maintenance/schedules${qs(q)}`),
  createSchedule: (body: CreateMaintenanceScheduleInput) =>
    api.post<MaintenanceScheduleDto>('/maintenance/schedules', body),
  cancelSchedule: (id: string) =>
    api.delete<void>(`/maintenance/schedules/${id}`),
  vehicleCost: (vehicleId: string) =>
    api.get<{ totalCost: number; recordCount: number }>(
      `/maintenance/vehicles/${vehicleId}/cost`,
    ),
};

// -------- Alerts --------

export interface ListAlertsQuery {
  status?: string;
  severity?: string;
  vehicleId?: string;
}

export const alertsApi = {
  list: (q?: ListAlertsQuery) => api.get<AlertDto[]>(`/alerts${qs(q)}`),
  summary: () => api.get<AlertSummaryDto>('/alerts/summary'),
  acknowledge: (id: string) => api.post<AlertDto>(`/alerts/${id}/acknowledge`),
  resolve: (id: string) => api.post<AlertDto>(`/alerts/${id}/resolve`),
  resync: () =>
    api.post<{ vehicles: number; invoices: number; credits: number }>(
      '/alerts/resync',
    ),
};

// -------- Notifications --------

export const notificationsApi = {
  list: (q?: { status?: string; limit?: number }) =>
    api.get<NotificationDto[]>(`/notifications${qs(q)}`),
  summary: () => api.get<NotificationSummaryDto>('/notifications/summary'),
  markRead: (id: string) => api.post<void>(`/notifications/${id}/read`),
  markAllRead: () =>
    api.post<{ count: number }>('/notifications/read-all'),
};

// -------- Analytics --------

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4001/api/v1';

export const analyticsApi = {
  dashboard: () => api.get<DashboardKpisDto>('/analytics/dashboard'),
  revenue: (windowDays: number, granularity: ReportGranularity = 'day') =>
    api.get<RevenuePointDto[]>(
      `/analytics/revenue${qs({ windowDays, granularity })}`,
    ),
  fleetPerformance: (limit = 10) =>
    api.get<VehiclePerformanceDto[]>(`/analytics/fleet/performance${qs({ limit })}`),
  topClients: (limit = 10) =>
    api.get<ClientPerformanceDto[]>(`/analytics/clients/top${qs({ limit })}`),
  /// Returns a CSV export URL ready for use with <a href download>.
  /// The Authorization header can't be set on an anchor download, so the caller
  /// should fetch the blob with the auth-enabled client and build an object URL.
  exportUrl: (kind: 'contracts' | 'invoices' | 'payments') =>
    `${API_URL}/analytics/exports/${kind}.csv`,
};

// -------- Platform (SUPER_ADMIN) --------

export interface ListPlatformTenantsQuery extends PaginationQuery {
  status?: string;
  plan?: string;
  q?: string;
}

export const platformApi = {
  metrics: () => api.get<PlatformMetricsDto>('/platform/metrics'),
  listTenants: (q?: ListPlatformTenantsQuery) =>
    api.get<PaginatedResult<TenantDto>>(`/platform/tenants${qs(q)}`),
  getTenant: (id: string) =>
    api.get<TenantSummaryDto>(`/platform/tenants/${id}`),
  updateTenant: (id: string, body: UpdateTenantPlatformInput) =>
    api.patch<TenantDto>(`/platform/tenants/${id}`, body),
  suspend: (id: string, reason?: string) =>
    api.post<TenantDto>(`/platform/tenants/${id}/suspend`, { reason }),
  activate: (id: string) =>
    api.post<TenantDto>(`/platform/tenants/${id}/activate`),
  cancel: (id: string, reason?: string) =>
    api.post<TenantDto>(`/platform/tenants/${id}/cancel`, { reason }),
  extendTrial: (id: string, days: number) =>
    api.post<TenantDto>(`/platform/tenants/${id}/extend-trial`, { days }),
  sweepExpiries: () =>
    api.post<{ expired: number }>('/platform/sweep-expiries'),
};


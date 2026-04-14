import type {
  AuthTokensDto,
  ClientDto,
  CreateClientInput,
  CreateContractInput,
  CreateReservationInput,
  CreateVehicleInput,
  LoginRequest,
  PaginatedResult,
  PaginationQuery,
  RegisterRequest,
  RentalContractDto,
  ReservationDto,
  UpdateClientInput,
  UpdateVehicleInput,
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
};

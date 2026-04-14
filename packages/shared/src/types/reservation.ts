export type ReservationStatusName =
  | 'PENDING'
  | 'CONFIRMED'
  | 'CANCELLED'
  | 'CONVERTED'
  | 'NO_SHOW';

export type ReservationSourceName =
  | 'DIRECT'
  | 'WEBSITE'
  | 'PHONE'
  | 'PARTNER'
  | 'WALK_IN';

export interface ReservationDto {
  id: string;
  tenantId: string;
  reservationCode: string;
  vehicleId: string;
  clientId: string;
  startDate: string;
  endDate: string;
  pickupLocation: string | null;
  returnLocation: string | null;
  dailyRate: string;
  totalAmount: string;
  status: ReservationStatusName;
  source: ReservationSourceName;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  cancelledAt: string | null;
  convertedAt: string | null;
}

export interface CreateReservationInput {
  vehicleId: string;
  clientId: string;
  startDate: string;
  endDate: string;
  pickupLocation?: string;
  returnLocation?: string;
  dailyRate?: number;
  source?: ReservationSourceName;
  notes?: string;
}

export type UpdateReservationInput = Partial<CreateReservationInput> & {
  status?: ReservationStatusName;
};

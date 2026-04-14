export type VehicleStatusName = 'AVAILABLE' | 'RENTED' | 'MAINTENANCE' | 'INACTIVE';
export type VehicleTransmissionName = 'MANUAL' | 'AUTOMATIC';
export type VehicleFuelName = 'PETROL' | 'DIESEL' | 'HYBRID' | 'ELECTRIC' | 'LPG';

export interface VehicleDto {
  id: string;
  tenantId: string;
  registration: string;
  brand: string;
  model: string;
  year: number;
  color: string | null;
  category: string | null;
  vin: string | null;
  transmission: VehicleTransmissionName;
  fuel: VehicleFuelName;
  seats: number;
  status: VehicleStatusName;
  currentKm: number;
  purchaseDate: string | null;
  purchasePrice: string | null;
  dailyRate: string;
  weeklyRate: string | null;
  monthlyRate: string | null;
  insuranceExpiry: string | null;
  technicalVisitExpiry: string | null;
  vignetteExpiry: string | null;
  photos: string[];
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateVehicleInput {
  registration: string;
  brand: string;
  model: string;
  year: number;
  color?: string;
  category?: string;
  vin?: string;
  transmission?: VehicleTransmissionName;
  fuel?: VehicleFuelName;
  seats?: number;
  currentKm?: number;
  purchaseDate?: string;
  purchasePrice?: number;
  dailyRate: number;
  weeklyRate?: number;
  monthlyRate?: number;
  insuranceExpiry?: string;
  technicalVisitExpiry?: string;
  vignetteExpiry?: string;
  notes?: string;
}

export type UpdateVehicleInput = Partial<CreateVehicleInput> & {
  status?: VehicleStatusName;
};

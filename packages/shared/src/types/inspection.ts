export type InspectionTypeName = 'DEPARTURE' | 'RETURN';
export type InspectionStatusName = 'DRAFT' | 'COMPLETED';
export type FuelLevelName = 'EMPTY' | 'QUARTER' | 'HALF' | 'THREE_QUARTERS' | 'FULL';
export type VehicleConditionRatingName = 'EXCELLENT' | 'GOOD' | 'FAIR' | 'POOR';

export interface VehicleInspectionDto {
  id: string;
  tenantId: string;
  vehicleId: string;
  contractId: string;
  type: InspectionTypeName;
  status: InspectionStatusName;
  performedAt: string;
  km: number;
  fuelLevel: FuelLevelName;
  condition: VehicleConditionRatingName;
  damages: string | null;
  photos: string[];
  agentName: string | null;
  signatureUrl: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateInspectionInput {
  contractId: string;
  type: InspectionTypeName;
  performedAt?: string;
  km: number;
  fuelLevel?: FuelLevelName;
  condition?: VehicleConditionRatingName;
  damages?: string;
  photos?: string[];
  agentName?: string;
  signatureUrl?: string;
  notes?: string;
  status?: InspectionStatusName;
}

export type UpdateInspectionInput = Partial<Omit<CreateInspectionInput, 'contractId' | 'type'>>;

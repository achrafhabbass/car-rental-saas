export type MaintenanceTypeName =
  | 'OIL_CHANGE'
  | 'REVISION'
  | 'TIRE_CHANGE'
  | 'BRAKES'
  | 'BATTERY'
  | 'INSPECTION'
  | 'REPAIR'
  | 'OTHER';

export type MaintenanceStatusName =
  | 'SCHEDULED'
  | 'IN_PROGRESS'
  | 'COMPLETED'
  | 'CANCELLED';

export interface MaintenanceRecordDto {
  id: string;
  tenantId: string;
  vehicleId: string;
  type: MaintenanceTypeName;
  status: MaintenanceStatusName;
  title: string;
  description: string | null;
  performedAt: string;
  km: number | null;
  cost: string;
  garage: string | null;
  reference: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateMaintenanceRecordInput {
  vehicleId: string;
  type: MaintenanceTypeName;
  title: string;
  description?: string;
  performedAt?: string;
  km?: number;
  cost?: number;
  garage?: string;
  reference?: string;
  notes?: string;
}

export interface MaintenanceScheduleDto {
  id: string;
  tenantId: string;
  vehicleId: string;
  type: MaintenanceTypeName;
  status: MaintenanceStatusName;
  title: string;
  description: string | null;
  dueDate: string | null;
  dueKm: number | null;
  isCritical: boolean;
  completedAt: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateMaintenanceScheduleInput {
  vehicleId: string;
  type: MaintenanceTypeName;
  title: string;
  description?: string;
  dueDate?: string;
  dueKm?: number;
  isCritical?: boolean;
  notes?: string;
}

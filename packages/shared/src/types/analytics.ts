export interface DashboardKpisDto {
  fleet: { total: number; available: number; rented: number; maintenance: number };
  contracts: { active: number; draft: number; completedThisMonth: number };
  revenue: { thisMonth: number; lastMonth: number; deltaPct: number | null };
  outstanding: { total: number; overdueCount: number };
  maintenance: { openAlerts: number; criticalAlerts: number };
  occupancy: { rateLast30d: number };
}

export interface RevenuePointDto {
  date: string;
  revenue: number;
  payments: number;
}

export interface VehiclePerformanceDto {
  vehicleId: string;
  registration: string;
  brand: string;
  model: string;
  totalRevenue: number;
  contractCount: number;
  maintenanceCost: number;
  creditCost: number;
  net: number;
}

export interface ClientPerformanceDto {
  clientId: string;
  fullName: string;
  contractCount: number;
  totalSpent: number;
  lastContractAt: string | null;
}

export interface ReservationWeekPointDto {
  week: string;
  count: number;
}

export type ReportGranularity = 'day' | 'week' | 'month';

export interface CalendarVehicleSummary {
  id: string;
  registration: string;
  brand: string;
  model: string;
  status: 'AVAILABLE' | 'RENTED' | 'MAINTENANCE' | 'INACTIVE';
}

export interface CalendarBusyWindow {
  kind: 'RESERVATION' | 'CONTRACT';
  id: string;
  startDate: string;
  endDate: string;
  status: string;
  clientName: string;
}

export interface CalendarRow {
  vehicle: CalendarVehicleSummary;
  busy: CalendarBusyWindow[];
}

export interface DashboardBadgesDto {
  alerts: number;
  reservationsToday: number;
  contractsOverdue: number;
}

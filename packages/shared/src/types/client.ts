export type ClientTypeName = 'INDIVIDUAL' | 'COMPANY';
export type ClientSegmentName = 'VIP' | 'REGULAR' | 'OCCASIONAL' | 'AT_RISK';

export interface ClientDto {
  id: string;
  tenantId: string;
  type: ClientTypeName;
  fullName: string;
  companyName: string | null;
  idNumber: string;
  idType: string | null;
  licenseNumber: string | null;
  licenseExpiry: string | null;
  dateOfBirth: string | null;
  nationality: string | null;
  phone: string | null;
  email: string | null;
  addressLine1: string | null;
  addressLine2: string | null;
  city: string | null;
  country: string | null;
  blacklisted: boolean;
  blacklistReason: string | null;
  rating: string;
  segment: ClientSegmentName;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateClientInput {
  type?: ClientTypeName;
  fullName: string;
  companyName?: string;
  idNumber: string;
  idType?: string;
  licenseNumber?: string;
  licenseExpiry?: string;
  dateOfBirth?: string;
  nationality?: string;
  phone?: string;
  email?: string;
  addressLine1?: string;
  addressLine2?: string;
  city?: string;
  country?: string;
  segment?: ClientSegmentName;
  notes?: string;
}

export type UpdateClientInput = Partial<CreateClientInput> & {
  blacklisted?: boolean;
  blacklistReason?: string;
  rating?: number;
};

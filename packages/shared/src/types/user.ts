import type { UserRoleName } from './auth';

export type UserStatusName = 'ACTIVE' | 'INVITED' | 'SUSPENDED' | 'DISABLED';

export interface UserDto {
  id: string;
  tenantId: string | null;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRoleName;
  status: UserStatusName;
  emailVerifiedAt: string | null;
  lastLoginAt: string | null;
  createdAt: string;
}

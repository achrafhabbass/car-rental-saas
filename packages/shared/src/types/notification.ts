export type NotificationChannelName = 'IN_APP' | 'EMAIL' | 'SMS';
export type NotificationStatusName = 'UNREAD' | 'READ' | 'ARCHIVED';

export interface NotificationDto {
  id: string;
  tenantId: string;
  userId: string | null;
  channel: NotificationChannelName;
  status: NotificationStatusName;
  title: string;
  body: string;
  link: string | null;
  alertId: string | null;
  readAt: string | null;
  createdAt: string;
}

export interface NotificationSummaryDto {
  unread: number;
  total: number;
}

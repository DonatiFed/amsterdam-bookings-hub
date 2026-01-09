export type KitchenSlotType = '11-14' | '14-17' | '17-22';

export interface User {
  id: string;
  name: string;
  room_number: string;
  phone?: string | null;
  agreed_to_rules: boolean;
  created_at: string;
}

export interface UserRole {
  id: string;
  user_id: string;
  role: 'admin' | 'user';
  created_at: string;
}

export interface BlockedUser {
  id: string;
  user_id: string;
  reason?: string | null;
  blocked_at: string;
}

export interface KitchenBooking {
  id: string;
  user_id: string;
  booking_date: string;
  slot_type: KitchenSlotType;
  created_at: string;
  user?: User;
}

export interface ProjectorBooking {
  id: string;
  user_id: string;
  start_datetime: string;
  end_datetime: string;
  duration_hours: number;
  created_at: string;
  user?: User;
}

export interface AdminConfig {
  id: string;
  key: string;
  value: string;
  updated_at: string;
}

export const KITCHEN_SLOTS: { type: KitchenSlotType; label: string; startHour: number; endHour: number }[] = [
  { type: '11-14', label: '11:00 – 14:00', startHour: 11, endHour: 14 },
  { type: '14-17', label: '14:00 – 17:00', startHour: 14, endHour: 17 },
  { type: '17-22', label: '17:00 – 22:00', startHour: 17, endHour: 22 },
];

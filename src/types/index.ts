// Types for Municipal Pound Management System
import { 
  UserRole, 
  VehicleType, 
  VehicleStatus, 
  PaymentMethod, 
  ProcedureType,
  ProcedureStatus,
  NotificationType,
  NotificationStatus,
  NotificationChannel,
  IdType
} from './enums';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  phone?: string;
  is_active?: boolean;
  created_at: string;
  updated_at: string;
}

export interface AuthResponse {
  user: User;
  token: string;
  expires_at: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface Vehicle {
  id: string;
  license_plate: string;
  make: string;
  model: string;
  color: string;
  year: number;
  type: VehicleType;
  status: VehicleStatus;
  impound_date: string;
  release_date?: string;
  location: string;
  photos: string[];
  qr_code?: string;
  owner_id?: string;
  owner?: Owner;
  estimated_value: number;
  description?: string;
  created_at: string;
  updated_at: string;
}

export interface Owner {
  id: string;
  first_name: string;
  last_name: string;
  phone: string;
  email?: string;
  address?: string;
  id_type?: IdType;
  id_number?: string;
  created_at: string;
  updated_at: string;
  vehicles?: Vehicle[];
}

export interface Payment {
  id: string;
  vehicle_id: string;
  vehicle?: Vehicle;
  user_id?: string;
  user?: User;
  amount: number;
  method: PaymentMethod;
  reference_number?: string;
  receipt_number: string;
  description?: string;
  created_at: string;
  updated_at: string;
}

export interface Procedure {
  id: string;
  vehicle_id: string;
  vehicle?: Vehicle;
  user_id?: string;
  user?: User;
  type: ProcedureType;
  status: ProcedureStatus;
  reference_number?: string;
  notes?: string;
  scheduled_date?: string;
  documents?: ProcedureDocument[];
  created_at: string;
  updated_at: string;
}

export interface ProcedureDocument {
  id: string;
  procedure_id: string;
  name: string;
  file_path: string;
  file_type: string;
  file_size: number;
  created_at: string;
  updated_at: string;
}

export interface Notification {
  id: string;
  user_id?: string;
  user?: User;
  owner_id?: string;
  owner?: Owner;
  vehicle_id?: string;
  vehicle?: Vehicle;
  title: string;
  content: string;
  type: NotificationType;
  status: NotificationStatus;
  channel: NotificationChannel;
  read_at?: string;
  created_at: string;
  updated_at: string;
}

export interface Settings {
  id: string;
  key: string;
  value: string;
  created_at: string;
  updated_at: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    current_page: number;
    from: number;
    last_page: number;
    path: string;
    per_page: number;
    to: number;
    total: number;
  };
  links: {
    first: string;
    last: string;
    prev: string | null;
    next: string | null;
  };
}

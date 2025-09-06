

export enum UserRole {
  ADMIN = 'admin',
  AGENT = 'agent',
  FINANCE = 'finance'
}

export enum VehicleType {
  MOTORCYCLE = 'Deux-roues motorisés',
  TRICYCLE = 'Tricycles',
  SMALL_VEHICLE = 'Véhicule de 4 à 12 places',
  MEDIUM_VEHICLE = 'Véhicule de 13 à 30 places',
  LARGE_VEHICLE = 'Véhicule à partir de 31 places',
  SMALL_TRUCK = 'Camion inférieur à 5 tonnes',
  MEDIUM_TRUCK = 'Camion de 5 à 10 tonnes',
  LARGE_TRUCK = 'Camion supérieur à 10 tonnes',
  OTHER = 'Autre'
}

export enum VehicleStatus {
  IMPOUNDED = 'impounded',
  CLAIMED = 'claimed',
  SOLD = 'sold',
  DESTROYED = 'destroyed',
  PENDING_DESTRUCTION = 'pending_destruction',
  RELEASED = 'released'
}

export enum PaymentMethod {
  CASH = 'cash',
  BANK_TRANSFER = 'bank_transfer',
  MOBILE_MONEY = 'mobile_money',
  CREDIT_CARD = 'credit_card'
}

export enum ProcedureType {
  RELEASE = 'release',
  TRANSFER = 'transfer',
  DESTRUCTION = 'destruction',
  AUCTION = 'auction',
  SALE  = 'sale'
}

export enum ProcedureStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled'
}

export enum NotificationType {
  INFO = 'info',
  WARNING = 'warning',
  ALERT = 'alert',
  PAYMENT = 'payment',
  PROCEDURE = 'procedure'
}

export enum NotificationStatus {
  UNREAD = 'unread',
  READ = 'read'
}

export enum NotificationChannel {
  IN_APP = 'in_app',
  EMAIL = 'email',
  SMS = 'sms'
}

export enum IdType {
  NATIONAL_ID = 'national_id',
  PASSPORT = 'passport',
  DRIVERS_LICENSE = 'drivers_license',
  OTHER = 'other'
}

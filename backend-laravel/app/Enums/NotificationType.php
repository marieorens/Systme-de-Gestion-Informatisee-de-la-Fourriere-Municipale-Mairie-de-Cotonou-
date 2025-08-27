<?php

namespace App\Enums;

enum NotificationType: string
{
    case IMPOUND_NOTICE = 'impound_notice';
    case DEADLINE_WARNING = 'deadline_warning';
    case PAYMENT_REMINDER = 'payment_reminder';
    case VEHICLE_IMPOUNDED = 'vehicle_impounded';
    case PAYMENT_DUE = 'payment_due';
    case VEHICLE_RELEASED = 'vehicle_released';
    case VEHICLE_READY = 'vehicle_ready';
    case SYSTEM = 'system';
}

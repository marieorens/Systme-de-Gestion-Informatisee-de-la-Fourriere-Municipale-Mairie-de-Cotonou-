<?php

namespace App\Enums;

enum VehicleStatus: string
{
    case IMPOUNDED = 'impounded';
    case CLAIMED = 'claimed';
    case SOLD = 'sold';
    case DESTROYED = 'destroyed';
    case PENDING_DESTRUCTION = 'pending_destruction';
}

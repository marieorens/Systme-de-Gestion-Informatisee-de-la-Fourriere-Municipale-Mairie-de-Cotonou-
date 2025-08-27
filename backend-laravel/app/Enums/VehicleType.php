<?php

namespace App\Enums;

enum VehicleType: string
{
    case CAR = 'car';
    case MOTORCYCLE = 'motorcycle';
    case TRUCK = 'truck';
    case OTHER = 'other';
}

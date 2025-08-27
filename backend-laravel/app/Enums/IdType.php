<?php

namespace App\Enums;

enum IdType: string
{
    case CNI = 'cni';
    case PASSPORT = 'passport';
    case DRIVER_LICENSE = 'driver_license';
}

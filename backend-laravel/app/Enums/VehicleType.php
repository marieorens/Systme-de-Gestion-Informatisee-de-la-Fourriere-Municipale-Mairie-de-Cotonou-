<?php

namespace App\Enums;

enum VehicleType: string
{
    case MOTORCYCLE = 'Deux-roues motorisés';
    case TRICYCLE = 'Tricycles';
    case SMALL_VEHICLE = 'Véhicule de 4 à 12 places';
    case MEDIUM_VEHICLE = 'Véhicule de 13 à 30 places';
    case LARGE_VEHICLE = 'Véhicule à partir de 31 places';
    case SMALL_TRUCK = 'Camion inférieur à 5 tonnes';
    case MEDIUM_TRUCK = 'Camion de 5 à 10 tonnes';
    case LARGE_TRUCK = 'Camion supérieur à 10 tonnes';
    case OTHER = 'Autre';
}

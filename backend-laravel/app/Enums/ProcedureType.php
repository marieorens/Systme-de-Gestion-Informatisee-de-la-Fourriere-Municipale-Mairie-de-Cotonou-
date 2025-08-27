<?php

namespace App\Enums;

enum ProcedureType: string
{
    case RELEASE = 'release';
    case SALE = 'sale';
    case DESTRUCTION = 'destruction';
}

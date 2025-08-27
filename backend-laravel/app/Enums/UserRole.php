<?php

namespace App\Enums;

enum UserRole: string
{
    case ADMIN = 'admin';
    case AGENT = 'agent';
    case FINANCE = 'finance';
}

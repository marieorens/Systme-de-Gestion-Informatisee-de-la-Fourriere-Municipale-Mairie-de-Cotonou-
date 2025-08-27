<?php

namespace App\Enums;

enum NotificationChannel: string
{
    case SMS = 'sms';
    case EMAIL = 'email';
    case APP = 'app';
}

<?php

namespace App\Providers;

use Illuminate\Support\ServiceProvider;
use Twilio\Rest\Client;

class TwilioServiceProvider extends ServiceProvider
{
    public function register()
    {
        $this->app->singleton(Client::class, function ($app) {
            $sid = config('services.twilio.sid');
            $token = config('services.twilio.token');
            return new Client($sid, $token);
        });
    }

    public function boot()
    {
    }
}

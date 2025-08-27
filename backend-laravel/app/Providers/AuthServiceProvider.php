<?php

namespace App\Providers;

use App\Models\Notification;
use App\Models\Owner;
use App\Models\Payment;
use App\Models\Procedure;
use App\Models\User;
use App\Models\Vehicle;
use App\Policies\NotificationPolicy;
use App\Policies\OwnerPolicy;
use App\Policies\PaymentPolicy;
use App\Policies\ProcedurePolicy;
use App\Policies\UserPolicy;
use App\Policies\VehiclePolicy;
use Illuminate\Foundation\Support\Providers\AuthServiceProvider as ServiceProvider;
use Illuminate\Support\Facades\Gate;

class AuthServiceProvider extends ServiceProvider
{
    /**
     * The model to policy mappings for the application.
     *
     * @var array<class-string, class-string>
     */
    protected $policies = [
        User::class => UserPolicy::class,
        Vehicle::class => VehiclePolicy::class,
        Owner::class => OwnerPolicy::class,
        Payment::class => PaymentPolicy::class,
        Procedure::class => ProcedurePolicy::class,
        Notification::class => NotificationPolicy::class,
    ];

    /**
     * Register any authentication / authorization services.
     */
    public function boot(): void
    {
        // Définir les Gates pour les rôles
        Gate::define('admin', function (User $user) {
            return $user->role === 'admin';
        });

        Gate::define('operator', function (User $user) {
            return $user->role === 'operator' || $user->role === 'admin';
        });

        Gate::define('viewer', function (User $user) {
            return $user->role === 'viewer' || $user->role === 'operator' || $user->role === 'admin';
        });
    }
}

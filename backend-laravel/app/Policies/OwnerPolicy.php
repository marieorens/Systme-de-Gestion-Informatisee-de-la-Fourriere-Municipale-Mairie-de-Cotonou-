<?php

namespace App\Policies;

use App\Enums\UserRole;
use App\Models\Owner;
use App\Models\User;
use Illuminate\Auth\Access\HandlesAuthorization;

class OwnerPolicy
{
    use HandlesAuthorization;

    /**
     * Determine whether the user can view any models.
     */
    public function viewAny(User $user): bool
    {
        return true; // All authenticated users can view owners
    }

    /**
     * Determine whether the user can view the model.
     */
    public function view(User $user, Owner $owner): bool
    {
        return true; // All authenticated users can view an owner
    }

    /**
     * Determine whether the user can create models.
     */
    public function create(User $user): bool
    {
        return in_array($user->role, [UserRole::ADMIN, UserRole::AGENT]);
    }

    /**
     * Determine whether the user can update the model.
     */
    public function update(User $user, Owner $owner): bool
    {
        return in_array($user->role, [UserRole::ADMIN, UserRole::AGENT]);
    }

    /**
     * Determine whether the user can delete the model.
     */
    public function delete(User $user, Owner $owner): bool
    {
        return $user->role === UserRole::ADMIN;
    }

    /**
     * Determine whether the user can restore the model.
     */
    public function restore(User $user, Owner $owner): bool
    {
        return $user->role === UserRole::ADMIN;
    }

    /**
     * Determine whether the user can permanently delete the model.
     */
    public function forceDelete(User $user, Owner $owner): bool
    {
        return $user->role === UserRole::ADMIN;
    }
}

<?php

namespace App\Policies;

use App\Models\Notification;
use App\Models\User;
use Illuminate\Auth\Access\HandlesAuthorization;

class NotificationPolicy
{
    use HandlesAuthorization;

    /**
     * Determine whether the user can view any models.
     */
    public function viewAny(User $user): bool
    {
        return true; // Tous les utilisateurs authentifiés peuvent voir leurs notifications
    }

    /**
     * Determine whether the user can view the model.
     */
    public function view(User $user, Notification $notification): bool
    {
        // Un utilisateur ne peut voir que ses propres notifications
        return $user->id === $notification->user_id;
    }

    /**
     * Determine whether the user can create models.
     */
    public function create(User $user): bool
    {
        // Seuls les admins peuvent créer manuellement des notifications
        return $user->role === 'admin';
    }

    /**
     * Determine whether the user can update the model.
     */
    public function update(User $user, Notification $notification): bool
    {
        // Un utilisateur ne peut mettre à jour que ses propres notifications
        return $user->id === $notification->user_id;
    }

    /**
     * Determine whether the user can delete the model.
     */
    public function delete(User $user, Notification $notification): bool
    {
        // Un utilisateur ne peut supprimer que ses propres notifications
        // Les administrateurs peuvent supprimer n'importe quelle notification
        return $user->id === $notification->user_id || $user->role === 'admin';
    }

    /**
     * Determine whether the user can restore the model.
     */
    public function restore(User $user, Notification $notification): bool
    {
        // Seuls les administrateurs peuvent restaurer les notifications
        return $user->role === 'admin';
    }

    /**
     * Determine whether the user can permanently delete the model.
     */
    public function forceDelete(User $user, Notification $notification): bool
    {
        // Seuls les administrateurs peuvent supprimer définitivement les notifications
        return $user->role === 'admin';
    }
}

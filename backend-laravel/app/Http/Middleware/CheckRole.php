<?php

namespace App\Http\Middleware;

use App\Enums\UserRole;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class CheckRole
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next, string ...$roles): Response
    {
        $user = $request->user();
        
        if (!$user) {
            return response()->json(['message' => 'Unauthorized'], 401);
        }
        
        // If no specific roles are required or user is admin
        if (empty($roles) || $user->role === UserRole::ADMIN) {
            return $next($request);
        }
        
        // Check if user has one of the required roles
        foreach ($roles as $role) {
            // Convert string role to enum if needed
            $roleEnum = $this->stringToUserRole($role);
            
            if ($user->role === $roleEnum) {
                return $next($request);
            }
        }
        
        return response()->json(['message' => 'Access denied'], 403);
    }
    
    /**
     * Convert a string role to UserRole enum
     */
    private function stringToUserRole(string $role): ?UserRole
    {
        return match ($role) {
            'admin' => UserRole::ADMIN,
            'agent' => UserRole::AGENT,
            'finance' => UserRole::FINANCE,
            default => null,
        };
    }
}

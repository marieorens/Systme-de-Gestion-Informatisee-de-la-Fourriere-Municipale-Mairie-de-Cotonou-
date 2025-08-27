<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\StoreUserRequest;
use App\Http\Requests\Admin\UpdateUserRequest;
use App\Http\Resources\UserResource;
use App\Models\User;
use App\Enums\UserRole;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\Hash;

/**
 * @OA\Tag(
 *     name="Admin - Users",
 *     description="API Endpoints for user management (admin only)"
 * )
 */
class UserController extends Controller
{
    public function __construct()
    {
        $this->middleware('auth:sanctum');
        // Removing the problematic role middleware
    }

    /**
     * Ensure the user has admin role
     */
    private function ensureAdmin()
    {
        $user = auth()->user();
        if (!$user || $user->role->value !== 'admin') {
            abort(403, 'Access denied. Admin role required.');
        }
    }

    /**
     * @OA\Get(
     *      path="/admin/users",
     *      operationId="getUsersList",
     *      tags={"Admin - Users"},
     *      summary="Get list of users",
     *      description="Returns list of users",
     *      security={{"bearerAuth":{}}},
     *      @OA\Parameter(name="search", in="query", description="Search by name or email", required=false, @OA\Schema(type="string")),
     *      @OA\Parameter(name="role", in="query", description="Filter by role", required=false, @OA\Schema(type="string")),
     *      @OA\Response(
     *          response=200,
     *          description="Successful operation",
     *          @OA\JsonContent(type="array", @OA\Items(ref="#/components/schemas/UserResource"))
     *       ),
     *      @OA\Response(response=401, description="Unauthenticated"),
     *      @OA\Response(response=403, description="Forbidden"),
     * )
     */
    public function index(Request $request)
    {
        $this->ensureAdmin();
        
        $query = User::query();
        
        // Apply search filter
        if ($request->has('search')) {
            $search = $request->input('search');
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('email', 'like', "%{$search}%");
            });
        }
        
        // Apply role filter
        if ($request->has('role') && $request->input('role') !== 'all') {
            $query->where('role', $request->input('role'));
        }
        
        // Paginate results
        $perPage = $request->input('per_page', 15);
        $users = $query->latest()->paginate($perPage);
        
        return UserResource::collection($users);
    }

    /**
     * @OA\Post(
     *      path="/admin/users",
     *      operationId="storeUser",
     *      tags={"Admin - Users"},
     *      summary="Store new user",
     *      description="Returns user data",
     *      security={{"bearerAuth":{}}},
     *      @OA\RequestBody(
     *          required=true,
     *          @OA\JsonContent(ref="#/components/schemas/StoreUserRequest")
     *      ),
     *      @OA\Response(
     *          response=201,
     *          description="Successful operation",
     *          @OA\JsonContent(ref="#/components/schemas/UserResource")
     *       ),
     *      @OA\Response(response=400, description="Bad Request"),
     *      @OA\Response(response=401, description="Unauthenticated"),
     *      @OA\Response(response=403, description="Forbidden"),
     * )
     */
    public function store(StoreUserRequest $request)
    {
        $this->ensureAdmin();
        
        $data = $request->validated();
        $data['password'] = Hash::make($data['password']);
        
        $user = User::create($data);
        
        return new UserResource($user);
    }

    /**
     * @OA\Get(
     *      path="/admin/users/{id}",
     *      operationId="getUserById",
     *      tags={"Admin - Users"},
     *      summary="Get user information",
     *      description="Returns user data",
     *      security={{"bearerAuth":{}}},
     *      @OA\Parameter(name="id", in="path", description="ID of user", required=true, @OA\Schema(type="string")),
     *      @OA\Response(
     *          response=200,
     *          description="Successful operation",
     *          @OA\JsonContent(ref="#/components/schemas/UserResource")
     *       ),
     *      @OA\Response(response=404, description="Not Found"),
     *      @OA\Response(response=401, description="Unauthenticated"),
     *      @OA\Response(response=403, description="Forbidden"),
     * )
     */
    public function show(User $user)
    {
        $this->ensureAdmin();
        
        return new UserResource($user);
    }

    /**
     * @OA\Put(
     *      path="/admin/users/{id}",
     *      operationId="updateUser",
     *      tags={"Admin - Users"},
     *      summary="Update existing user",
     *      description="Returns updated user data",
     *      security={{"bearerAuth":{}}},
     *      @OA\Parameter(name="id", in="path", description="ID of user", required=true, @OA\Schema(type="string")),
     *      @OA\RequestBody(
     *          required=true,
     *          @OA\JsonContent(ref="#/components/schemas/UpdateUserRequest")
     *      ),
     *      @OA\Response(
     *          response=200,
     *          description="Successful operation",
     *          @OA\JsonContent(ref="#/components/schemas/UserResource")
     *       ),
     *      @OA\Response(response=400, description="Bad Request"),
     *      @OA\Response(response=401, description="Unauthenticated"),
     *      @OA\Response(response=403, description="Forbidden"),
     *      @OA\Response(response=404, description="Not Found"),
     * )
     */
    public function update(UpdateUserRequest $request, User $user)
    {
        $this->ensureAdmin();
        
        $data = $request->validated();
        
        // Only update password if it's provided
        if (isset($data['password']) && !empty($data['password'])) {
            $data['password'] = Hash::make($data['password']);
        } else {
            unset($data['password']);
        }
        
        $user->update($data);
        
        return new UserResource($user);
    }

    /**
     * @OA\Delete(
     *      path="/admin/users/{id}",
     *      operationId="deleteUser",
     *      tags={"Admin - Users"},
     *      summary="Delete existing user",
     *      description="Deletes a record and returns no content",
     *      security={{"bearerAuth":{}}},
     *      @OA\Parameter(name="id", in="path", description="ID of user", required=true, @OA\Schema(type="string")),
     *      @OA\Response(response=204, description="Successful operation"),
     *      @OA\Response(response=401, description="Unauthenticated"),
     *      @OA\Response(response=403, description="Forbidden"),
     *      @OA\Response(response=404, description="Not Found"),
     * )
     */
    public function destroy(User $user)
    {
        $this->ensureAdmin();
        
        // Prevent deleting the last admin user
        if ($user->role->value === 'admin') {
            $adminCount = User::where('role', 'admin')->count();
            if ($adminCount <= 1) {
                return response()->json([
                    'message' => "Vous ne pouvez pas supprimer le dernier administrateur."
                ], 422);
            }
        }
        
        // Check if the user has created any resources that would be orphaned
        if ($user->notifications()->exists() || $user->payments()->exists()) {
            return response()->json([
                'message' => "Cet utilisateur a des notifications ou des paiements associés et ne peut pas être supprimé."
            ], 422);
        }
        
        $user->delete();
        
        return response()->noContent();
    }
    
    /**
     * @OA\Get(
     *      path="/admin/roles",
     *      operationId="getRoles",
     *      tags={"Admin - Users"},
     *      summary="Get available user roles",
     *      description="Returns list of available user roles",
     *      security={{"bearerAuth":{}}},
     *      @OA\Response(
     *          response=200,
     *          description="Successful operation",
     *          @OA\JsonContent(
     *              @OA\Property(property="data", type="array", @OA\Items(type="string"))
     *          )
     *       ),
     *      @OA\Response(response=401, description="Unauthenticated"),
     *      @OA\Response(response=403, description="Forbidden"),
     * )
     */
    public function getRoles()
    {
        $this->ensureAdmin();
        
        $roles = UserRole::cases();
        $roleValues = array_map(fn($role) => $role->value, $roles);
        
        return response()->json([
            'data' => $roleValues
        ]);
    }

    /**
     * @OA\Patch(
     *      path="/admin/users/{id}/toggle-active",
     *      operationId="toggleUserActive",
     *      tags={"Admin - Users"},
     *      summary="Activer ou désactiver un utilisateur",
     *      description="Change le statut actif d'un utilisateur",
     *      security={{"bearerAuth":{}}},
     *      @OA\Parameter(name="id", in="path", description="ID de l'utilisateur", required=true, @OA\Schema(type="string")),
     *      @OA\Response(
     *          response=200,
     *          description="Opération réussie",
     *          @OA\JsonContent(ref="#/components/schemas/UserResource")
     *       ),
     *      @OA\Response(response=400, description="Requête invalide"),
     *      @OA\Response(response=401, description="Non authentifié"),
     *      @OA\Response(response=403, description="Interdit"),
     *      @OA\Response(response=404, description="Non trouvé"),
     * )
     */
    public function toggleActive(User $user)
    {
        $this->ensureAdmin();
        
        // Empêcher la désactivation du dernier administrateur actif
        if ($user->role->value === 'admin' && $user->is_active) {
            $activeAdminCount = User::where('role', 'admin')
                                     ->where('is_active', true)
                                     ->count();
            if ($activeAdminCount <= 1) {
                return response()->json([
                    'message' => "Vous ne pouvez pas désactiver le dernier administrateur actif."
                ], 400);
            }
        }
        
        // Inverser le statut actif
        $user->is_active = !$user->is_active;
        $user->save();
        
        return new UserResource($user);
    }
}

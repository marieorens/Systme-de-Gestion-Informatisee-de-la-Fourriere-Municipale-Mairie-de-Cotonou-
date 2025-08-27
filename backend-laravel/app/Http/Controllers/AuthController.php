<?php

namespace App\Http\Controllers;

use App\Http\Requests\Auth\ChangePasswordRequest;
use App\Http\Requests\Auth\LoginRequest;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    /**
     * @OA\Post(
     *      path="/auth/login",
     *      operationId="login",
     *      tags={"Authentication"},
     *      summary="User Login",
     *      description="Logs in a user and returns an auth token",
     *      @OA\RequestBody(
     *          required=true,
     *          @OA\JsonContent(
     *              required={"email","password"},
     *              @OA\Property(property="email", type="string", format="email", example="admin@test.com"),
     *              @OA\Property(property="password", type="string", format="password", example="password"),
     *          ),
     *      ),
     *      @OA\Response(
     *          response=200,
     *          description="Successful login",
     *          @OA\JsonContent(
     *              @OA\Property(property="user", type="object"),
     *              @OA\Property(property="token", type="string"),
     *              @OA\Property(property="expires_at", type="string", format="date-time"),
     *          )
     *      ),
     *      @OA\Response(
     *          response=422,
     *          description="Validation error"
     *      )
     * )
     */
    public function login(LoginRequest $request): JsonResponse
    {
        if (!Auth::attempt($request->validated())) {
            throw ValidationException::withMessages([
                'email' => ['The provided credentials are incorrect.'],
            ]);
        }

        $user = User::where('email', $request->email)->first();
        $token = $user->createToken('auth_token');
        $expiresAt = now()->addDays(7);

        return response()->json([
            'user' => $user,
            'token' => $token->plainTextToken,
            'expires_at' => $expiresAt->toDateTimeString(),
        ]);
    }

    /**
     * @OA\Post(
     *      path="/auth/logout",
     *      operationId="logout",
     *      tags={"Authentication"},
     *      summary="User Logout",
     *      description="Logs out the current authenticated user",
     *      security={{"bearerAuth":{}}},
     *      @OA\Response(
     *          response=200,
     *          description="Successful logout",
     *          @OA\JsonContent(
     *              @OA\Property(property="message", type="string", example="Logged out successfully")
     *          )
     *      ),
     *      @OA\Response(
     *          response=401,
     *          description="Unauthenticated"
     *      )
     * )
     */
    public function logout(Request $request): JsonResponse
    {
        $request->user()->currentAccessToken()->delete();

        return response()->json([
            'message' => 'Logged out successfully'
        ]);
    }

    /**
     * @OA\Get(
     *      path="/auth/profile",
     *      operationId="getProfile",
     *      tags={"Authentication"},
     *      summary="Get current user profile",
     *      description="Returns the profile of the authenticated user",
     *      security={{"bearerAuth":{}}},
     *      @OA\Response(
     *          response=200,
     *          description="Successful operation",
     *          @OA\JsonContent(
     *              @OA\Property(property="user", type="object")
     *          )
     *      ),
     *      @OA\Response(
     *          response=401,
     *          description="Unauthenticated"
     *      )
     * )
     */
    public function profile(Request $request): JsonResponse
    {
        return response()->json([
            'user' => $request->user()
        ]);
    }

    /**
     * @OA\Post(
     *      path="/auth/change-password",
     *      operationId="changePassword",
     *      tags={"Authentication"},
     *      summary="Change user password",
     *      description="Changes the password for the authenticated user",
     *      security={{"bearerAuth":{}}},
     *      @OA\RequestBody(
     *          required=true,
     *          @OA\JsonContent(
     *              required={"current_password", "password", "password_confirmation"},
     *              @OA\Property(property="current_password", type="string", format="password", example="password"),
     *              @OA\Property(property="password", type="string", format="password", example="new-password"),
     *              @OA\Property(property="password_confirmation", type="string", format="password", example="new-password"),
     *          ),
     *      ),
     *      @OA\Response(
     *          response=200,
     *          description="Password changed successfully",
     *          @OA\JsonContent(
     *              @OA\Property(property="message", type="string", example="Password changed successfully")
     *          )
     *      ),
     *      @OA\Response(
     *          response=422,
     *          description="Validation error"
     *      ),
     *      @OA\Response(
     *          response=401,
     *          description="Unauthenticated"
     *      )
     * )
     */
    public function changePassword(ChangePasswordRequest $request): JsonResponse
    {
        $user = $request->user();
        
        // Verify the current password
        if (!Hash::check($request->current_password, $user->password)) {
            throw ValidationException::withMessages([
                'current_password' => ['The current password is incorrect.'],
            ]);
        }
        
        // Update the password
        $user->password = Hash::make($request->password);
        $user->save();
        
        return response()->json([
            'message' => 'Password changed successfully'
        ]);
    }
}

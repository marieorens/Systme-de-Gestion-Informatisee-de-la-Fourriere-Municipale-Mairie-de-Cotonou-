<?php

namespace App\Http\Requests\Admin;

use App\Enums\UserRole;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rules\Enum;
use Illuminate\Validation\Rules\Password;

/**
 * @OA\Schema(
 *     schema="StoreUserRequest",
 *     type="object",
 *     title="Store User Request",
 *     required={"name", "email", "password", "password_confirmation", "role"},
 *     properties={
 *         @OA\Property(property="name", type="string", example="New User"),
 *         @OA\Property(property="email", type="string", format="email", example="new.user@example.com"),
 *         @OA\Property(property="password", type="string", format="password", example="password123"),
 *         @OA\Property(property="password_confirmation", type="string", format="password", example="password123"),
 *         @OA\Property(property="role", type="string", enum={"admin", "manager", "agent"}, example="agent"),
 *     }
 * )
 */
class StoreUserRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return $this->user()->role === UserRole::ADMIN;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'string', 'email', 'max:255', 'unique:users'],
            'password' => ['required', 'confirmed', Password::defaults()],
            'role' => ['required', new Enum(UserRole::class)],
            'phone' => ['nullable', 'string', 'max:20'],
        ];
    }
}

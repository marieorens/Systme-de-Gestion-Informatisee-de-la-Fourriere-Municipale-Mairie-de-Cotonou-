<?php

namespace App\Http\Requests\Admin;

use App\Enums\UserRole;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Rules\Enum;
use Illuminate\Validation\Rules\Password;

/**
 * @OA\Schema(
 *     schema="UpdateUserRequest",
 *     type="object",
 *     title="Update User Request",
 *     properties={
 *         @OA\Property(property="name", type="string", example="Updated User"),
 *         @OA\Property(property="email", type="string", format="email", example="updated.user@example.com"),
 *         @OA\Property(property="password", type="string", format="password", example="newpassword123", nullable=true),
 *         @OA\Property(property="password_confirmation", type="string", format="password", example="newpassword123"),
 *         @OA\Property(property="role", type="string", enum={"admin", "manager", "agent"}, example="manager"),
 *     }
 * )
 */
class UpdateUserRequest extends FormRequest
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
        $userId = $this->route('user')->id;

        return [
            'name' => ['sometimes', 'required', 'string', 'max:255'],
            'email' => ['sometimes', 'required', 'string', 'email', 'max:255', Rule::unique('users')->ignore($userId)],
            'password' => ['nullable', 'confirmed', Password::defaults()],
            'role' => ['sometimes', 'required', new Enum(UserRole::class)],
            'phone' => ['nullable', 'string', 'max:20'],
        ];
    }
}

<?php

namespace App\Http\Requests\Owner;

use App\Enums\IdType;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rules\Enum;

/**
 * @OA\Schema(
 *     schema="StoreOwnerRequest",
 *     type="object",
 *     title="Store Owner Request",
 *     required={"first_name", "last_name", "phone_number", "address", "id_type", "id_number"},
 *     properties={
 *         @OA\Property(property="first_name", type="string", example="John"),
 *         @OA\Property(property="last_name", type="string", example="Doe"),
 *         @OA\Property(property="phone_number", type="string", example="+22997000000"),
 *         @OA\Property(property="email", type="string", format="email", example="john.doe@example.com", nullable=true),
 *         @OA\Property(property="address", type="string", example="123 Rue de la Paix, Cotonou"),
 *         @OA\Property(property="id_type", type="string", enum={"passport", "national_id", "drivers_license"}, example="national_id"),
 *         @OA\Property(property="id_number", type="string", example="B01234567"),
 *         @OA\Property(property="id_expiration_date", type="string", format="date", example="2030-12-31", nullable=true),
 *     }
 * )
 */
class StoreOwnerRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'first_name' => ['required', 'string', 'max:255'],
            'last_name' => ['required', 'string', 'max:255'],
            'phone_number' => ['required', 'string', 'max:20', 'unique:owners,phone_number'],
            'email' => ['nullable', 'email', 'max:255', 'unique:owners,email'],
            'address' => ['required', 'string'],
            'id_type' => ['required', new Enum(IdType::class)],
            'id_number' => ['required', 'string', 'max:50', 'unique:owners,id_number'],
            'id_expiration_date' => ['nullable', 'date'],
        ];
    }
}

<?php

namespace App\Http\Requests\Owner;

use App\Enums\IdType;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Rules\Enum;

/**
 * @OA\Schema(
 *     schema="UpdateOwnerRequest",
 *     type="object",
 *     title="Update Owner Request",
 *     properties={
 *         @OA\Property(property="first_name", type="string", example="John"),
 *         @OA\Property(property="last_name", type="string", example="Doe"),
 *         @OA\Property(property="phone_number", type="string", example="+22997000001"),
 *         @OA\Property(property="email", type="string", format="email", example="john.doe.updated@example.com", nullable=true),
 *         @OA\Property(property="address", type="string", example="456 Avenue de la Liberte, Cotonou"),
 *         @OA\Property(property="id_type", type="string", enum={"passport", "national_id", "drivers_license"}, example="passport"),
 *         @OA\Property(property="id_number", type="string", example="P01234567"),
 *         @OA\Property(property="id_expiration_date", type="string", format="date", example="2032-12-31", nullable=true),
 *     }
 * )
 */
class UpdateOwnerRequest extends FormRequest
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
        $ownerId = $this->route('owner')->id;

        return [
            'first_name' => ['sometimes', 'required', 'string', 'max:255'],
            'last_name' => ['sometimes', 'required', 'string', 'max:255'],
            'phone_number' => ['sometimes', 'required', 'string', 'max:20', Rule::unique('owners')->ignore($ownerId)],
            'email' => ['nullable', 'email', 'max:255', Rule::unique('owners')->ignore($ownerId)],
            'address' => ['sometimes', 'required', 'string'],
            'id_type' => ['sometimes', 'required', new Enum(IdType::class)],
            'id_number' => ['sometimes', 'required', 'string', 'max:50', Rule::unique('owners')->ignore($ownerId)],
            'id_expiration_date' => ['nullable', 'date'],
        ];
    }
}

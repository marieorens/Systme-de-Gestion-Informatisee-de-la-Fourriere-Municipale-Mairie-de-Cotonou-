<?php

namespace App\Http\Requests\Vehicle;

use App\Enums\VehicleStatus;
use App\Enums\VehicleType;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Rules\Enum;

/**
 * @OA\Schema(
 *     schema="UpdateVehicleRequest",
 *     type="object",
 *     title="Update Vehicle Request",
 *     properties={
 *         @OA\Property(property="license_plate", type="string", example="AB-123-CD"),
 *         @OA\Property(property="make", type="string", example="Toyota"),
 *         @OA\Property(property="model", type="string", example="Corolla"),
 *         @OA\Property(property="color", type="string", example="Blue"),
 *         @OA\Property(property="year", type="integer", example=2020),
 *         @OA\Property(property="type", type="string", enum={"car", "motorcycle", "truck"}, example="car"),
 *         @OA\Property(property="status", type="string", enum={"impounded", "released", "auctioned"}, example="released"),
 *         @OA\Property(property="impound_date", type="string", format="date", example="2025-08-22"),
 *         @OA\Property(property="location", type="string", example="Released"),
 *         @OA\Property(property="photos", type="array", @OA\Items(type="string"), example={"path/to/photo1.jpg"}, nullable=true),
 *         @OA\Property(property="qr_code", type="string", example="data:image/png;base64,...", nullable=true),
 *         @OA\Property(property="owner_id", type="integer", example=1),
 *         @OA\Property(property="estimated_value", type="number", format="float", example=14500.00),
 *         @OA\Property(property="description", type="string", example="Vehicle released after payment.", nullable=true),
 *     }
 * )
 */
class UpdateVehicleRequest extends FormRequest
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
            'license_plate' => ['sometimes', 'string', Rule::unique('vehicles')->ignore($this->vehicle)],
            'make' => ['sometimes', 'string', 'max:255'],
            'model' => ['sometimes', 'string', 'max:255'],
            'color' => ['sometimes', 'string', 'max:255'],
            'year' => ['sometimes', 'integer', 'min:1900'],
            'type' => ['sometimes', new Enum(VehicleType::class)],
            'status' => ['sometimes', new Enum(VehicleStatus::class)],
            'impound_date' => ['sometimes', 'date'],
            'location' => ['sometimes', 'string', 'max:255'],
            'photos' => ['nullable', 'array'],
            'qr_code' => ['nullable', 'string'],
            'owner_id' => ['sometimes', 'exists:owners,id'],
            'estimated_value' => ['sometimes', 'numeric', 'min:0'],
            'description' => ['nullable', 'string'],
        ];
    }
}

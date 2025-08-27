<?php

namespace App\Http\Requests\Procedure;

use App\Enums\ProcedureType;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rules\Enum;

/**
 * @OA\Schema(
 *     schema="StoreProcedureRequest",
 *     type="object",
 *     title="Store Procedure Request",
 *     required={"vehicle_id", "procedure_type", "cost"},
 *     properties={
 *         @OA\Property(property="vehicle_id", type="integer", example=1),
 *         @OA\Property(property="procedure_type", type="string", enum={"impound", "release", "auction"}, example="impound"),
 *         @OA\Property(property="description", type="string", example="Vehicle impounded for illegal parking.", nullable=true),
 *         @OA\Property(property="cost", type="number", format="float", example=75.50),
 *     }
 * )
 */
class StoreProcedureRequest extends FormRequest
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
            'vehicle_id' => ['required', 'exists:vehicles,id'],
            'procedure_type' => ['required', new Enum(ProcedureType::class)],
            'description' => ['nullable', 'string'],
            'cost' => ['required', 'numeric', 'min:0'],
        ];
    }
}

<?php

namespace App\Http\Requests\Procedure;

use App\Enums\ProcedureStatus;
use App\Enums\ProcedureType;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rules\Enum;

/**
 * @OA\Schema(
 *     schema="UpdateProcedureRequest",
 *     type="object",
 *     title="Update Procedure Request",
 *     properties={
 *         @OA\Property(property="procedure_type", type="string", enum={"impound", "release", "auction"}, example="release"),
 *         @OA\Property(property="description", type="string", example="Vehicle released after payment.", nullable=true),
 *         @OA\Property(property="status", type="string", enum={"pending", "in_progress", "completed", "cancelled"}, example="completed"),
 *         @OA\Property(property="cost", type="number", format="float", example=80.00),
 *     }
 * )
 */
class UpdateProcedureRequest extends FormRequest
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
            'procedure_type' => ['sometimes', 'required', new Enum(ProcedureType::class)],
            'description' => ['nullable', 'string'],
            'status' => ['sometimes', 'required', new Enum(ProcedureStatus::class)],
            'cost' => ['sometimes', 'required', 'numeric', 'min:0'],
        ];
    }
}

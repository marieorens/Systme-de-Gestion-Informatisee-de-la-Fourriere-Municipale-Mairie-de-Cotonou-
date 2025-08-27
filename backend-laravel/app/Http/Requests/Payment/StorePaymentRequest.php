<?php

namespace App\Http\Requests\Payment;

use App\Enums\PaymentMethod;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rules\Enum;

/**
 * @OA\Schema(
 *     schema="StorePaymentRequest",
 *     type="object",
 *     title="Store Payment Request",
 *     required={"procedure_id", "amount", "payment_method"},
 *     properties={
 *         @OA\Property(property="procedure_id", type="integer", example=1),
 *         @OA\Property(property="amount", type="number", format="float", example=75.50),
 *         @OA\Property(property="payment_method", type="string", enum={"cash", "card", "mobile_money"}, example="cash"),
 *         @OA\Property(property="reference", type="string", example="TXN_123456789", nullable=true),
 *     }
 * )
 */
class StorePaymentRequest extends FormRequest
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
            'procedure_id' => ['required', 'exists:procedures,id'],
            'amount' => ['required', 'numeric', 'min:0'],
            'payment_method' => ['required', new Enum(PaymentMethod::class)],
            'reference' => ['nullable', 'string', 'max:255'],
        ];
    }
}

<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @OA\Schema(
 *     schema="PaymentResource",
 *     type="object",
 *     title="Payment Resource",
 *     properties={
 *         @OA\Property(property="id", type="integer", example=1),
 *         @OA\Property(property="procedure_id", type="integer", example=1),
 *         @OA\Property(property="amount", type="number", format="float", example=75.50),
 *         @OA\Property(property="payment_method", type="string", enum={"cash", "card", "mobile_money"}, example="cash"),
 *         @OA\Property(property="status", type="string", enum={"pending", "completed", "failed", "refunded"}, example="completed"),
 *         @OA\Property(property="reference", type="string", example="TXN_123456789"),
 *         @OA\Property(property="paid_at", type="string", format="date-time"),
 *         @OA\Property(property="created_at", type="string", format="date-time"),
 *         @OA\Property(property="updated_at", type="string", format="date-time"),
 *         @OA\Property(property="procedure", ref="#/components/schemas/ProcedureResource"),
 *         @OA\Property(property="processed_by", ref="#/components/schemas/UserResource"),
 *     }
 * )
 */
class PaymentResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'vehicle_id' => $this->vehicle_id,
            'amount' => $this->amount,
            'payment_method' => $this->payment_method,
            'status' => $this->status,
            'reference' => $this->reference,
            'receipt_url' => $this->receipt_url,
            'payment_date' => $this->payment_date,
            'description' => $this->description,
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
            'vehicle' => new VehicleResource($this->whenLoaded('vehicle')),
            'user' => new UserResource($this->whenLoaded('user')),
        ];
    }
}

<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @OA\Schema(
 *     schema="OwnerResource",
 *     type="object",
 *     title="Owner Resource",
 *     properties={
 *         @OA\Property(property="id", type="integer", example=1),
 *         @OA\Property(property="first_name", type="string", example="Jane"),
 *         @OA\Property(property="last_name", type="string", example="Doe"),
 *         @OA\Property(property="phone", type="string", example="+1234567890"),
 *         @OA\Property(property="email", type="string", format="email", example="jane.doe@example.com"),
 *         @OA\Property(property="address", type="string", example="123 Main St, Cotonou"),
 *         @OA\Property(property="id_number", type="string", example="B12345678"),
 *         @OA\Property(property="id_type", type="string", enum={"passport", "national_id", "drivers_license"}, example="national_id"),
 *         @OA\Property(property="created_at", type="string", format="date-time"),
 *         @OA\Property(property="updated_at", type="string", format="date-time"),
 *     }
 * )
 */
class OwnerResource extends JsonResource
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
            'first_name' => $this->first_name,
            'last_name' => $this->last_name,
            'phone' => $this->phone,
            'email' => $this->email,
            'address' => $this->address,
            'id_number' => $this->id_number,
            'id_type' => $this->id_type,
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}

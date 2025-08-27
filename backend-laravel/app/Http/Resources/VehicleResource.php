<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @OA\Schema(
 *     schema="VehicleResource",
 *     type="object",
 *     title="Vehicle Resource",
 *     properties={
 *         @OA\Property(property="id", type="integer", example=1),
 *         @OA\Property(property="license_plate", type="string", example="AB-123-CD"),
 *         @OA\Property(property="make", type="string", example="Toyota"),
 *         @OA\Property(property="model", type="string", example="Corolla"),
 *         @OA\Property(property="color", type="string", example="Red"),
 *         @OA\Property(property="year", type="integer", example=2020),
 *         @OA\Property(property="type", type="string", enum={"car", "motorcycle", "truck"}, example="car"),
 *         @OA\Property(property="status", type="string", enum={"impounded", "released", "auctioned"}, example="impounded"),
 *         @OA\Property(property="impound_date", type="string", format="date"),
 *         @OA\Property(property="location", type="string", example="Row 3, Spot 12"),
 *         @OA\Property(property="photos", type="array", @OA\Items(type="string"), example={"path/to/photo1.jpg"}),
 *         @OA\Property(property="qr_code", type="string", example="data:image/png;base64,..."),
 *         @OA\Property(property="owner_id", type="integer", example=1),
 *         @OA\Property(property="created_at", type="string", format="date-time"),
 *         @OA\Property(property="updated_at", type="string", format="date-time"),
 *         @OA\Property(property="owner", ref="#/components/schemas/OwnerResource"),
 *     }
 * )
 */
class VehicleResource extends JsonResource
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
            'license_plate' => $this->license_plate,
            'make' => $this->make,
            'model' => $this->model,
            'color' => $this->color,
            'year' => $this->year,
            'type' => $this->type,
            'status' => $this->status,
            'impound_date' => $this->impound_date,
            'location' => $this->location,
            'photos' => $this->photos,
            'qr_code' => $this->qr_code,
            'owner_id' => $this->owner_id,
            'estimated_value' => $this->estimated_value,
            'description' => $this->description,
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
            'owner' => new OwnerResource($this->whenLoaded('owner')),
        ];
    }
}

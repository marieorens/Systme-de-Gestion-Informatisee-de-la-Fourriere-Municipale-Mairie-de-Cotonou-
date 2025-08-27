<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @OA\Schema(
 *     schema="NotificationResource",
 *     type="object",
 *     title="Notification Resource",
 *     properties={
 *         @OA\Property(property="id", type="string", format="uuid", example="9a7f1b2c-3d4e-5f6a-7b8c-9d0e1f2a3b4c"),
 *         @OA\Property(property="title", type="string", example="Véhicule mis en fourrière"),
 *         @OA\Property(property="message", type="string", example="Votre véhicule a été mis en fourrière le 15/08/2025"),
 *         @OA\Property(property="type", type="string", example="vehicle_impounded"),
 *         @OA\Property(property="channel", type="string", example="app"),
 *         @OA\Property(property="read_at", type="string", format="date-time", nullable=true),
 *         @OA\Property(property="scheduled_at", type="string", format="date-time", nullable=true),
 *         @OA\Property(property="user", type="object", ref="#/components/schemas/UserResource", nullable=true),
 *         @OA\Property(property="owner", type="object", ref="#/components/schemas/OwnerResource", nullable=true),
 *         @OA\Property(property="vehicle", type="object", ref="#/components/schemas/VehicleResource", nullable=true),
 *         @OA\Property(property="created_at", type="string", format="date-time"),
 *         @OA\Property(property="updated_at", type="string", format="date-time"),
 *     }
 * )
 */
class NotificationResource extends JsonResource
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
            'title' => $this->title,
            'message' => $this->message,
            'type' => $this->type,
            'channel' => $this->channel,
            'read_at' => $this->read_at,
            'scheduled_at' => $this->scheduled_at,
            'user' => $this->whenLoaded('user', function () {
                return new UserResource($this->user);
            }),
            'owner' => $this->whenLoaded('owner', function () {
                return new OwnerResource($this->owner);
            }),
            'vehicle' => $this->whenLoaded('vehicle', function () {
                return new VehicleResource($this->vehicle);
            }),
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}

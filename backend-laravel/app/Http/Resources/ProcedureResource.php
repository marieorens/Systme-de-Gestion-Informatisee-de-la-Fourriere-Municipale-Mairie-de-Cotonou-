<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @OA\Schema(
 *     schema="ProcedureResource",
 *     type="object",
 *     title="Procedure Resource",
 *     properties={
 *         @OA\Property(property="id", type="integer", example=1),
 *         @OA\Property(property="vehicle_id", type="integer", example=1),
 *         @OA\Property(property="procedure_type", type="string", enum={"impound", "release", "auction"}, example="impound"),
 *         @OA\Property(property="description", type="string", example="Vehicle impounded for illegal parking."),
 *         @OA\Property(property="status", type="string", enum={"pending", "in_progress", "completed", "cancelled"}, example="pending"),
 *         @OA\Property(property="cost", type="number", format="float", example=75.50),
 *         @OA\Property(property="created_at", type="string", format="date-time"),
 *         @OA\Property(property="updated_at", type="string", format="date-time"),
 *         @OA\Property(property="created_by", ref="#/components/schemas/UserResource"),
 *         @OA\Property(property="documents", type="array", @OA\Items(ref="#/components/schemas/ProcedureDocumentResource")),
 *     }
 * )
 */
class ProcedureResource extends JsonResource
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
            'procedure_type' => $this->procedure_type,
            'description' => $this->description,
            'status' => $this->status,
            'cost' => $this->cost,
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
            'created_by' => new UserResource($this->whenLoaded('creator')),
            'documents' => ProcedureDocumentResource::collection($this->whenLoaded('documents')),
        ];
    }
}

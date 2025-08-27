<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use Illuminate\Support\Facades\Storage;

/**
 * @OA\Schema(
 *     schema="ProcedureDocumentResource",
 *     type="object",
 *     title="Procedure Document Resource",
 *     properties={
 *         @OA\Property(property="id", type="integer", example=1),
 *         @OA\Property(property="procedure_id", type="integer", example=1),
 *         @OA\Property(property="document_type", type="string", example="impound_report"),
 *         @OA\Property(property="file_path", type="string", example="documents/impound_report_1.pdf"),
 *         @OA\Property(property="url", type="string", format="url", example="http://localhost/storage/documents/impound_report_1.pdf"),
 *         @OA\Property(property="created_at", type="string", format="date-time"),
 *     }
 * )
 */
class ProcedureDocumentResource extends JsonResource
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
            'procedure_id' => $this->procedure_id,
            'document_type' => $this->document_type,
            'file_path' => $this->file_path,
            'url' => Storage::url($this->file_path),
            'created_at' => $this->created_at,
        ];
    }
}

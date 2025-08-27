<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

/**
 * @OA\Schema(
 *     schema="Setting",
 *     type="object",
 *     title="Setting",
 *     properties={
 *         @OA\Property(property="id", type="integer", example=1),
 *         @OA\Property(property="key", type="string", example="garage_name"),
 *         @OA\Property(property="value", type="object", example={"name": "Garage Municipal de Cotonou", "address": "123 Rue de la Ville", "phone": "+229 12345678"}),
 *         @OA\Property(property="description", type="string", example="Nom et coordonnées du garage"),
 *         @OA\Property(property="group", type="string", example="general"),
 *         @OA\Property(property="is_public", type="boolean", example=true),
 *         @OA\Property(property="created_at", type="string", format="date-time"),
 *         @OA\Property(property="updated_at", type="string", format="date-time"),
 *     }
 * )
 */
class Setting extends Model
{
    use HasFactory;

    protected $fillable = [
        'key',
        'value',
        'description',
        'group',
        'is_public',
    ];

    protected function casts(): array
    {
        return [
            'value' => 'json',
            'is_public' => 'boolean',
        ];
    }
}

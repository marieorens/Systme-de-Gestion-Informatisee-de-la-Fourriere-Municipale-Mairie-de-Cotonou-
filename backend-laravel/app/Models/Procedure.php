<?php

namespace App\Models;

use App\Enums\ProcedureStatus;
use App\Enums\ProcedureType;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Procedure extends Model
{
    use HasFactory;

    protected $fillable = [
        'vehicle_id',
        'type',
        'status',
        'fees_calculated',
        'created_by',
        'user_id',
    ];

    protected function casts(): array
    {
        return [
            'type' => ProcedureType::class,
            'status' => ProcedureStatus::class,
        ];
    }

    public function vehicle(): BelongsTo
    {
        return $this->belongsTo(Vehicle::class);
    }

    public function createdBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }
    
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function documents(): HasMany
    {
        return $this->hasMany(ProcedureDocument::class);
    }
}

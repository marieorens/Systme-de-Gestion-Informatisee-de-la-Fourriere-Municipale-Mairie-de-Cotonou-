<?php

namespace App\Models;

use App\Enums\VehicleStatus;
use App\Enums\VehicleType;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Vehicle extends Model
{
    use HasFactory;

    protected $fillable = [
        'license_plate',
        'make',
        'model',
        'color',
        'year',
        'type',
        'status',
        'impound_date',
        'release_date',
        'location',
        'photos',
        'qr_code',
        'owner_id',
        'description',
    ];

    protected function casts(): array
    {
        return [
            'status' => VehicleStatus::class,
            'impound_date' => 'datetime',
            'release_date' => 'date',
            'photos' => 'array',
        ];
    }

    public function owner(): BelongsTo
    {
        return $this->belongsTo(Owner::class);
    }

    public function procedures(): HasMany
    {
        return $this->hasMany(Procedure::class);
    }

    public function payments(): HasMany
    {
        return $this->hasMany(Payment::class);
    }
}

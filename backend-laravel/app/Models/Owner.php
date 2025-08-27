<?php

namespace App\Models;

use App\Enums\IdType;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Owner extends Model
{
    use HasFactory;

    protected $fillable = [
        'first_name',
        'last_name',
        'phone',
        'email',
        'address',
        'id_number',
        'id_type',
    ];

    protected function casts(): array
    {
        return [
            'id_type' => IdType::class,
        ];
    }

    public function vehicles(): HasMany
    {
        return $this->hasMany(Vehicle::class);
    }
    
    public function notifications(): HasMany
    {
        return $this->hasMany(Notification::class);
    }
}

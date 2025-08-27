<?php

namespace Database\Factories;

use App\Enums\VehicleStatus;
use App\Enums\VehicleType;
use App\Models\Owner;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Vehicle>
 */
class VehicleFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $types = [VehicleType::CAR, VehicleType::MOTORCYCLE, VehicleType::TRUCK, VehicleType::OTHER];
        $statuses = [VehicleStatus::IMPOUNDED, VehicleStatus::CLAIMED, VehicleStatus::SOLD, VehicleStatus::DESTROYED, VehicleStatus::PENDING_DESTRUCTION];
        
        return [
            'license_plate' => strtoupper($this->faker->regexify('[A-Z]{2}-[0-9]{3}-[A-Z]{2}')),
            'make' => $this->faker->randomElement(['Toyota', 'Honda', 'Ford', 'Mercedes', 'BMW', 'Peugeot', 'Renault']),
            'model' => $this->faker->word(),
            'color' => $this->faker->colorName(),
            'year' => $this->faker->numberBetween(2000, 2025),
            'type' => $this->faker->randomElement($types),
            'status' => $this->faker->randomElement($statuses),
            'impound_date' => $this->faker->dateTimeBetween('-3 months', 'now'),
            'release_date' => null,
            'location' => 'Zone ' . $this->faker->randomLetter() . '-' . $this->faker->numberBetween(1, 50),
            'photos' => $this->faker->randomElements([
                'vehicles/photo1.jpg',
                'vehicles/photo2.jpg',
                'vehicles/photo3.jpg',
                'vehicles/photo4.jpg',
            ], $this->faker->numberBetween(0, 3)),
            'qr_code' => 'qr_' . $this->faker->uuid(),
            'owner_id' => Owner::factory(),
            'estimated_value' => $this->faker->numberBetween(500000, 15000000),
            'description' => $this->faker->paragraph(),
        ];
    }
    
    /**
     * Vehicle is impounded.
     */
    public function impounded(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => VehicleStatus::IMPOUNDED,
        ]);
    }
    
    /**
     * Vehicle is claimed.
     */
    public function claimed(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => VehicleStatus::CLAIMED,
        ]);
    }
}

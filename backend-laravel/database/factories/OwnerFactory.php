<?php

namespace Database\Factories;

use App\Enums\IdType;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Owner>
 */
class OwnerFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $idTypes = [IdType::CNI, IdType::PASSPORT, IdType::DRIVER_LICENSE];
        
        return [
            'first_name' => $this->faker->firstName(),
            'last_name' => $this->faker->lastName(),
            'phone' => $this->faker->phoneNumber(),
            'email' => $this->faker->optional(0.7)->safeEmail(),
            'address' => $this->faker->address(),
            'id_number' => $this->faker->unique()->regexify('[A-Z0-9]{8,12}'),
            'id_type' => $this->faker->randomElement($idTypes),
        ];
    }
}

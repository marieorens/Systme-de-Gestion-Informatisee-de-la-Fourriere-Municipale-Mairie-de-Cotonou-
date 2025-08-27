<?php

namespace Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Setting>
 */
class SettingFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'key' => $this->faker->unique()->word(),
            'value' => json_encode(['data' => $this->faker->word()]),
            'description' => $this->faker->sentence(),
            'group' => $this->faker->randomElement(['general', 'fees', 'notifications', 'legal']),
            'is_public' => $this->faker->boolean(70),
        ];
    }
    
    /**
     * Setting for daily storage fee.
     */
    public function storageFee(): static
    {
        return $this->state(fn (array $attributes) => [
            'key' => 'daily_storage_fee',
            'value' => json_encode(['amount' => 2000]),
            'description' => 'Frais journaliers de gardiennage (FCFA)',
            'group' => 'fees',
            'is_public' => true,
        ]);
    }
    
    /**
     * Setting for admin fee.
     */
    public function adminFee(): static
    {
        return $this->state(fn (array $attributes) => [
            'key' => 'administrative_fee',
            'value' => json_encode(['amount' => 10000]),
            'description' => 'Frais administratifs fixes (FCFA)',
            'group' => 'fees',
            'is_public' => true,
        ]);
    }
    
    /**
     * Setting for legal deadline.
     */
    public function legalDeadline(): static
    {
        return $this->state(fn (array $attributes) => [
            'key' => 'destruction_deadline_days',
            'value' => json_encode(['days' => 90]),
            'description' => 'Délai légal avant destruction (jours)',
            'group' => 'legal',
            'is_public' => true,
        ]);
    }
}

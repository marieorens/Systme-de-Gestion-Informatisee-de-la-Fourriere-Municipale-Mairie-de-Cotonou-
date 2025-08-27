<?php

namespace Database\Factories;

use App\Enums\ProcedureStatus;
use App\Enums\ProcedureType;
use App\Models\User;
use App\Models\Vehicle;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Procedure>
 */
class ProcedureFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $types = [ProcedureType::RELEASE, ProcedureType::SALE, ProcedureType::DESTRUCTION];
        $statuses = [ProcedureStatus::PENDING, ProcedureStatus::IN_PROGRESS, ProcedureStatus::COMPLETED, ProcedureStatus::CANCELLED];
        
        return [
            'vehicle_id' => Vehicle::factory(),
            'type' => $this->faker->randomElement($types),
            'status' => $this->faker->randomElement($statuses),
            'fees_calculated' => $this->faker->numberBetween(50000, 500000),
            'created_by' => User::factory()->state(['role' => 'agent']),
            'user_id' => null,
        ];
    }
    
    /**
     * Procedure for vehicle release.
     */
    public function release(): static
    {
        return $this->state(fn (array $attributes) => [
            'type' => ProcedureType::RELEASE,
        ]);
    }
    
    /**
     * Procedure in progress.
     */
    public function inProgress(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => ProcedureStatus::IN_PROGRESS,
        ]);
    }
    
    /**
     * Completed procedure.
     */
    public function completed(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => ProcedureStatus::COMPLETED,
        ]);
    }
}

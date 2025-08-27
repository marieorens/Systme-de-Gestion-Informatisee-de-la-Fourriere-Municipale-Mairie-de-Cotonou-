<?php

namespace Database\Factories;

use App\Enums\PaymentMethod;
use App\Models\Owner;
use App\Models\Vehicle;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Payment>
 */
class PaymentFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $methods = [PaymentMethod::CASH, PaymentMethod::BANK_TRANSFER, PaymentMethod::MOBILE_MONEY];
        
        return [
            'vehicle_id' => Vehicle::factory(),
            'owner_id' => Owner::factory(),
            'amount' => $this->faker->numberBetween(50000, 500000),
            'payment_method' => $this->faker->randomElement($methods),
            'payment_date' => $this->faker->dateTimeBetween('-1 month', 'now'),
            'reference' => 'PAY-' . $this->faker->unique()->randomNumber(6),
            'description' => $this->faker->sentence(),
            'receipt_url' => $this->faker->optional(0.7)->url(),
            'user_id' => null,
        ];
    }
    
    /**
     * Cash payment.
     */
    public function cash(): static
    {
        return $this->state(fn (array $attributes) => [
            'payment_method' => PaymentMethod::CASH,
        ]);
    }
    
    /**
     * Mobile money payment.
     */
    public function mobileMoney(): static
    {
        return $this->state(fn (array $attributes) => [
            'payment_method' => PaymentMethod::MOBILE_MONEY,
        ]);
    }
}

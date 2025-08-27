<?php

namespace Database\Factories;

use App\Enums\NotificationChannel;
use App\Enums\NotificationStatus;
use App\Enums\NotificationType;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Notification>
 */
class NotificationFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $types = [NotificationType::IMPOUND_NOTICE, NotificationType::DEADLINE_WARNING, NotificationType::PAYMENT_REMINDER];
        $channels = [NotificationChannel::SMS, NotificationChannel::EMAIL];
        $statuses = [NotificationStatus::PENDING, NotificationStatus::SENT, NotificationStatus::FAILED];
        
        return [
            'recipient' => $this->faker->email(),
            'type' => $this->faker->randomElement($types),
            'channel' => $this->faker->randomElement($channels),
            'message' => $this->faker->paragraph(),
            'sent_at' => $this->faker->optional(0.8)->dateTimeBetween('-1 month', 'now'),
            'status' => $this->faker->randomElement($statuses),
            'owner_id' => null,
            'user_id' => null,
        ];
    }
    
    /**
     * Notification was sent successfully.
     */
    public function sent(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => NotificationStatus::SENT,
            'sent_at' => $this->faker->dateTimeBetween('-1 month', 'now'),
        ]);
    }
    
    /**
     * Notification is pending.
     */
    public function pending(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => NotificationStatus::PENDING,
            'sent_at' => null,
        ]);
    }
}

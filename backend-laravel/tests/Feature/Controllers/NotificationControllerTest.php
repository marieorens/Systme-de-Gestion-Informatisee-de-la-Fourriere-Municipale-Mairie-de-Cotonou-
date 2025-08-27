<?php

namespace Tests\Feature\Controllers;

use App\Models\User;
use App\Models\Notification;
use App\Models\Vehicle;
use App\Models\Owner;
use App\Enums\NotificationType;
use App\Enums\NotificationStatus;
use App\Enums\NotificationChannel;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Foundation\Testing\WithFaker;
use Tests\TestCase;

class NotificationControllerTest extends TestCase
{
    use RefreshDatabase, WithFaker;

    protected $admin;
    protected $agent;
    protected $vehicle;
    protected $owner;

    public function setUp(): void
    {
        parent::setUp();
        
        // Créer un utilisateur administrateur et un agent pour les tests
        $this->admin = User::factory()->create([
            'role' => 'admin'
        ]);
        
        $this->agent = User::factory()->create([
            'role' => 'agent'
        ]);
        
        // Créer un propriétaire et un véhicule pour les tests
        $this->owner = Owner::factory()->create([
            'phone' => '22997123456',
            'email' => 'test@example.com'
        ]);
        
        $this->vehicle = Vehicle::factory()->create([
            'owner_id' => $this->owner->id,
            'impound_date' => now()->subDays(3)->format('Y-m-d')
        ]);
    }

    /** @test */
    public function admin_can_retrieve_all_notifications()
    {
        // Créer des notifications pour les tests
        Notification::factory()->count(5)->create([
            'owner_id' => $this->owner->id,
            'user_id' => $this->admin->id
        ]);
        
        $response = $this->actingAs($this->admin)
                         ->getJson('/api/notifications');
        
        $response->assertStatus(200)
                 ->assertJsonStructure([
                     'data',
                     'links',
                     'meta'
                 ]);
        
        $this->assertEquals(5, count($response->json('data')));
    }

    /** @test */
    public function admin_can_create_a_notification()
    {
        $notificationData = [
            'owner_id' => $this->owner->id,
            'title' => 'Votre véhicule a été mis en fourrière',
            'message' => 'Votre véhicule a été mis en fourrière. Veuillez vous présenter à la fourrière municipale.',
            'type' => NotificationType::VEHICLE_IMPOUNDED->value,
            'channel' => NotificationChannel::SMS->value,
            'status' => NotificationStatus::PENDING->value
        ];
        
        $response = $this->actingAs($this->admin)
                         ->postJson('/api/notifications', $notificationData);
        
        $response->assertStatus(201)
                 ->assertJsonStructure([
                     'data' => [
                         'id',
                         'reference',
                         'owner',
                         'title',
                         'message',
                         'type',
                         'channel',
                         'status',
                         'user',
                         'created_at',
                         'updated_at'
                     ]
                 ]);
        
        $this->assertDatabaseHas('notifications', [
            'owner_id' => $this->owner->id,
            'title' => 'Votre véhicule a été mis en fourrière',
            'type' => NotificationType::VEHICLE_IMPOUNDED->value,
            'channel' => NotificationChannel::SMS->value
        ]);
    }

    /** @test */
    public function admin_can_retrieve_a_specific_notification()
    {
        $notification = Notification::factory()->create([
            'owner_id' => $this->owner->id,
            'user_id' => $this->admin->id
        ]);
        
        $response = $this->actingAs($this->admin)
                         ->getJson("/api/notifications/{$notification->id}");
        
        $response->assertStatus(200)
                 ->assertJson([
                     'data' => [
                         'id' => $notification->id,
                         'reference' => $notification->reference,
                         'title' => $notification->title
                     ]
                 ]);
    }

    /** @test */
    public function admin_can_update_a_notification_status()
    {
        $notification = Notification::factory()->create([
            'owner_id' => $this->owner->id,
            'user_id' => $this->admin->id,
            'status' => NotificationStatus::PENDING->value
        ]);
        
        $updateData = [
            'status' => NotificationStatus::SENT->value
        ];
        
        $response = $this->actingAs($this->admin)
                         ->putJson("/api/notifications/{$notification->id}", $updateData);
        
        $response->assertStatus(200)
                 ->assertJson([
                     'data' => [
                         'id' => $notification->id,
                         'status' => NotificationStatus::SENT->value
                     ]
                 ]);
        
        $this->assertDatabaseHas('notifications', [
            'id' => $notification->id,
            'status' => NotificationStatus::SENT->value
        ]);
    }

    /** @test */
    public function admin_can_retrieve_notifications_for_an_owner()
    {
        // Créer plusieurs notifications pour le propriétaire
        Notification::factory()->count(3)->create([
            'owner_id' => $this->owner->id,
            'user_id' => $this->admin->id
        ]);
        
        $response = $this->actingAs($this->admin)
                         ->getJson("/api/owners/{$this->owner->id}/notifications");
        
        $response->assertStatus(200)
                 ->assertJsonStructure([
                     'data' => [
                         '*' => [
                             'id',
                             'reference',
                             'title',
                             'message',
                             'type',
                             'channel',
                             'status'
                         ]
                     ]
                 ]);
        
        $this->assertEquals(3, count($response->json('data')));
    }
    
    /** @test */
    public function admin_can_create_a_notification_for_an_owner()
    {
        $notificationData = [
            'title' => 'Rappel de frais de stockage',
            'message' => 'Nous vous rappelons que des frais de stockage s\'appliquent quotidiennement.',
            'type' => NotificationType::PAYMENT_REMINDER->value,
            'channel' => NotificationChannel::EMAIL->value,
            'status' => NotificationStatus::PENDING->value
        ];
        
        $response = $this->actingAs($this->admin)
                         ->postJson("/api/owners/{$this->owner->id}/notifications", $notificationData);
        
        $response->assertStatus(201)
                 ->assertJsonStructure([
                     'data' => [
                         'id',
                         'reference',
                         'owner',
                         'title',
                         'message',
                         'type',
                         'channel',
                         'status',
                         'user'
                     ]
                 ]);
        
        $this->assertDatabaseHas('notifications', [
            'owner_id' => $this->owner->id,
            'title' => 'Rappel de frais de stockage',
            'type' => NotificationType::PAYMENT_REMINDER->value,
            'channel' => NotificationChannel::EMAIL->value
        ]);
    }
    
    /** @test */
    public function agent_can_view_but_not_send_notifications()
    {
        // L'agent peut consulter les notifications
        $notification = Notification::factory()->create([
            'owner_id' => $this->owner->id,
            'user_id' => $this->admin->id
        ]);
        
        $response = $this->actingAs($this->agent)
                         ->getJson("/api/notifications/{$notification->id}");
        
        $response->assertStatus(200);
        
        // Mais ne peut pas créer une notification
        $notificationData = [
            'owner_id' => $this->owner->id,
            'title' => 'Notification non autorisée',
            'message' => 'Cette notification ne devrait pas être créée',
            'type' => NotificationType::VEHICLE_IMPOUNDED->value,
            'channel' => NotificationChannel::SMS->value,
            'status' => NotificationStatus::PENDING->value
        ];
        
        $response = $this->actingAs($this->agent)
                         ->postJson('/api/notifications', $notificationData);
        
        $response->assertStatus(403); // Forbidden
    }
}

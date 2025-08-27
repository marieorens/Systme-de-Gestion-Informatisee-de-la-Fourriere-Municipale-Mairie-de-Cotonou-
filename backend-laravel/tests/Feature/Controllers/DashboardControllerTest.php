<?php

namespace Tests\Feature\Controllers;

use App\Models\User;
use App\Models\Vehicle;
use App\Models\Owner;
use App\Models\Payment;
use App\Models\Procedure;
use App\Models\Notification;
use App\Enums\VehicleStatus;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Foundation\Testing\WithFaker;
use Tests\TestCase;

class DashboardControllerTest extends TestCase
{
    use RefreshDatabase, WithFaker;

    protected $admin;

    public function setUp(): void
    {
        parent::setUp();
        
        // Créer un utilisateur administrateur pour les tests
        $this->admin = User::factory()->create([
            'role' => 'admin'
        ]);
        
        // Créer des données pour le tableau de bord
        $owners = Owner::factory()->count(3)->create();
        
        // Créer différents véhicules avec différents statuts
        $vehicles = [];
        foreach ($owners as $owner) {
            $vehicles[] = Vehicle::factory()->create([
                'owner_id' => $owner->id,
                'status' => VehicleStatus::IMPOUNDED,
                'impound_date' => now()->subDays(3)->format('Y-m-d')
            ]);
            
            $vehicles[] = Vehicle::factory()->create([
                'owner_id' => $owner->id,
                'status' => VehicleStatus::CLAIMED,
                'impound_date' => now()->subDays(10)->format('Y-m-d'),
                'release_date' => now()->subDays(5)->format('Y-m-d')
            ]);
        }
        
        // Créer des paiements
        foreach ($vehicles as $vehicle) {
            Payment::factory()->count(2)->create([
                'vehicle_id' => $vehicle->id,
                'user_id' => $this->admin->id,
                'amount' => $this->faker->numberBetween(5000, 50000)
            ]);
        }
        
        // Créer des procédures
        foreach ($vehicles as $vehicle) {
            Procedure::factory()->create([
                'vehicle_id' => $vehicle->id,
                'user_id' => $this->admin->id
            ]);
        }
        
        // Créer des notifications
        foreach ($owners as $owner) {
            Notification::factory()->count(2)->create([
                'owner_id' => $owner->id,
                'user_id' => $this->admin->id
            ]);
        }
    }

    /** @test */
    public function admin_can_get_dashboard_stats()
    {
        $response = $this->actingAs($this->admin)
                         ->getJson('/api/dashboard/stats');
        
        $response->assertStatus(200)
                 ->assertJsonStructure([
                     'data' => [
                         'total_vehicles',
                         'impounded_vehicles',
                         'claimed_vehicles',
                         'total_owners',
                         'total_payments',
                         'total_revenue',
                         'pending_procedures',
                         'pending_notifications'
                     ]
                 ]);
        
        // Vérifier les valeurs des statistiques
        $responseData = $response->json('data');
        $this->assertEquals(6, $responseData['total_vehicles']);
        $this->assertEquals(3, $responseData['impounded_vehicles']);
        $this->assertEquals(3, $responseData['claimed_vehicles']);
        $this->assertEquals(3, $responseData['total_owners']);
        $this->assertEquals(12, $responseData['total_payments']);
        $this->assertGreaterThan(0, $responseData['total_revenue']);
    }

    /** @test */
    public function admin_can_get_recent_activities()
    {
        $response = $this->actingAs($this->admin)
                         ->getJson('/api/dashboard/recent-activities');
        
        $response->assertStatus(200)
                 ->assertJsonStructure([
                     'data' => [
                         'recent_vehicles' => [
                             '*' => [
                                 'id',
                                 'license_plate',
                                 'status',
                                 'impound_date'
                             ]
                         ],
                         'recent_payments' => [
                             '*' => [
                                 'id',
                                 'reference',
                                 'amount',
                                 'payment_type',
                                 'status'
                             ]
                         ],
                         'recent_procedures' => [
                             '*' => [
                                 'id',
                                 'reference',
                                 'type',
                                 'status'
                             ]
                         ]
                     ]
                 ]);
    }

    /** @test */
    public function admin_can_get_revenue_stats()
    {
        $response = $this->actingAs($this->admin)
                         ->getJson('/api/dashboard/revenue-stats');
        
        $response->assertStatus(200)
                 ->assertJsonStructure([
                     'data' => [
                         'daily' => [
                             '*' => [
                                 'date',
                                 'amount'
                             ]
                         ],
                         'monthly' => [
                             '*' => [
                                 'month',
                                 'amount'
                             ]
                         ],
                         'payment_types' => [
                             '*' => [
                                 'type',
                                 'amount'
                             ]
                         ]
                     ]
                 ]);
    }

    /** @test */
    public function regular_user_cannot_access_dashboard()
    {
        $user = User::factory()->create([
            'role' => 'user'
        ]);
        
        $response = $this->actingAs($user)
                         ->getJson('/api/dashboard/stats');
        
        $response->assertStatus(403);
    }
}

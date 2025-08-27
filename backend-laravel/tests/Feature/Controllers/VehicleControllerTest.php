<?php

namespace Tests\Feature\Controllers;

use App\Models\User;
use App\Models\Vehicle;
use App\Models\Owner;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Foundation\Testing\WithFaker;
use Tests\TestCase;

class VehicleControllerTest extends TestCase
{
    use RefreshDatabase, WithFaker;

    protected $user;

    public function setUp(): void
    {
        parent::setUp();
        
        // Créer un utilisateur administrateur pour les tests
        $this->user = User::factory()->create([
            'role' => 'admin'
        ]);
    }

    /** @test */
    public function admin_can_retrieve_all_vehicles()
    {
        // Créer quelques véhicules pour les tests
        Vehicle::factory()->count(5)->create();
        
        $response = $this->actingAs($this->user)
                         ->getJson('/api/vehicles');
        
        $response->assertStatus(200)
                 ->assertJsonStructure([
                     'data',
                     'links',
                     'meta'
                 ]);
        
        $this->assertEquals(5, count($response->json('data')));
    }

    /** @test */
    public function admin_can_create_a_vehicle()
    {
        // Créer un propriétaire pour le véhicule
        $owner = Owner::factory()->create();
        
        $vehicleData = [
            'license_plate' => 'AB-123-CD',
            'make' => 'Toyota',
            'model' => 'Corolla',
            'color' => 'Red',
            'year' => 2020,
            'type' => 'car',
            'status' => 'impounded',
            'impound_date' => now()->format('Y-m-d'),
            'location' => 'Row 3, Spot 12',
            'owner_id' => $owner->id,
            'estimated_value' => 15000,
            'description' => 'Vehicle has a dent on the right door.',
        ];
        
        $response = $this->actingAs($this->user)
                         ->postJson('/api/vehicles', $vehicleData);
        
        $response->assertStatus(201)
                 ->assertJsonStructure([
                     'data' => [
                         'id',
                         'license_plate',
                         'make',
                         'model',
                         'color',
                         'year',
                         'type',
                         'status',
                         'impound_date',
                         'location',
                         'estimated_value',
                         'description',
                         'created_at',
                         'updated_at'
                     ]
                 ]);
        
        $this->assertDatabaseHas('vehicles', [
            'license_plate' => 'AB-123-CD',
            'make' => 'Toyota',
            'model' => 'Corolla'
        ]);
    }

    /** @test */
    public function admin_can_retrieve_a_specific_vehicle()
    {
        $vehicle = Vehicle::factory()->create();
        
        $response = $this->actingAs($this->user)
                         ->getJson("/api/vehicles/{$vehicle->id}");
        
        $response->assertStatus(200)
                 ->assertJson([
                     'data' => [
                         'id' => $vehicle->id,
                         'license_plate' => $vehicle->license_plate
                     ]
                 ]);
    }

    /** @test */
    public function admin_can_update_a_vehicle()
    {
        $vehicle = Vehicle::factory()->create();
        
        $updatedData = [
            'color' => 'Blue',
            'location' => 'Row 4, Spot 15',
            'description' => 'Updated description'
        ];
        
        $response = $this->actingAs($this->user)
                         ->putJson("/api/vehicles/{$vehicle->id}", $updatedData);
        
        $response->assertStatus(200)
                 ->assertJson([
                     'data' => [
                         'id' => $vehicle->id,
                         'color' => 'Blue',
                         'location' => 'Row 4, Spot 15',
                         'description' => 'Updated description'
                     ]
                 ]);
        
        $this->assertDatabaseHas('vehicles', [
            'id' => $vehicle->id,
            'color' => 'Blue',
            'location' => 'Row 4, Spot 15'
        ]);
    }

    /** @test */
    public function admin_can_delete_a_vehicle()
    {
        $vehicle = Vehicle::factory()->create();
        
        $response = $this->actingAs($this->user)
                         ->deleteJson("/api/vehicles/{$vehicle->id}");
        
        $response->assertStatus(204);
        
        $this->assertDatabaseMissing('vehicles', [
            'id' => $vehicle->id
        ]);
    }

    /** @test */
    public function admin_can_calculate_storage_fee_for_a_vehicle()
    {
        $vehicle = Vehicle::factory()->create([
            'impound_date' => now()->subDays(5)->format('Y-m-d')
        ]);
        
        $response = $this->actingAs($this->user)
                         ->getJson("/api/vehicles/{$vehicle->id}/storage-fee");
        
        $response->assertStatus(200)
                 ->assertJsonStructure([
                     'data' => [
                         'days_impounded',
                         'daily_rate',
                         'storage_fee',
                         'admin_fee',
                         'total_due',
                         'amount_paid',
                         'balance'
                     ]
                 ]);
        
        // Vérifier que le nombre de jours est approximativement correct (environ 5 jours)
        $this->assertGreaterThanOrEqual(5, $response->json('data.days_impounded'));
        $this->assertLessThanOrEqual(6, $response->json('data.days_impounded'));
    }
}

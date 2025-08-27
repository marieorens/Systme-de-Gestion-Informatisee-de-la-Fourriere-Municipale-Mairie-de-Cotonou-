<?php

namespace Tests\Feature\Controllers;

use App\Models\User;
use App\Models\Owner;
use App\Models\Vehicle;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Foundation\Testing\WithFaker;
use Tests\TestCase;

class OwnerControllerTest extends TestCase
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
    public function admin_can_retrieve_all_owners()
    {
        
        Owner::factory()->count(5)->create();
        
        $response = $this->actingAs($this->user)
                         ->getJson('/api/owners');
        
        $response->assertStatus(200)
                 ->assertJsonStructure([
                     'data',
                     'links',
                     'meta'
                 ]);
        
        $this->assertEquals(5, count($response->json('data')));
    }

    /** @test */
    public function admin_can_create_an_owner()
    {
        $ownerData = [
            'name' => 'John Doe',
            'id_type' => 'passport',
            'id_number' => 'AB123456',
            'phone' => '+22912345678',
            'email' => 'john.doe@example.com',
            'address' => '123 Main Street, Cotonou'
        ];
        
        $response = $this->actingAs($this->user)
                         ->postJson('/api/owners', $ownerData);
        
        $response->assertStatus(201)
                 ->assertJsonStructure([
                     'data' => [
                         'id',
                         'name',
                         'id_type',
                         'id_number',
                         'phone',
                         'email',
                         'address',
                         'created_at',
                         'updated_at'
                     ]
                 ]);
        
        $this->assertDatabaseHas('owners', [
            'name' => 'John Doe',
            'id_number' => 'AB123456',
            'email' => 'john.doe@example.com'
        ]);
    }

    /** @test */
    public function admin_can_retrieve_a_specific_owner()
    {
        $owner = Owner::factory()->create();
        
        $response = $this->actingAs($this->user)
                         ->getJson("/api/owners/{$owner->id}");
        
        $response->assertStatus(200)
                 ->assertJson([
                     'data' => [
                         'id' => $owner->id,
                         'name' => $owner->name,
                         'id_number' => $owner->id_number
                     ]
                 ]);
    }

    /** @test */
    public function admin_can_update_an_owner()
    {
        $owner = Owner::factory()->create();
        
        $updatedData = [
            'name' => 'Jane Smith',
            'phone' => '+22998765432',
            'address' => '456 Market Street, Cotonou'
        ];
        
        $response = $this->actingAs($this->user)
                         ->putJson("/api/owners/{$owner->id}", $updatedData);
        
        $response->assertStatus(200)
                 ->assertJson([
                     'data' => [
                         'id' => $owner->id,
                         'name' => 'Jane Smith',
                         'phone' => '+22998765432',
                         'address' => '456 Market Street, Cotonou'
                     ]
                 ]);
        
        $this->assertDatabaseHas('owners', [
            'id' => $owner->id,
            'name' => 'Jane Smith',
            'phone' => '+22998765432'
        ]);
    }

    /** @test */
    public function admin_can_delete_an_owner_without_vehicles()
    {
        $owner = Owner::factory()->create();
        
        $response = $this->actingAs($this->user)
                         ->deleteJson("/api/owners/{$owner->id}");
        
        $response->assertStatus(204);
        
        $this->assertDatabaseMissing('owners', [
            'id' => $owner->id
        ]);
    }
    
    /** @test */
    public function admin_cannot_delete_an_owner_with_vehicles()
    {
        $owner = Owner::factory()->create();
        
        // Créer un véhicule associé à ce propriétaire
        Vehicle::factory()->create([
            'owner_id' => $owner->id
        ]);
        
        $response = $this->actingAs($this->user)
                         ->deleteJson("/api/owners/{$owner->id}");
        
        $response->assertStatus(422);
        
        // Vérifier que le propriétaire existe toujours dans la base de données
        $this->assertDatabaseHas('owners', [
            'id' => $owner->id
        ]);
    }
    
    /** @test */
    public function admin_can_retrieve_vehicles_for_an_owner()
    {
        $owner = Owner::factory()->create();
        
        // Créer plusieurs véhicules pour ce propriétaire
        Vehicle::factory()->count(3)->create([
            'owner_id' => $owner->id
        ]);
        
        $response = $this->actingAs($this->user)
                         ->getJson("/api/owners/{$owner->id}/vehicles");
        
        $response->assertStatus(200)
                 ->assertJsonStructure([
                     'data' => [
                         '*' => [
                             'id',
                             'license_plate',
                             'make',
                             'model'
                         ]
                     ]
                 ]);
        
        $this->assertEquals(3, count($response->json('data')));
    }
}

<?php

namespace Tests\Feature\Controllers;

use App\Models\User;
use App\Models\Procedure;
use App\Models\Vehicle;
use App\Models\Owner;
use App\Enums\ProcedureStatus;
use App\Enums\ProcedureType;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Foundation\Testing\WithFaker;
use Tests\TestCase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;

class ProcedureControllerTest extends TestCase
{
    use RefreshDatabase, WithFaker;

    protected $admin;
    protected $agent;
    protected $vehicle;
    protected $owner;

    public function setUp(): void
    {
        parent::setUp();
        
        // Configurer le disque de stockage pour les tests
        Storage::fake('public');
        
        // Créer un utilisateur administrateur et un agent pour les tests
        $this->admin = User::factory()->create([
            'role' => 'admin'
        ]);
        
        $this->agent = User::factory()->create([
            'role' => 'agent'
        ]);
        
        // Créer un propriétaire et un véhicule pour les tests
        $this->owner = Owner::factory()->create();
        $this->vehicle = Vehicle::factory()->create([
            'owner_id' => $this->owner->id,
            'impound_date' => now()->subDays(3)->format('Y-m-d')
        ]);
    }

    /** @test */
    public function admin_can_retrieve_all_procedures()
    {
        // Créer des procédures pour les tests
        Procedure::factory()->count(5)->create([
            'vehicle_id' => $this->vehicle->id,
            'user_id' => $this->admin->id
        ]);
        
        $response = $this->actingAs($this->admin)
                         ->getJson('/api/procedures');
        
        $response->assertStatus(200)
                 ->assertJsonStructure([
                     'data',
                     'links',
                     'meta'
                 ]);
        
        $this->assertEquals(5, count($response->json('data')));
    }

    /** @test */
    public function admin_can_create_a_procedure()
    {
        $document = UploadedFile::fake()->create('document.pdf', 100);
        
        $procedureData = [
            'vehicle_id' => $this->vehicle->id,
            'type' => ProcedureType::RELEASE->value,
            'status' => ProcedureStatus::PENDING->value,
            'notes' => 'Procédure de libération de véhicule',
            'document' => $document
        ];
        
        $response = $this->actingAs($this->admin)
                         ->postJson('/api/procedures', $procedureData);
        
        $response->assertStatus(201)
                 ->assertJsonStructure([
                     'data' => [
                         'id',
                         'reference',
                         'vehicle',
                         'type',
                         'status',
                         'notes',
                         'document_path',
                         'user',
                         'created_at',
                         'updated_at'
                     ]
                 ]);
        
        $this->assertDatabaseHas('procedures', [
            'vehicle_id' => $this->vehicle->id,
            'type' => ProcedureType::RELEASE->value,
            'status' => ProcedureStatus::PENDING->value,
        ]);
        
        // Vérifier que le document a été stocké
        $procedure = Procedure::latest()->first();
        Storage::disk('public')->assertExists($procedure->document_path);
    }

    /** @test */
    public function admin_can_retrieve_a_specific_procedure()
    {
        $procedure = Procedure::factory()->create([
            'vehicle_id' => $this->vehicle->id,
            'user_id' => $this->admin->id
        ]);
        
        $response = $this->actingAs($this->admin)
                         ->getJson("/api/procedures/{$procedure->id}");
        
        $response->assertStatus(200)
                 ->assertJson([
                     'data' => [
                         'id' => $procedure->id,
                         'reference' => $procedure->reference,
                         'type' => $procedure->type
                     ]
                 ]);
    }

    /** @test */
    public function admin_can_update_a_procedure()
    {
        $procedure = Procedure::factory()->create([
            'vehicle_id' => $this->vehicle->id,
            'user_id' => $this->admin->id,
            'status' => ProcedureStatus::PENDING->value
        ]);
        
        $updateData = [
            'status' => ProcedureStatus::COMPLETED->value,
            'notes' => 'Procédure complétée après vérification'
        ];
        
        $response = $this->actingAs($this->admin)
                         ->putJson("/api/procedures/{$procedure->id}", $updateData);
        
        $response->assertStatus(200)
                 ->assertJson([
                     'data' => [
                         'id' => $procedure->id,
                         'status' => ProcedureStatus::COMPLETED->value,
                         'notes' => 'Procédure complétée après vérification'
                     ]
                 ]);
        
        $this->assertDatabaseHas('procedures', [
            'id' => $procedure->id,
            'status' => ProcedureStatus::COMPLETED->value,
            'notes' => 'Procédure complétée après vérification'
        ]);
    }

    /** @test */
    public function agent_can_only_view_procedures()
    {
        $procedure = Procedure::factory()->create([
            'vehicle_id' => $this->vehicle->id,
            'user_id' => $this->admin->id
        ]);
        
        // L'agent peut consulter la procédure
        $response = $this->actingAs($this->agent)
                         ->getJson("/api/procedures/{$procedure->id}");
        
        $response->assertStatus(200);
        
        // Mais ne peut pas la modifier
        $updateData = [
            'status' => ProcedureStatus::COMPLETED->value
        ];
        
        $response = $this->actingAs($this->agent)
                         ->putJson("/api/procedures/{$procedure->id}", $updateData);
        
        $response->assertStatus(403); // Forbidden
    }

    /** @test */
    public function admin_can_retrieve_procedures_for_a_vehicle()
    {
        // Créer plusieurs procédures pour le véhicule
        Procedure::factory()->count(3)->create([
            'vehicle_id' => $this->vehicle->id,
            'user_id' => $this->admin->id
        ]);
        
        $response = $this->actingAs($this->admin)
                         ->getJson("/api/vehicles/{$this->vehicle->id}/procedures");
        
        $response->assertStatus(200)
                 ->assertJsonStructure([
                     'data' => [
                         '*' => [
                             'id',
                             'reference',
                             'type',
                             'status',
                             'notes',
                             'document_path'
                         ]
                     ]
                 ]);
        
        $this->assertEquals(3, count($response->json('data')));
    }
    
    /** @test */
    public function admin_can_create_a_procedure_for_a_vehicle()
    {
        $document = UploadedFile::fake()->create('release.pdf', 100);
        
        $procedureData = [
            'type' => ProcedureType::SALE->value,
            'status' => ProcedureStatus::PENDING->value,
            'notes' => 'Procédure de vente de véhicule',
            'document' => $document
        ];
        
        $response = $this->actingAs($this->admin)
                         ->postJson("/api/vehicles/{$this->vehicle->id}/procedures", $procedureData);
        
        $response->assertStatus(201)
                 ->assertJsonStructure([
                     'data' => [
                         'id',
                         'reference',
                         'vehicle',
                         'type',
                         'status',
                         'notes',
                         'document_path',
                         'user'
                     ]
                 ]);
        
        $this->assertDatabaseHas('procedures', [
            'vehicle_id' => $this->vehicle->id,
            'type' => ProcedureType::SALE->value,
            'status' => ProcedureStatus::PENDING->value,
        ]);
    }
}

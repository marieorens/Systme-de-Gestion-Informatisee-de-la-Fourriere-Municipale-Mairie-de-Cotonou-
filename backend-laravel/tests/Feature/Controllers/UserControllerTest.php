<?php

namespace Tests\Feature\Controllers;

use App\Models\User;
use App\Enums\UserRole;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Foundation\Testing\WithFaker;
use Tests\TestCase;
use Illuminate\Support\Facades\Hash;

class UserControllerTest extends TestCase
{
    use RefreshDatabase, WithFaker;

    protected $admin;
    protected $agent;

    public function setUp(): void
    {
        parent::setUp();
        
        
        $this->admin = User::factory()->create([
            'name' => 'Admin User',
            'email' => 'admin@example.com',
            'role' => UserRole::ADMIN
        ]);
        
        $this->agent = User::factory()->create([
            'name' => 'Agent User',
            'email' => 'agent@example.com',
            'role' => UserRole::AGENT
        ]);
    }

    /** @test */
    public function admin_can_retrieve_all_users()
    {
       
        User::factory()->count(3)->create();
        
        $response = $this->actingAs($this->admin)
                         ->getJson('/api/admin/users');
        
        $response->assertStatus(200)
                 ->assertJsonStructure([
                     'data',
                     'links',
                     'meta'
                 ]);
        
       
        $this->assertEquals(5, count($response->json('data')));
    }

    /** @test */
    public function admin_can_create_a_user()
    {
        $userData = [
            'name' => 'New User',
            'email' => 'newuser@example.com',
            'password' => 'password123',
            'password_confirmation' => 'password123',
            'role' => UserRole::AGENT->value,
            'phone' => '22998123456'
        ];
        
        $response = $this->actingAs($this->admin)
                         ->postJson('/api/admin/users', $userData);
        
        $response->assertStatus(201)
                 ->assertJsonStructure([
                     'data' => [
                         'id',
                         'name',
                         'email',
                         'role',
                         'phone',
                         'created_at'
                     ]
                 ]);
        
        $this->assertDatabaseHas('users', [
            'name' => 'New User',
            'email' => 'newuser@example.com',
            'role' => UserRole::AGENT->value,
            'phone' => '22998123456'
        ]);
    }

    /** @test */
    public function admin_can_retrieve_a_specific_user()
    {
        $response = $this->actingAs($this->admin)
                         ->getJson("/api/admin/users/{$this->agent->id}");
        
        $response->assertStatus(200)
                 ->assertJson([
                     'data' => [
                         'id' => $this->agent->id,
                         'name' => $this->agent->name,
                         'email' => $this->agent->email,
                         'role' => $this->agent->role
                     ]
                 ]);
    }

    /** @test */
    public function admin_can_update_a_user()
    {
        $updateData = [
            'name' => 'Updated Agent Name',
            'phone' => '22998654321',
            'role' => 'agent'
        ];
        
        $response = $this->actingAs($this->admin)
                         ->putJson("/api/admin/users/{$this->agent->id}", $updateData);
        
        $response->assertStatus(200)
                 ->assertJson([
                     'data' => [
                         'id' => $this->agent->id,
                         'name' => 'Updated Agent Name',
                         'phone' => '22998654321',
                         'role' => 'agent'
                     ]
                 ]);
        
        $this->assertDatabaseHas('users', [
            'id' => $this->agent->id,
            'name' => 'Updated Agent Name',
            'phone' => '22998654321'
        ]);
    }

    /** @test */
    public function admin_can_delete_a_user()
    {
        $user = User::factory()->create();
        
        $response = $this->actingAs($this->admin)
                         ->deleteJson("/api/admin/users/{$user->id}");
        
        $response->assertStatus(204);
        
        $this->assertDatabaseMissing('users', [
            'id' => $user->id
        ]);
    }

    /** @test */
    public function admin_cannot_delete_themselves()
    {
        $response = $this->actingAs($this->admin)
                         ->deleteJson("/api/admin/users/{$this->admin->id}");
        
        $response->assertStatus(403);
        
        $this->assertDatabaseHas('users', [
            'id' => $this->admin->id
        ]);
    }

    /** @test */
    public function agent_cannot_manage_users()
    {
        // L'agent ne peut pas créer un utilisateur
        $userData = [
            'name' => 'Unauthorized User',
            'email' => 'unauthorized@example.com',
            'password' => 'password123',
            'password_confirmation' => 'password123',
            'role' => 'agent'
        ];
        
        $response = $this->actingAs($this->agent)
                         ->postJson('/api/admin/users', $userData);
        
        $response->assertStatus(403);
        
        // L'agent ne peut pas modifier un utilisateur
        $updateData = [
            'name' => 'Unauthorized Update'
        ];
        
        $response = $this->actingAs($this->agent)
                         ->putJson("/api/admin/users/{$this->admin->id}", $updateData);
        
        $response->assertStatus(403);
        
        // L'agent ne peut pas supprimer un utilisateur
        $response = $this->actingAs($this->agent)
                         ->deleteJson("/api/admin/users/{$this->admin->id}");
        
        $response->assertStatus(403);
    }

    /** @test */
    public function admin_can_search_users_by_name_or_email()
    {
        // Créer des utilisateurs avec des noms spécifiques pour le test de recherche
        User::factory()->create(['name' => 'Jean Dupont', 'email' => 'jean@example.com']);
        User::factory()->create(['name' => 'Marie Smith', 'email' => 'marie@example.com']);
        User::factory()->create(['name' => 'Jean Martin', 'email' => 'martin@example.com']);
        
        // Rechercher par nom
        $response = $this->actingAs($this->admin)
                         ->getJson('/api/admin/users?search=Jean');
        
        $response->assertStatus(200);
        $this->assertEquals(2, count($response->json('data')));
        
        // Rechercher par email
        $response = $this->actingAs($this->admin)
                         ->getJson('/api/admin/users?search=marie@example');
        
        $response->assertStatus(200);
        $this->assertEquals(1, count($response->json('data')));
    }

    /** @test */
    public function user_can_change_their_own_password()
    {
        $passwordData = [
            'current_password' => 'password', // mot de passe par défaut des factory users
            'password' => 'newpassword123',
            'password_confirmation' => 'newpassword123'
        ];
        
        $response = $this->actingAs($this->agent)
                         ->postJson('/api/admin/users/change-password', $passwordData);
        
        $response->assertStatus(200)
                 ->assertJson([
                     'message' => 'Password changed successfully'
                 ]);
        
        // Vérifier que le mot de passe a été mis à jour en se reconnectant
        $this->assertTrue(
            auth()->attempt([
                'email' => $this->agent->email,
                'password' => 'newpassword123'
            ])
        );
    }

    /** @test */
    public function admin_can_reset_user_password()
    {
        $resetData = [
            'password' => 'resetpassword123',
            'password_confirmation' => 'resetpassword123'
        ];
        
        $response = $this->actingAs($this->admin)
                         ->postJson("/api/admin/users/{$this->agent->id}/reset-password", $resetData);
        
        $response->assertStatus(200)
                 ->assertJson([
                     'message' => 'Password reset successfully'
                 ]);
        
        // Vérifier que le mot de passe a été réinitialisé
        $this->assertTrue(
            auth()->attempt([
                'email' => $this->agent->email,
                'password' => 'resetpassword123'
            ])
        );
    }
}

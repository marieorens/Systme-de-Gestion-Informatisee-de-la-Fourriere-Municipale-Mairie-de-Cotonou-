<?php

namespace Tests\Feature\Controllers;

use App\Models\User;
use App\Models\Payment;
use App\Models\Vehicle;
use App\Models\Owner;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Foundation\Testing\WithFaker;
use Tests\TestCase;

class PaymentControllerTest extends TestCase
{
    use RefreshDatabase, WithFaker;

    protected $user;
    protected $vehicle;

    public function setUp(): void
    {
        parent::setUp();
        
       
        $this->user = User::factory()->create([
            'role' => 'admin'
        ]);
        
        
        $owner = Owner::factory()->create();
        $this->vehicle = Vehicle::factory()->create([
            'owner_id' => $owner->id,
            'impound_date' => now()->subDays(5)->format('Y-m-d')
        ]);
    }

    /** @test */
    public function admin_can_retrieve_all_payments()
    {
       
        Payment::factory()->count(5)->create([
            'vehicle_id' => $this->vehicle->id,
            'user_id' => $this->user->id
        ]);
        
        $response = $this->actingAs($this->user)
                         ->getJson('/api/payments');
        
        $response->assertStatus(200)
                 ->assertJsonStructure([
                     'data',
                     'links',
                     'meta'
                 ]);
        
        $this->assertEquals(5, count($response->json('data')));
    }

    /** @test */
    public function admin_can_create_a_payment()
    {
        $paymentData = [
            'vehicle_id' => $this->vehicle->id,
            'amount' => 20000,
            'payment_type' => 'storage_fee',
            'payment_method' => 'cash',
            'status' => 'completed',
            'notes' => 'Payment for 5 days of storage'
        ];
        
        $response = $this->actingAs($this->user)
                         ->postJson('/api/payments', $paymentData);
        
        $response->assertStatus(201)
                 ->assertJsonStructure([
                     'data' => [
                         'id',
                         'reference',
                         'vehicle',
                         'amount',
                         'payment_type',
                         'payment_method',
                         'status',
                         'notes',
                         'user',
                         'created_at',
                         'updated_at'
                     ]
                 ]);
        
        $this->assertDatabaseHas('payments', [
            'vehicle_id' => $this->vehicle->id,
            'amount' => 20000,
            'payment_type' => 'storage_fee',
            'status' => 'completed'
        ]);
    }

    /** @test */
    public function admin_can_retrieve_a_specific_payment()
    {
        $payment = Payment::factory()->create([
            'vehicle_id' => $this->vehicle->id,
            'user_id' => $this->user->id
        ]);
        
        $response = $this->actingAs($this->user)
                         ->getJson("/api/payments/{$payment->id}");
        
        $response->assertStatus(200)
                 ->assertJson([
                     'data' => [
                         'id' => $payment->id,
                         'reference' => $payment->reference,
                         'amount' => $payment->amount
                     ]
                 ]);
    }

    /** @test */
    public function admin_can_retrieve_receipt_for_a_payment()
    {
        $payment = Payment::factory()->create([
            'vehicle_id' => $this->vehicle->id,
            'user_id' => $this->user->id,
            'status' => 'completed'
        ]);
        
        $response = $this->actingAs($this->user)
                         ->getJson("/api/payments/{$payment->id}/receipt");
        
        $response->assertStatus(200)
                 ->assertJsonStructure([
                     'data' => [
                         'payment',
                         'receipt_details' => [
                             'receipt_number',
                             'date',
                             'system_name',
                             'address',
                             'contact_phone'
                         ]
                     ]
                 ]);
    }
    
    /** @test */
    public function admin_can_retrieve_payments_for_a_vehicle()
    {
       
        Payment::factory()->count(3)->create([
            'vehicle_id' => $this->vehicle->id,
            'user_id' => $this->user->id
        ]);
        
        $response = $this->actingAs($this->user)
                         ->getJson("/api/vehicles/{$this->vehicle->id}/payments");
        
        $response->assertStatus(200)
                 ->assertJsonStructure([
                     'data' => [
                         '*' => [
                             'id',
                             'reference',
                             'amount',
                             'payment_type',
                             'payment_method',
                             'status'
                         ]
                     ]
                 ]);
        
        $this->assertEquals(3, count($response->json('data')));
    }
    
    /** @test */
    public function admin_can_create_a_payment_for_a_vehicle()
    {
        $paymentData = [
            'amount' => 10000,
            'payment_type' => 'admin_fee',
            'payment_method' => 'mobile_money',
            'status' => 'completed',
            'notes' => 'Payment for administrative fees'
        ];
        
        $response = $this->actingAs($this->user)
                         ->postJson("/api/vehicles/{$this->vehicle->id}/payments", $paymentData);
        
        $response->assertStatus(201)
                 ->assertJsonStructure([
                     'data' => [
                         'id',
                         'reference',
                         'vehicle',
                         'amount',
                         'payment_type',
                         'payment_method',
                         'status',
                         'notes',
                         'user'
                     ]
                 ]);
        
        $this->assertDatabaseHas('payments', [
            'vehicle_id' => $this->vehicle->id,
            'amount' => 10000,
            'payment_type' => 'admin_fee',
            'payment_method' => 'mobile_money',
            'status' => 'completed'
        ]);
    }
}

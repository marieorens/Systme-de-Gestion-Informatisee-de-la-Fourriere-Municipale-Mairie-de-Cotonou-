<?php

namespace Database\Seeders;

use App\Enums\UserRole;
use App\Models\Notification;
use App\Models\Owner;
use App\Models\Payment;
use App\Models\Procedure;
use App\Models\ProcedureDocument;
use App\Models\Setting;
use App\Models\User;
use App\Models\Vehicle;
use Illuminate\Database\Seeder;

class DemoDataSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Create admin user
        $admin = User::create([
            'name' => 'Administrateur',
            'email' => 'admin@test.com',
            'password' => bcrypt('Admin123!'),
            'role' => UserRole::ADMIN,
        ]);
        
        // Create agent user
        $agent = User::create([
            'name' => 'Agent de Saisie',
            'email' => 'agent@test.com',
            'password' => bcrypt('Agent123!'),
            'role' => UserRole::AGENT,
        ]);
        
        // Create finance user
        $finance = User::create([
            'name' => 'Responsable Financier',
            'email' => 'finance@test.com',
            'password' => bcrypt('Finance123!'),
            'role' => UserRole::FINANCE,
        ]);
        
        // Create 10 owners
        $owners = Owner::factory()->count(30)->create();
        
        // Create 20 vehicles with owners
        $vehicles = collect();
        foreach($owners as $owner) {
            $count = rand(1, 3); // 1 to 3 vehicles per owner
            $newVehicles = Vehicle::factory()->count($count)->create([
                'owner_id' => $owner->id,
            ]);
            $vehicles = $vehicles->merge($newVehicles);
        }
        
        // Create procedures for vehicles
        foreach($vehicles as $vehicle) {
            if(rand(0, 1)) { // 50% chance
                $procedure = Procedure::factory()->create([
                    'vehicle_id' => $vehicle->id,
                    'created_by' => $agent->id,
                ]);
                
                // Create 1-3 documents for each procedure
                ProcedureDocument::factory()->count(rand(1, 3))->create([
                    'procedure_id' => $procedure->id,
                ]);
                
                // Create payment for completed procedures
                if($procedure->status === 'completed') {
                    Payment::factory()->create([
                        'vehicle_id' => $vehicle->id,
                        'owner_id' => $vehicle->owner_id,
                    ]);
                }
            }
        }
        
        // Create settings
        Setting::factory()->storageFee()->create();
        Setting::factory()->adminFee()->create();
        Setting::factory()->legalDeadline()->create();
        
        // Create a few additional settings
        Setting::factory()->count(3)->create();
        
        // Create notifications for owners
        foreach($owners as $owner) {
            if ($owner->email) {
                $count = rand(1, 4); // 1 to 4 notifications per owner
                Notification::factory()->count($count)->create([
                    'owner_id' => $owner->id,
                    'recipient' => $owner->email ?: 'contact@example.com', // Utiliser une valeur par défaut si email est null
                ]);
            }
        }
    }
}

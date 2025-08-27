<?php

namespace Database\Seeders;

use App\Enums\UserRole;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class UserSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        User::create([
            'name' => 'Admin User',
            'email' => 'admin@example.com',
            'password' => Hash::make('password123'),
            'role' => UserRole::ADMIN,
        ]);

        User::create([
            'name' => 'Agent One',
            'email' => 'agent1@example.com',
            'password' => Hash::make('password123'),
            'role' => UserRole::AGENT,
        ]);

        User::create([
            'name' => 'Agent Two',
            'email' => 'agent2@example.com',
            'password' => Hash::make('password123'),
            'role' => UserRole::AGENT,
        ]);

        User::create([
            'name' => 'Agent Three',
            'email' => 'agent3@example.com',
            'password' => Hash::make('password123'),
            'role' => UserRole::AGENT,
        ]);

        User::create([
            'name' => 'Finance User',
            'email' => 'finance@example.com',
            'password' => Hash::make('password123'),
            'role' => UserRole::FINANCE,
        ]);
    }
}

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
            'name' => 'Responsable de Fourrière',
            'email' => 'admin@example.com',
            'password' => Hash::make('password123'),
            'role' => UserRole::ADMIN,
        ]);

        User::create([
            'name' => 'Régisseur auxiliaire',
            'email' => 'regisseur@example.com',
            'password' => Hash::make('password123'),
            'role' => UserRole::AGENT,
        ]);

        User::create([
            'name' => 'Caissier',
            'email' => 'caissier@example.com',
            'password' => Hash::make('password123'),
            'role' => UserRole::FINANCE,
        ]);
    }
}

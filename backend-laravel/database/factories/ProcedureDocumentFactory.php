<?php

namespace Database\Factories;

use App\Models\Procedure;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\ProcedureDocument>
 */
class ProcedureDocumentFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $types = ['application/pdf', 'image/jpeg', 'image/png', 'application/msword'];
        $docNames = [
            'Procès-verbal',
            'Identification du véhicule',
            'Preuve de propriété',
            'Formulaire de libération',
            'Document d\'identification du propriétaire',
            'Reçu de paiement',
            'Notification officielle',
        ];
        
        return [
            'procedure_id' => Procedure::factory(),
            'name' => $this->faker->randomElement($docNames),
            'type' => $this->faker->randomElement($types),
            'url' => 'documents/' . $this->faker->uuid() . '.pdf',
            'uploaded_at' => $this->faker->dateTimeBetween('-1 month', 'now'),
        ];
    }
}

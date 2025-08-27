<?php

namespace Tests\Unit\Services;

use App\Models\Setting;
use App\Models\Vehicle;
use App\Services\FeeCalculationService;
use Carbon\Carbon;
use Tests\TestCase;

class FeeCalculationServiceTest extends TestCase
{
    protected FeeCalculationService $feeService;

    protected function setUp(): void
    {
        parent::setUp();
        $this->feeService = new FeeCalculationService();
    }

    /** @test */
    public function it_calculates_basic_fees_correctly()
    {
        // Create a mock vehicle
        $vehicle = new Vehicle();
        $vehicle->impound_date = Carbon::now()->subDays(10);

        // Create mock settings
        Setting::create([
            'key' => 'daily_storage_fee',
            'value' => json_encode(['amount' => 2000]),
            'description' => 'Frais journaliers de gardiennage (FCFA)',
            'group' => 'fees',
            'is_public' => true,
        ]);

        Setting::create([
            'key' => 'administrative_fee',
            'value' => json_encode(['amount' => 10000]),
            'description' => 'Frais administratifs fixes (FCFA)',
            'group' => 'fees',
            'is_public' => true,
        ]);

        // Calculate fees
        $fees = $this->feeService->calculateFees($vehicle);

        // Assert
        $this->assertEquals(10, $fees['days_impounded']);
        $this->assertEquals(2000, $fees['daily_rate']);
        $this->assertEquals(20000, $fees['storage_fees']); // 10 days * 2000
        $this->assertEquals(10000, $fees['admin_fee']);
        $this->assertEquals(0, $fees['penalty_fees']); // No penalty yet
        $this->assertEquals(30000, $fees['total_due']); // 20000 + 10000
    }

    /** @test */
    public function it_calculates_penalty_fees_correctly()
    {
        // Create a mock vehicle
        $vehicle = new Vehicle();
        $vehicle->impound_date = Carbon::now()->subDays(35);

        // Create mock settings
        Setting::create([
            'key' => 'daily_storage_fee',
            'value' => json_encode(['amount' => 2000]),
            'description' => 'Frais journaliers de gardiennage (FCFA)',
            'group' => 'fees',
            'is_public' => true,
        ]);

        Setting::create([
            'key' => 'administrative_fee',
            'value' => json_encode(['amount' => 10000]),
            'description' => 'Frais administratifs fixes (FCFA)',
            'group' => 'fees',
            'is_public' => true,
        ]);

        Setting::create([
            'key' => 'penalty_threshold_days',
            'value' => json_encode(['amount' => 30]),
            'description' => 'Nombre de jours avant pénalités',
            'group' => 'fees',
            'is_public' => true,
        ]);

        Setting::create([
            'key' => 'penalty_rate',
            'value' => json_encode(['amount' => 1000]),
            'description' => 'Taux de pénalité par jour (FCFA)',
            'group' => 'fees',
            'is_public' => true,
        ]);

        // Calculate fees
        $fees = $this->feeService->calculateFees($vehicle);

        // Assert
        $this->assertEquals(35, $fees['days_impounded']);
        $this->assertEquals(2000, $fees['daily_rate']);
        $this->assertEquals(70000, $fees['storage_fees']); // 35 days * 2000
        $this->assertEquals(10000, $fees['admin_fee']);
        $this->assertEquals(5000, $fees['penalty_fees']); // 5 days over threshold * 1000
        $this->assertEquals(85000, $fees['total_due']); // 70000 + 10000 + 5000
    }
}

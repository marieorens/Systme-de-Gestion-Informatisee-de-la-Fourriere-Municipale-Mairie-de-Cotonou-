<?php

namespace App\Services;

use App\Models\Setting;
use App\Models\Vehicle;
use Carbon\Carbon;

class FeeCalculationService
{
    public function calculateFees(Vehicle $vehicle): array
    {
        // Get fee settings
        $dailyStorageFee = $this->getSetting('daily_storage_fee', 2000);
        $adminFee = $this->getSetting('administrative_fee', 10000);
        
        // Calculate days in impound
        $impoundDate = Carbon::parse($vehicle->impound_date);
        $today = Carbon::now();
        $daysImpounded = $impoundDate->diffInDays($today);
        
        // Calculate storage fees
        $storageFees = $daysImpounded * $dailyStorageFee;
        
        // Calculate penalty fees (if applicable)
        $penaltyThresholdDays = $this->getSetting('penalty_threshold_days', 30);
        $penaltyRate = $this->getSetting('penalty_rate', 1000);
        
        $penaltyFees = 0;
        if ($daysImpounded > $penaltyThresholdDays) {
            $penaltyDays = $daysImpounded - $penaltyThresholdDays;
            $penaltyFees = $penaltyDays * $penaltyRate;
        }
        
        // Calculate total fees
        $totalFees = $storageFees + $adminFee + $penaltyFees;
        
        return [
            'days_impounded' => $daysImpounded,
            'daily_rate' => $dailyStorageFee,
            'storage_fees' => $storageFees,
            'admin_fee' => $adminFee,
            'penalty_fees' => $penaltyFees,
            'total_due' => $totalFees,
        ];
    }
    
    /**
     * Get a setting value.
     *
     * @param string $key
     * @param mixed $default
     * @return mixed
     */
    private function getSetting(string $key, $default)
    {
        $setting = Setting::where('key', $key)->first();
        
        if (!$setting) {
            return $default;
        }
        
        $value = json_decode($setting->value, true);
        
        return $value['amount'] ?? $default;
    }
}

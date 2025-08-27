<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('procedures', function (Blueprint $table) {
            $table->id();
            $table->foreignId('vehicle_id')->constrained('vehicles');
            $table->enum('type', ['release', 'sale', 'destruction']);
            $table->enum('status', ['pending', 'in_progress', 'completed', 'cancelled']);
            $table->decimal('fees_calculated', 12, 2);
            $table->foreignId('created_by')->constrained('users');
            $table->timestamps();

            $table->index(['vehicle_id', 'status']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('procedures');
    }
};

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
        Schema::create('vehicles', function (Blueprint $table) {
            $table->id();
            $table->string('license_plate')->unique();
            $table->string('make');
            $table->string('model');
            $table->string('color');
            $table->year('year');
            $table->enum('type', ['car', 'motorcycle', 'truck', 'other']);
            $table->enum('status', ['impounded', 'claimed', 'sold', 'destroyed', 'pending_destruction']);
            $table->dateTime('impound_date');
            $table->string('location');
            $table->json('photos')->nullable();
            $table->string('qr_code')->nullable();
            $table->foreignId('owner_id')->constrained('owners');
            $table->decimal('estimated_value', 12, 2);
            $table->text('description')->nullable();
            $table->timestamps();

            $table->index('status');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('vehicles');
    }
};

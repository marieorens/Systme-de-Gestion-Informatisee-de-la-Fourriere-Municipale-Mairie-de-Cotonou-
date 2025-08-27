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
        Schema::create('notifications', function (Blueprint $table) {
            $table->id();
            $table->string('recipient');
            $table->enum('type', ['impound_notice', 'deadline_warning', 'payment_reminder']);
            $table->enum('channel', ['sms', 'email']);
            $table->text('message');
            $table->dateTime('sent_at')->nullable();
            $table->enum('status', ['pending', 'sent', 'failed']);
            $table->timestamps();

            $table->index(['sent_at', 'status']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('notifications');
    }
};

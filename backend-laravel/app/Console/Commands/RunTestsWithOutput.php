<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\Artisan;

class RunTestsWithOutput extends Command
{
    protected $signature = 'tests:run';
    protected $description = 'Run all tests and capture detailed output';

    public function handle()
    {
        $this->info('Running tests with detailed output...');
        $exitCode = Artisan::call('test', ['--verbose' => true]);
        $output = Artisan::output();
        
        file_put_contents(base_path('tests_output.txt'), $output);
        
        $this->info('Tests completed. Check tests_output.txt for results.');
        
        return $exitCode;
    }
}

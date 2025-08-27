<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Symfony\Component\Process\Process;

class RunTests extends Command
{
    protected $signature = 'test:run {testClass?}';
    protected $description = 'Run PHPUnit tests with detailed output';

    public function handle()
    {
        $testClass = $this->argument('testClass');
        
        $command = [
            'vendor/bin/phpunit',
            '--colors=always',
        ];
        
        if ($testClass) {
            $command[] = $testClass;
        }
        
        $process = new Process($command);
        $process->setTty(true);
        $process->run(function ($type, $buffer) {
            $this->output->write($buffer);
        });
        
        return $process->isSuccessful() ? 0 : 1;
    }
}

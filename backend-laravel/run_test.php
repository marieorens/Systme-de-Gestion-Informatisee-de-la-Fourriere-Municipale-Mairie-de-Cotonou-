<?php

require __DIR__ . '/vendor/autoload.php';

$command = "vendor\\bin\\phpunit tests/Feature/Controllers/UserControllerTest.php --debug";
$output = shell_exec($command);

echo $output;

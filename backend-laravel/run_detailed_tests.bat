@echo off
cd %~dp0
echo Executing tests...
php artisan test > detailed_test_results.txt 2>&1
echo Test results saved to detailed_test_results.txt
type detailed_test_results.txt
pause

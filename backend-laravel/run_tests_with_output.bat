@echo off
cd %~dp0
php artisan test > test_results.txt 2>&1
echo Tests terminés, résultats enregistrés dans test_results.txt
pause

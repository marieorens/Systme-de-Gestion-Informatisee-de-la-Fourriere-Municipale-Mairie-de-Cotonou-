@echo off
REM Script pour exécuter les tests

echo ----------------------------------------
echo DEBUT DE L'EXECUTION DES TESTS
echo %DATE% %TIME%
echo ----------------------------------------
echo.

REM Définir l'environnement de test
SET XDEBUG_MODE=coverage

REM Définir le fichier de sortie des résultats
SET TEST_RESULTS_FILE=test_results_log.txt

REM Créer ou vider le fichier de résultats
echo Resultats des tests - %DATE% %TIME% > %TEST_RESULTS_FILE%
echo ---------------------------------------- >> %TEST_RESULTS_FILE%
echo. >> %TEST_RESULTS_FILE%

REM Effacer le cache
echo Effacement du cache...
php artisan config:clear >> %TEST_RESULTS_FILE% 2>&1
echo Terminé.

REM Créer le fichier de base de données SQLite pour les tests
echo Création de la base de données de test...
type nul > database/test.sqlite
echo Terminé.

REM Exécuter les migrations sur la base de test
echo Exécution des migrations...
php artisan migrate:fresh --env=testing --seed >> %TEST_RESULTS_FILE% 2>&1
echo Terminé.

REM Exécuter les tests avec sortie détaillée
echo Exécution des tests...
php artisan test --env=testing -v >> %TEST_RESULTS_FILE% 2>&1
echo Terminé.

REM Afficher un résumé
echo.
echo ----------------------------------------
echo TESTS TERMINÉS
echo Les résultats détaillés ont été enregistrés dans %TEST_RESULTS_FILE%
echo ----------------------------------------

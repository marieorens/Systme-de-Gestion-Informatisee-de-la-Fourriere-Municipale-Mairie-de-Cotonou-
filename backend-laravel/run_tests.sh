#!/bin/bash
# Script pour exécuter les tests

# Définir l'environnement de test
export XDEBUG_MODE=coverage

# Effacer le cache
php artisan config:clear

# Créer le fichier de base de données SQLite pour les tests (si vous préférez un fichier plutôt qu'en mémoire)
touch database/test.sqlite

# Exécuter les migrations sur la base de test
php artisan migrate:fresh --env=testing --seed

# Exécuter les tests
php artisan test --env=testing

# Afficher la sortie
echo "Tests terminés !"

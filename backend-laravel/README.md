# Système de Gestion de la Fourrière Municipale - Backend API

Ce projet est le backend API pour le Système de Gestion de la Fourrière Municipale de Cotonou, développé avec Laravel.

## Technologies

- PHP 8.2
- Laravel 10.x
- MySQL
- Sanctum (Authentification)
- L5-Swagger (Documentation API)

## Installation

### Prérequis

- PHP 8.2 ou supérieur
- Composer
- MySQL

### Étapes d'installation

1. Cloner le dépôt
   ```bash
   git clone https://github.com/marieorens/cotonou-municipal-garage-system.git
   cd cotonou-municipal-garage-system/backend-laravel
   ```

2. Installer les dépendances
   ```bash
   composer install
   ```

3. Configurer l'environnement
   ```bash
   cp .env.example .env
   php artisan key:generate
   ```

4. Configurer la base de données dans `.env`
   ```
   DB_CONNECTION=mysql
   DB_HOST=127.0.0.1
   DB_PORT=3306
   DB_DATABASE=fourriere
   DB_USERNAME=root
   DB_PASSWORD=
   ```

5. Exécuter les migrations et les seeders
   ```bash
   php artisan migrate
   php artisan db:seed
   ```

6. Générer la documentation API
   ```bash
   php artisan l5-swagger:generate
   ```

7. Démarrer le serveur
   ```bash
   php artisan serve
   ```

## Structure du projet

- `app/Http/Controllers` - Contrôleurs API
- `app/Models` - Modèles Eloquent
- `app/Http/Resources` - Ressources API
- `app/Http/Requests` - Classes de validation des requêtes
- `app/Services` - Services métier
- `app/Policies` - Politiques d'autorisation
- `app/Enums` - Énumérations
- `database/migrations` - Migrations de base de données
- `database/seeders` - Seeders pour les données de test
- `routes/api.php` - Routes API

## Authentification

L'API utilise Laravel Sanctum pour l'authentification par tokens. Pour obtenir un token, utilisez l'endpoint `/api/auth/login`.

## Endpoints API

### Authentification
- `POST /api/auth/login` - Connexion et obtention d'un token
- `POST /api/auth/logout` - Déconnexion (invalidation du token)
- `GET /api/auth/profile` - Obtenir le profil de l'utilisateur connecté
- `POST /api/auth/change-password` - Changer le mot de passe

### Véhicules
- `GET /api/vehicles` - Liste des véhicules
- `POST /api/vehicles` - Créer un nouveau véhicule
- `GET /api/vehicles/{id}` - Détails d'un véhicule
- `PUT /api/vehicles/{id}` - Mettre à jour un véhicule
- `DELETE /api/vehicles/{id}` - Supprimer un véhicule
- `POST /api/vehicles/{id}/photos` - Ajouter des photos à un véhicule
- `GET /api/vehicles/{id}/qr-code` - Générer un QR code pour un véhicule
- `GET /api/vehicles/{id}/storage-fee` - Calculer les frais de stockage
- `GET /api/vehicles/{id}/payments` - Obtenir les paiements pour un véhicule

### Propriétaires
- `GET /api/owners` - Liste des propriétaires
- `POST /api/owners` - Créer un nouveau propriétaire
- `GET /api/owners/{id}` - Détails d'un propriétaire
- `PUT /api/owners/{id}` - Mettre à jour un propriétaire
- `DELETE /api/owners/{id}` - Supprimer un propriétaire
- `GET /api/owners/{id}/vehicles` - Obtenir les véhicules d'un propriétaire

### Procédures
- `GET /api/procedures` - Liste des procédures
- `POST /api/procedures` - Créer une nouvelle procédure
- `GET /api/procedures/{id}` - Détails d'une procédure
- `PUT /api/procedures/{id}` - Mettre à jour une procédure
- `DELETE /api/procedures/{id}` - Supprimer une procédure
- `GET /api/procedures/{id}/documents` - Obtenir les documents d'une procédure
- `POST /api/procedures/{id}/documents` - Ajouter des documents à une procédure
- `DELETE /api/procedures/{id}/documents/{docId}` - Supprimer un document

### Paiements
- `GET /api/payments` - Liste des paiements
- `POST /api/payments` - Créer un nouveau paiement
- `GET /api/payments/{id}` - Détails d'un paiement
- `PUT /api/payments/{id}` - Mettre à jour un paiement
- `DELETE /api/payments/{id}` - Supprimer un paiement
- `GET /api/payments/{id}/receipt` - Générer un reçu pour un paiement
- `GET /api/vehicles/{id}/payments` - Obtenir les paiements pour un véhicule
- `POST /api/vehicles/{id}/payments` - Créer un paiement pour un véhicule

### Notifications
- `GET /api/notifications` - Liste des notifications
- `GET /api/notifications/unread-count` - Nombre de notifications non lues
- `GET /api/notifications/{id}` - Détails d'une notification
- `POST /api/notifications/{id}/read` - Marquer une notification comme lue
- `POST /api/notifications/mark-all-read` - Marquer toutes les notifications comme lues

### Administration des utilisateurs
- `GET /api/admin/users` - Liste des utilisateurs
- `POST /api/admin/users` - Créer un nouvel utilisateur
- `GET /api/admin/users/{id}` - Détails d'un utilisateur
- `PUT /api/admin/users/{id}` - Mettre à jour un utilisateur
- `DELETE /api/admin/users/{id}` - Supprimer un utilisateur
- `GET /api/admin/roles` - Liste des rôles

### Public
- `POST /api/public/vehicles/search` - Rechercher un véhicule par immatriculation
- `GET /api/public/vehicles/{licensePlate}` - Obtenir les détails d'un véhicule par immatriculation
- `GET /api/public/vehicles/{licensePlate}/fees` - Calculer les frais pour un véhicule par immatriculation

### Tableau de bord
- `GET /api/dashboard/stats` - Statistiques générales
- `GET /api/dashboard/vehicles-by-status` - Statistiques des véhicules par statut
- `GET /api/dashboard/payments-by-month` - Statistiques des paiements par mois
- `GET /api/dashboard/recent-activities` - Activités récentes

## Documentation API

La documentation API complète est disponible à l'URL `/api/documentation` après le démarrage du serveur.

## Déploiement

### Serveur de production

Pour déployer l'API sur un serveur de production, suivez ces étapes:

1. Configurer un serveur web (Apache/Nginx)
2. Configurer PHP et MySQL
3. Cloner le dépôt sur le serveur
4. Installer les dépendances en mode production
   ```bash
   composer install --no-dev --optimize-autoloader
   ```
5. Configurer le fichier `.env` pour la production
6. Générer la clé de l'application
   ```bash
   php artisan key:generate
   ```
7. Exécuter les migrations
   ```bash
   php artisan migrate --force
   ```
8. Optimiser Laravel pour la production
   ```bash
   php artisan config:cache
   php artisan route:cache
   php artisan view:cache
   ```
9. Configurer les permissions des fichiers
10. Configurer HTTPS
11. Configurer la planification des tâches (si nécessaire)
    ```bash
    * * * * * cd /chemin/vers/projet && php artisan schedule:run >> /dev/null 2>&1
    ```

## Code of Conduct

In order to ensure that the Laravel community is welcoming to all, please review and abide by the [Code of Conduct](https://laravel.com/docs/contributions#code-of-conduct).

## Security Vulnerabilities

If you discover a security vulnerability within Laravel, please send an e-mail to Taylor Otwell via [taylor@laravel.com](mailto:taylor@laravel.com). All security vulnerabilities will be promptly addressed.

## License

The Laravel framework is open-sourced software licensed under the [MIT license](https://opensource.org/licenses/MIT).

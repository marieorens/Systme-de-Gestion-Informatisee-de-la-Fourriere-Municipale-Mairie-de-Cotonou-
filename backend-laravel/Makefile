# Makefile ppour mon projet Laravel

# Variables
PHP = php
ARTISAN = $(PHP) artisan
COMPOSER = composer
PINT = ./vendor/bin/pint
PHPSTAN = ./vendor/bin/phpstan
PEST = ./vendor/bin/pest

.PHONY: aide à installer le setup et autres

help:
	@echo "Commandes disponibles:"
	@echo "  install            - pour installer les dépendences du projet"
	@echo "  setup              - initialisation de l'application (copy .env, generate key, migrate, seed)"
	@echo "  serve              - pour le démarrage du serveur de développement"
	@echo "  test               - exécution des tests avec Pest"
	@echo "  lint               - analyse du code pour voir les potentielles erreu avec PHPStan"
	@echo "  fix                - correction du style du code avec Pint"
	@echo "  docs               - génération de la documentation de l'api"

install:
	@echo "Installation des dépendences Composer..."
	$(COMPOSER) install --no-interaction --prefer-dist --optimize-autoloader

setup:
	@echo "Initialisation de l'application..."
	@if [ ! -f .env ]; then \
		echo "Copie de .env.example à .env..."; \
		cp .env.example .env; \
		$(ARTISAN) key:generate; \
	fi
	$(ARTISAN) migrate:fresh --seed
	@echo "Initialisation de l'application terminée."

serve:
	@echo "Démarage du serveur de développement Laravel..."
	$(ARTISAN) serve

test:
	@echo "Exécution des tests..."
	$(PEST)

lint:
	@echo "Analyse du code avec PHPStan pour d'éeventuelles erreurs..."
	$(PHPSTAN) analyse

fix:
	@echo "Corection du style du code avec Pint..."
	$(PINT)

docs:
	@echo "Création de la documentation de l'API..."
	$(ARTISAN) l5-swagger:generate

fresh:
	@echo "Rafraichissement et remplissage de la base de données..."
	$(ARTISAN) migrate:fresh --seed

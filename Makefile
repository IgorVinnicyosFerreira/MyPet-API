.PHONY: help up build down logs ps app-shell db-shell install docker-install dev docker-dev migrate migrate-reset prisma-generate seed ps restart

COMPOSE = docker compose
APP = app
DB = db

help:
	@echo "Available targets:"
	@echo "  up            - Build and start services in background"
	@echo "  build         - Build docker images"
	@echo "  down          - Stop and remove containers and volumes"
	@echo "  logs          - Follow logs from all services"
	@echo "  ps            - List compose services"
	@echo "  app-shell     - Open a shell in the app container"
	@echo "  db-shell      - Open psql in the db container"
	@echo "  install       - Install node dependencies locally (pnpm)"
	@echo "  docker-install- Install dependencies inside the app container"
	@echo "  dev           - Run local development server (pnpm dev)"
	@echo "  docker-dev    - Start services (no-detach)"
	@echo "  migrate       - Run prisma migrations in the app container"
	@echo "  migrate-reset - Reset prisma migrations (development only)"
	@echo "  prisma-generate- Run prisma generate in container"
	@echo "  seed          - Run prisma seed in container"

up: build
	$(COMPOSE) up -d

build:
	$(COMPOSE) build --no-cache

down:
	$(COMPOSE) down -v

logs:
	$(COMPOSE) logs -f

ps:
	$(COMPOSE) ps

app-shell:
	$(COMPOSE) exec $(APP) sh

db-shell:
	$(COMPOSE) exec $(DB) psql -U postgres -d mypet

install:
	pnpm install

docker-install:
	$(COMPOSE) run --rm $(APP) pnpm install

dev:
	pnpm dev

docker-dev:
	$(COMPOSE) up --build

migrate:
	$(COMPOSE) exec $(APP) pnpm prisma migrate dev

migrate-reset:
	$(COMPOSE) exec $(APP) pnpm prisma migrate reset --force

prisma-generate:
	$(COMPOSE) exec $(APP) pnpm prisma generate

seed:
	$(COMPOSE) exec $(APP) pnpm prisma db seed

restart: down up

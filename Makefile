.PHONY: help up build down remove stop logs ps app-shell db-shell install docker-install dev docker-dev migrate migrate-reset migrate-deploy prisma-generate seed restart typecheck test test-unit test-integration test-coverage test-coverage-all

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
	@echo "  test          - Run unit tests (no database dependency)"
	@echo "  test-integration - Run integration tests (requires database)"
	@echo "  test-coverage - Run unit tests with coverage"

up: build
	$(COMPOSE) up -d

build:
	$(COMPOSE) build --no-cache

remove:
	$(COMPOSE) down -v

stop:
	$(COMPOSE) stop

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

typecheck:
	@if grep -q '"typecheck"' package.json; then \
		pnpm typecheck; \
	else \
		echo "typecheck script not found in package.json"; \
		exit 1; \
	fi

migrate:
	$(COMPOSE) exec $(APP) pnpm prisma migrate dev

migrate-reset:
	$(COMPOSE) exec $(APP) pnpm prisma migrate reset --force

migrate-deploy:
	$(COMPOSE) exec $(APP) pnpm prisma migrate deploy

prisma-generate:
	$(COMPOSE) exec $(APP) pnpm prisma generate

seed:
	$(COMPOSE) exec $(APP) pnpm prisma db seed

restart: stop up

test:
	$(COMPOSE) run --rm --no-deps $(APP) bun test tests/unit

test-coverage:
	$(COMPOSE) run --rm --no-deps $(APP) bun test tests/unit --coverage

test-unit:
	$(COMPOSE) run --rm --no-deps $(APP) bun test tests/unit

test-integration:
	$(COMPOSE) exec $(APP) bun test tests/integration

test-coverage-all:
	$(COMPOSE) exec $(APP) bun test --coverage

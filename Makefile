COMPOSE   = docker compose --env-file .env

SERVICES := backend frontend voicevox web

$(foreach s,$(SERVICES), \
  $(eval run-$(s): ; $$(COMPOSE) up -d $(s)) \
  $(eval rebuild-$(s): ; $$(COMPOSE) build --no-cache $(s) && $$(MAKE) run-$(s)) \
  $(eval logs-$(s): run-$(s) ; $$(COMPOSE) logs -f $(s)) \
)

# Web project commands
web-build:
	cd web && bun run build

web-check:
	cd web && bun run check:fix

stop:
	$(COMPOSE) stop

init-app:
	@if [ ! -f .env ]; then cp .env_example .env; fi
	@if [ ! -f backend/src/static/localdb.sqlite ]; then cp backend/src/static/japanese_dictation.sqlite backend/src/static/localdb.sqlite; fi

app: init-app run-frontend run-backend
# app-advanced: app run-voicevox

# Web development
web-dev:
	$(COMPOSE) watch web

frontend-dev:
	$(COMPOSE) watch frontend

backend-dev:
	$(COMPOSE) watch backend

clean:
	docker system prune -f
	docker volume prune -f

clear-DANGER:
	@echo "WARNING: This will remove ALL resources for japanese-writing-practice."
	@echo "Press Ctrl+C to abort or wait 5s..."
	@sleep 5
	$(COMPOSE) -p japanese-writing-practice down -v --rmi all --remove-orphans
	rm -rf backend/src/static/localdb.sqlite
	@echo "All resources for japanese-writing-practice removed."

new-migration:
	./scripts/new_migration.sh "$(NAME)"

.PHONY: $(foreach s,$(SERVICES),run-$(s) rebuild-$(s) logs-$(s)) \
	stop clean app frontend-dev backend-dev clear-DANGER \
	web-dev web-build web-check \
	new-migration
# 	app-advanced
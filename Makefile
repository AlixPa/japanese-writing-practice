COMPOSE   = docker compose --env-file .env

SERVICES := backend mysql migration frontend voicevox init-db

$(foreach s,$(SERVICES), \
  $(eval run-$(s): ; $$(COMPOSE) up -d $(s)) \
  $(eval rebuild-$(s): ; $$(COMPOSE) build --no-cache $(s) && $$(MAKE) run-$(s)) \
  $(eval logs-$(s): run-$(s) ; $$(COMPOSE) logs -f $(s)) \
)

stop:
	$(COMPOSE) stop

init-app:
	@if [ ! -f .env ]; then cp .env_example .env; fi
	@if [ ! -d .db ]; then mkdir .db && chmod -R 777 .db; fi
	$(MAKE) run-init-db

app: init-app run-frontend run-backend
# app-advanced: app run-voicevox

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
	rm -rf .db
	@echo "All resources for japanese-writing-practice removed."

.PHONY: $(foreach s,$(SERVICES),run-$(s) rebuild-$(s) logs-$(s)) \
	stop clean app frontend-dev backend-dev clear-DANGER \
# 	app-advanced
COMPOSE   = docker compose --env-file .env

SERVICES := backend mysql migration frontend voicevox reset-db

$(foreach s,$(SERVICES), \
  $(eval run-$(s): ; $$(COMPOSE) up -d $(s)) \
  $(eval rebuild-$(s): ; $$(COMPOSE) build --no-cache $(s) && $$(MAKE) run-$(s)) \
  $(eval logs-$(s): run-$(s) ; $$(COMPOSE) logs -f $(s)) \
)

stop:
	$(COMPOSE) stop

init-app:
	@if [ ! -f .env ]; then cp .env_example .env; fi
	$(MAKE) run-reset-db

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
	@echo "WARNING: This will remove ALL resources for wanikani-writing-practice!"
	@echo "Press Ctrl+C to abort or wait 5s..."
	@sleep 5
	# stop all containers of the project
	-docker ps -a --filter "name=wanikani-writing-practice" -q | xargs -r docker rm -f
	# remove all images of the project
	-docker images --filter "reference=wanikani-writing-practice*" -q | xargs -r docker rmi -f
	# remove all volumes of the project
	-docker volume ls --filter "name=wanikani-writing-practice" -q | xargs -r docker volume rm -f
	# remove all networks of the project
	-docker network ls --filter "name=wanikani-writing-practice" -q | xargs -r docker network rm
	rm -rf .db
	@echo "All resources for wanikani-writing-practice removed!"

.PHONY: $(foreach s,$(SERVICES),run-$(s) rebuild-$(s) logs-$(s)) \
	stop clean app frontend-dev backend-dev \
# 	app-advanced
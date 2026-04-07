.PHONY: up down test lint

up:
	docker compose up --build

down:
	docker compose down

test:
	@echo "TODO: add test commands"

lint:
	@echo "TODO: add lint commands"

up:
	docker compose up --build
down:
	docker compose down
logs:
	docker compose logs -f
be:
	docker compose exec backend bash
fe:
	docker compose exec frontend sh
seed:
	docker compose exec backend python -m app.seed
.PHONY: install test api web

install:
	python3 -m venv .venv
	.venv/bin/pip install -e ./sdk -e "./api[dev]"
	cd web && npm install

test:
	.venv/bin/pytest

api:
	.venv/bin/uvicorn decidion_api.main:app --reload --port 8000

web:
	cd web && npm run dev

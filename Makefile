SHELL := /bin/zsh

.PHONY: install build test test-emulator test-e2e web worker dev start compose-up down logs health

install:
	npm install

build:
	npm run build

test:
	npm run test

test-emulator:
	npm run test:emulator

test-e2e:
	npm run test:e2e

web:
	npm run web

worker:
	npm run worker

dev:
	npm run dev:all

start:
	npm run start:all

compose-up:
	docker compose up --build

down:
	docker compose down

logs:
	docker compose logs -f

health:
	curl -s http://localhost:3000/api/health

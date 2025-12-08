SHELL := /bin/bash
PROJECT_ROOT := ..
SERVICES := campaign-launcher/client campaign-launcher/server recording-oracle reputation-oracle

.PHONY: help
help:
	@echo "Makefile for hufi"
	@echo ""
	@echo "  make install"
	@echo "     Install all dependencies"
	@echo ""
	@echo "  make create-env-files"
	@echo "     Create environment files for all services"
	@echo ""
	@echo "  make start"
	@echo "     Start all services"
	@echo ""

# Dependency Installation
install-campaign-launcher-client:
	cd $(PROJECT_ROOT)/campaign-launcher/client && yarn

install-campaign-launcher-server:
	cd $(PROJECT_ROOT)/campaign-launcher/server && yarn

install-recording-oracle:
	cd $(PROJECT_ROOT)/recording-oracle && yarn

install-reputation-oracle:
	cd $(PROJECT_ROOT)/reputation-oracle && yarn

.PHONY: install
install:
	@echo "Installing dependencies..."
	$(MAKE) install-campaign-launcher-client
	$(MAKE) install-campaign-launcher-server
	$(MAKE) install-recording-oracle
	$(MAKE) install-reputation-oracle
	@echo "Finished installing dependencies"

# Create environment files
.PHONY: create-env-files
create-env-files:
	@echo "Creating environment files..."

	@for service in $(SERVICES); do \
		if [ ! -f "$(PROJECT_ROOT)/$$service/.env" ]; then \
			echo "Copying $$service .env.example to .env..."; \
			cp $(PROJECT_ROOT)/$$service/.env.example $(PROJECT_ROOT)/$$service/.env; \
		else \
			echo "Environment file for $$service already exists. Skipping..."; \
		fi \
	done

	@echo "Finished creating environment files"

# Development Servers
start-campaign-launcher-client:
	cd $(PROJECT_ROOT)/campaign-launcher/client && yarn dev

start-campaign-launcher-server:
	cd $(PROJECT_ROOT)/campaign-launcher/server && yarn start:dev

start-recording-oracle:
	cd $(PROJECT_ROOT)/recording-oracle && yarn start:dev

start-reputation-oracle:
	cd $(PROJECT_ROOT)/reputation-oracle && yarn start:dev

start-docker:
	docker compose up -d

.PHONY: start
start: start-docker
	$(MAKE) create-env-files
	@echo "Running Hufi..."
	@trap 'echo "Stopping Hufi.."; kill -9 $$PID_CL_CLIENT $$PID_CL_SERVER $$PID_RECO $$PID_REPO; docker compose down; exit 0' SIGINT ERR; \
	$(MAKE) start-campaign-launcher-client & PID_CL_CLIENT=$$!; \
	$(MAKE) start-campaign-launcher-server & PID_CL_SERVER=$$!; \
	$(MAKE) start-recording-oracle & PID_RECO=$$!; \
	$(MAKE) start-reputation-oracle & PID_REPO=$$!; \
	wait


# Format
format-campaign-launcher-client:
	cd $(PROJECT_ROOT)/campaign-launcher/client && yarn format

format-campaign-launcher-server:
	cd $(PROJECT_ROOT)/campaign-launcher/server && yarn format

format-recording-oracle:
	cd $(PROJECT_ROOT)/recording-oracle && yarn format

format-reputation-oracle:
	cd $(PROJECT_ROOT)/reputation-oracle && yarn format

.PHONY: format
format:
	@echo "Formatting code..."
	$(MAKE) format-campaign-launcher-client
	$(MAKE) format-campaign-launcher-server
	$(MAKE) format-recording-oracle
	$(MAKE) format-reputation-oracle
	@echo "Finished formatting code"

# Lint
lint-campaign-launcher-client:
	cd $(PROJECT_ROOT)/campaign-launcher/client && yarn lint

lint-campaign-launcher-server:
	cd $(PROJECT_ROOT)/campaign-launcher/server && yarn lint

lint-recording-oracle:
	cd $(PROJECT_ROOT)/recording-oracle && yarn lint

lint-reputation-oracle:
	cd $(PROJECT_ROOT)/reputation-oracle && yarn lint

.PHONY: lint
lint:
	@echo "Linting code..."
	$(MAKE) lint-campaign-launcher-client
	$(MAKE) lint-campaign-launcher-server
	$(MAKE) lint-recording-oracle
	$(MAKE) lint-reputation-oracle
	@echo "Finished linting code"

lint-fix-campaign-launcher-client:
	cd $(PROJECT_ROOT)/campaign-launcher/client && yarn lint:fix

lint-fix-campaign-launcher-server:
	cd $(PROJECT_ROOT)/campaign-launcher/server && yarn lint:fix

lint-fix-recording-oracle:
	cd $(PROJECT_ROOT)/recording-oracle && yarn lint:fix

lint-fix-reputation-oracle:
	cd $(PROJECT_ROOT)/reputation-oracle && yarn lint:fix

.PHONY: lint-fix
lint-fix:
	@echo "Fixing lint issues..."
	$(MAKE) lint-fix-campaign-launcher-client
	$(MAKE) lint-fix-campaign-launcher-server
	$(MAKE) lint-fix-recording-oracle
	$(MAKE) lint-fix-reputation-oracle
	@echo "Finished fixing lint issues"

test-campaign-launcher:
	cd $(PROJECT_ROOT)/campaign-launcher/server && yarn test

test-recording-oracle:
	cd $(PROJECT_ROOT)/recording-oracle && yarn test

test-reputation-oracle:
	cd $(PROJECT_ROOT)/reputation-oracle && yarn test

.PHONY: test
test:
	@echo "Run unit tests..."
	$(MAKE) test-campaign-launcher
	$(MAKE) test-recording-oracle
	$(MAKE) test-reputation-oracle
	@echo "Finished unit tests"

# Typecheck
typecheck-campaign-launcher-client:
	cd $(PROJECT_ROOT)/campaign-launcher/client && yarn typecheck

typecheck-campaign-launcher-server:
	cd $(PROJECT_ROOT)/campaign-launcher/server && yarn typecheck

typecheck-recording-oracle:
	cd $(PROJECT_ROOT)/recording-oracle && yarn typecheck

typecheck-reputation-oracle:
	cd $(PROJECT_ROOT)/reputation-oracle && yarn typecheck

.PHONY: typecheck
typecheck:
	@echo "Typechecking code..."
	$(MAKE) typecheck-campaign-launcher-client
	$(MAKE) typecheck-campaign-launcher-server
	$(MAKE) typecheck-recording-oracle
	$(MAKE) typecheck-reputation-oracle
	@echo "Finished typechecking code"

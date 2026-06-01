SHELL := /bin/bash
PROJECT_ROOT := ..

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

# Tests
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

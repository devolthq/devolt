-include .env.develop

START_LOG = @echo "================================================= START OF LOG ==================================================="
END_LOG = @echo "================================================== END OF LOG ===================================================="

RPC_URL := http://localhost:8545
PRIVATE_KEY := 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80

ifeq ($(NETWORK), localhost)
	DEPLOY_NETWORK_ARGS := script/DeployProxy.s.sol --rpc-url $(RPC_URL) --private-key $(PRIVATE_KEY) --broadcast -v
else
	RPC_URL := $(TESTNET_RPC_URL)
	PRIVATE_KEY := $(TESTNET_PRIVATE_KEY)
	DEPLOY_NETWORK_ARGS := script/DeployProxy.s.sol --rpc-url $(RPC_URL) --private-key $(PRIVATE_KEY) --broadcast --verify --etherscan-api-key $(TESTNET_BLOCKSCAN_API_KEY) -v
endif

.PHONY: env
env: ./.env.develop
	$(START_LOG)
	@cp ./.env.develop.tmpl ./.env.develop
	@touch .cartesi.env
	@echo "Environment file created at ./.env.develop"
	$(END_LOG)

.PHONY: infra
infra:
	$(START_LOG)
	@docker compose \
		-f ./deployments/compose.infra.yaml up \
		--build -d
	@echo "Creating kafka topics..."
	@sleep 30
	@docker compose \
		-f ./deployments/compose.infra.yaml exec \
		kafka kafka-topics --bootstrap-server kafka:9094 \
		--create --topic device-creation-queue \
		--partitions 10
	$(END_LOG)

.PHONY: dev
dev:
	$(START_LOG)
	@nonodo -- go run ./cmd/dapp/
	$(END_LOG)

.PHONY: build
build:
	$(START_LOG)
	@docker build \
		-t dapp:latest \
		-f ./build/Dockerfile.dapp .
	@cartesi build --from-image dapp:latest
	$(END_LOG)

.PHONY: iot
iot:
	$(START_LOG)
	@docker compose \
		-f ./deployments/compose.packages.yaml \
		--env-file ./.env.develop \
		up app simulation streaming --build
	$(END_LOG)

.PHONY: app
app:
	$(START_LOG)
	@docker compose \
		-f ./deployments/compose.packages.yaml \
		--env-file ./.env.develop \
		up app --build
	$(END_LOG)
	
.PHONY: generate
generate:
	$(START_LOG)
	@go run ./pkg/ecdsa/generate
	@go run ./pkg/rollups-contracts/generate
	$(END_LOG)

.PHONY: test
test:
	@cd contracts && forge test
	@go test ./... -coverprofile=./coverage_sheet.md -v

.PHONY: deploy
deploy:
	$(START_LOG)
	@cd contracts && forge script $(DEPLOY_NETWORK_ARGS)
	$(END_LOG)

.PHONY: coverage
coverage: test
	@go tool cover -html=./test/coverage_sheet.md

.PHONY: docs
docs:
	@cd docs && npm run dev

.PHONY: swagger
swagger:
	$(START_LOG)
	@docker run --rm -v \
	$(pwd):/code ghcr.io/swaggo/swag:latest \
	i -g ./cmd/api-server/main.go -o ./api
	@go mod tidy
	$(END_LOG)
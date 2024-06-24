package main

import (
	"context"
	// "crypto/ecdsa"
	// "database/sql"
	// "encoding/json"
	// "errors"
	// "fmt"
	"log"
	"log/slog"
	"github.com/devolthq/devolt/pkg/router"
	"github.com/devolthq/devolt/configs"
	"github.com/devolthq/devolt/internal/infra/database"
	"github.com/devolthq/devolt/internal/infra/rollup/handler/advance_handler"
	"github.com/devolthq/devolt/internal/infra/rollup/middleware"
	"github.com/devolthq/devolt/internal/usecase/user_usecase"
	"github.com/ethereum/go-ethereum/common"
	"github.com/rollmelette/rollmelette"
)

func main() {
	publicKey, err := configs.ECDSAPublicKey()
	if err != nil {
		slog.Error("failed to get public key", "error", err)
	}

	db, err := configs.SetupSqlite()
	if err != nil {
		log.Fatalf("Failed to open and connect to database: %v", err)
	}

	//////////////////////// Repositories //////////////////////////
	stationRepository := database.NewStationRepositorySqlite(db)
	userRepository := database.NewUserRepositorySqlite(db)
	// auctionRepository := database.NewAuctionRepositorySqlite(db)
	// bidRepository := database.NewBidRepositorySqlite(db)

	//////////////////////// Setup Application //////////////////////////
	var addresses common.Address
	initialOwner := common.HexToAddress("0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266")
	if _, err = user_usecase.NewCreateUserUseCase(userRepository).Execute(&user_usecase.CreateUserInputDTO{
		Address: initialOwner,
		Role:    "admin",
	}); err != nil {
		slog.Error("failed to create initial order", "error", err)
	}

	///////////////////////// Setup Middlewares //////////////////////////
	ECDSA := middleware.NewECDSAMiddleware(publicKey)
	RBAC := middleware.NewRBACMiddleware(userRepository)

	//////////////////////// Handlers ////////////////////////
	governanceAdvanceHandlers := advance_handler.NewGovernanceAdvanceHandlers(&addresses)
	stationAdvanceHandlers := advance_handler.NewStationAdvanceHandlers(stationRepository, publicKey)

	//////////////////////// Setup Router //////////////////////////
	dapp := router.NewRouter()
	dapp.HandleAdvance("report", ECDSA.Middleware(stationAdvanceHandlers.ReportHandler))
	dapp.HandleAdvance("station", RBAC.Middleware(stationAdvanceHandlers.CreateStationHandler, "admin"))
	dapp.HandleAdvance("token", RBAC.Middleware(governanceAdvanceHandlers.SetTokenAddressHandler, "admin"))

	///////////////////////// Rollmelette //////////////////////////
	ctx := context.Background()
	opts := rollmelette.NewRunOpts()
	err = rollmelette.Run(ctx, opts, dapp)
	if err != nil {
		slog.Error("application error", "error", err)
	}
}

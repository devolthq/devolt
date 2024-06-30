package main

import (
	"context"
	"log"
	"log/slog"
	"github.com/devolthq/devolt/configs"
	"github.com/devolthq/devolt/internal/infra/database"
	"github.com/devolthq/devolt/internal/infra/cartesi/handler/advance_handler"
	"github.com/devolthq/devolt/internal/infra/cartesi/handler/inspect_handler"
	"github.com/devolthq/devolt/internal/infra/cartesi/middleware"
	"github.com/devolthq/devolt/internal/usecase/user_usecase"
	"github.com/devolthq/devolt/pkg/rollmelette_router"
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

	// TODO: replace this to wire dependency injection
	//////////////////////// Repositories //////////////////////////
	stationRepository := database.NewStationRepositorySqlite(db)
	userRepository := database.NewUserRepositorySqlite(db)
	auctionRepository := database.NewAuctionRepositorySqlite(db)
	bidRepository := database.NewBidRepositorySqlite(db)

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
	stationInpectHandlers := inspect_handler.NewStationInspectHandlers(stationRepository)
	auctionHandlers := inspect_handler.NewAuctionInspectHandlers(auctionRepository)
	bidHandlers := inspect_handler.NewBidInspectHandlers(bidRepository)
	
	//////////////////////// Setup Router //////////////////////////
	dapp := rollmelette_router.NewRouter()
	dapp.HandleAdvance("report", ECDSA.Middleware(stationAdvanceHandlers.ReportHandler))
	dapp.HandleAdvance("token", RBAC.Middleware(governanceAdvanceHandlers.SetTokenAddressHandler, "admin"))
	dapp.HandleInspect("station", stationInpectHandlers.FindAllStationsInspectHandler)
	dapp.HandleInspect("station/{id}", stationInpectHandlers.FindStationByIdInspectHandler)
	dapp.HandleInspect("bid", bidHandlers.FindAllBidsInspectHandler)
	dapp.HandleInspect("bid/{id}", bidHandlers.FindBidByIdInspectHandler)
	dapp.HandleInspect("auction", auctionHandlers.FindAllAuctionsInspectHandler)
	dapp.HandleInspect("auction/{id}", auctionHandlers.FindAuctionByIdInspectHandler)

	///////////////////////// Rollmelette //////////////////////////
	ctx := context.Background()
	opts := rollmelette.NewRunOpts()
	err = rollmelette.Run(ctx, opts, dapp)
	if err != nil {
		slog.Error("application error", "error", err)
	}
}

package main

import (
	"context"
	"encoding/json"
	"fmt"
	"github.com/devolthq/devolt/configs"
	"log"
	"log/slog"
	// "github.com/devolthq/devolt/internal/infra/repository"
	// "github.com/devolthq/devolt/internal/usecase"
	"github.com/devolthq/devolt/internal/usecase/dto"
	"github.com/rollmelette/rollmelette"
)

type MyApplication struct{}

func (a *MyApplication) Advance(
	env rollmelette.Env,
	metadata rollmelette.Metadata,
	deposit rollmelette.Deposit,
	payload []byte,
) error {
	//////////////////////// Configs //////////////////////////

	db, err := configs.SetupSQLite()
	if err != nil {
		log.Fatalf("Failed to connect to database: %v", err)
	}
	defer db.Close()

	//////////////////////// Decode Input ////////////////////////

	// TODO: Replace this approach to Cap’n Proto
	var input *dto.RollupPayloadInputDTO
	err = json.Unmarshal(payload, &input)
	if err != nil {
		return fmt.Errorf("failed to unmarshal input payload: %w", err)
	}

	// ////////////////////////// Repositories //////////////////////////

	// stationRepository := repository.NewStationRepositorySqlite(db)
	// auctionRepository := repository.NewAuctionRepositorySqlite(db)
	// bidRepository := repository.NewBidRepositorySqlite(db)

	// ////////////////////////// Use Cases //////////////////////////

	// // Auction
	// createAuctionUseCase := usecase.NewCreateAuctionUseCase(auctionRepository)
	// findAuctionByIdUseCase := usecase.NewFindAuctionByIdUseCase(auctionRepository)
	// findAllAuctionsUseCase := usecase.NewFindAllAuctionsUseCase(auctionRepository)
	// updateAuctionUseCase := usecase.NewUpdateAuctionUseCase(auctionRepository)
	// deleteAuctionUseCase := usecase.NewDeleteAuctionUseCase(auctionRepository)
	// // Bid
	// createBidUseCase := usecase.NewCreateBidUseCase(bidRepository)
	// findBidByIdUseCase := usecase.NewFindBidByIdUseCase(bidRepository)
	// findAllBidsUseCase := usecase.NewFindAllBidsUseCase(bidRepository)
	// updateBidUseCase := usecase.NewUpdateBidUseCase(bidRepository)
	// deleteBidUseCase := usecase.NewDeleteBidUseCase(bidRepository)
	// // Station
	// createStationUseCase := usecase.NewCreateStationUseCase(stationRepository)
	// findStationByIdUseCase := usecase.NewFindStationByIdUseCase(stationRepository)
	// findAllStationsUseCase := usecase.NewFindAllStationsUseCase(stationRepository)
	// updateStationUseCase := usecase.NewUpdateStationUseCase(stationRepository)
	// deleteStationUseCase := usecase.NewDeleteStationUseCase(stationRepository)

	////////////////////////// Router //////////////////////////

	switch input.Kind {
	case "BuyEnergy":
		log.Printf("Rolling Buy: %v", string(input.Payload))
	case "SellEnergy":
		log.Printf("Rolling Sell: %v", string(input.Payload))
	case "FinishAuction":
		log.Printf("Rolling Finish: %v", string(input.Payload))
	case "DeviceReport":
		log.Printf("Rolling Device: %v", string(input.Payload))
	}

	return nil
}

func (a *MyApplication) Inspect(env rollmelette.EnvInspector, payload []byte) error {
	slog.Info("Inspect", "payload", string(payload))
	return nil
}

func main() {
	ctx := context.Background()
	opts := rollmelette.NewRunOpts()
	app := new(MyApplication)
	err := rollmelette.Run(ctx, opts, app)
	if err != nil {
		slog.Error("application error", "error", err)
	}
}
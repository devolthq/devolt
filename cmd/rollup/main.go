package main

import (
	"context"
	"crypto/ecdsa"
	"strconv"
	"strings"

	// "crypto/ecdsa"
	"encoding/json"
	"fmt"
	"log"
	"log/slog"

	"github.com/devolthq/devolt/configs"
	"github.com/ethereum/go-ethereum/common"
	"github.com/jmoiron/sqlx"

	// "github.com/ethereum/go-ethereum/common"
	"github.com/devolthq/devolt/internal/domain/entity"
	"github.com/devolthq/devolt/internal/infra/repository"
	"github.com/devolthq/devolt/internal/usecase"
	"github.com/devolthq/devolt/internal/usecase/dto"
	"github.com/rollmelette/rollmelette"
)

type DeVoltRollup struct {
	State     *sqlx.DB
	Admin     *common.Address
	PublicKey *ecdsa.PublicKey
}

func NewDeVoltRollup(state *sqlx.DB, admin *common.Address, publicKey *ecdsa.PublicKey) *DeVoltRollup {
	return &DeVoltRollup{
		State:     state,
		Admin:     admin,
		PublicKey: publicKey,
	}
}

func (d *DeVoltRollup) Advance(
	env rollmelette.Env,
	metadata rollmelette.Metadata,
	deposit rollmelette.Deposit,
	payload []byte,
) error {

	//////////////////////// Decode Input ////////////////////////
	// TODO: Replace this approach to Cap’n Proto
	var input *dto.AdvaceInputDTO
	err := json.Unmarshal(payload, &input)
	if err != nil {
		return fmt.Errorf("failed to unmarshal input payload: %w", err)
	}
	// ////////////////////////// Repositories //////////////////////////

	stationRepository := repository.NewStationRepositorySqlite(d.State)
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
	createStationUseCase := usecase.NewCreateStationUseCase(stationRepository)
	findStationByIdUseCase := usecase.NewFindStationByIdUseCase(stationRepository)
	// findAllStationsUseCase := usecase.NewFindAllStationsUseCase(stationRepository)
	updateStationUseCase := usecase.NewUpdateStationUseCase(stationRepository)
	// deleteStationUseCase := usecase.NewDeleteStationUseCase(stationRepository)

	///////////////////////// Router //////////////////////////
	switch input.Kind {
	case "BuyEnergy":
		log.Printf("Rolling Buy: %v", string(input.Payload))
	case "SellEnergy":
		log.Printf("Rolling Sell: %v", string(input.Payload))
	case "FinishAuction":
		log.Printf("Rolling Finish: %v", string(input.Payload))
	case "DeviceReport":
		////////////////////////// Decode Report //////////////////////////
		var report *entity.Report
		if err := json.Unmarshal(input.Payload, &report); err != nil {
			return fmt.Errorf("failed to unmarshal report: %w", err)
		}
		//////////////////////// Verify Report //////////////////////////
		if valid := ecdsa.Verify(d.PublicKey, report.Payload, report.R, report.S); !valid {
			return fmt.Errorf("invalid report: %v", report)
		}
		//////////////////////// Decode Payload //////////////////////////
		var payload *entity.Payload
		if err := json.Unmarshal(report.Payload, &payload); err != nil {
			return fmt.Errorf("failed to unmarshal payload: %w", err)
		}
		//////////////////////// Verify if station exists and if not exist, create one //////////////////////////
		station, err := findStationByIdUseCase.Execute(&usecase.FindStationByIdInputDTO{
			Id: payload.DeviceId,
		})
		if err != nil {
			output, err := createStationUseCase.Execute(&usecase.CreateStationInputDTO{
				Id:        payload.DeviceId,
				Rate:      payload.Rate / 30,
				Owner:     payload.Wallet,
				Latitude:  payload.Latitude,
				Longitude: payload.Longitude,
				State:     "active",
				CreatedAt: metadata.BlockTimestamp,
			})
			if err != nil {
				return fmt.Errorf("failed to create station: %w", err)
			}
			outputBytes, err := json.Marshal(output)
			if err != nil {
				return fmt.Errorf("failed to marshal output: %w", err)
			}
			env.Report(outputBytes)
			log.Printf("Station created: %v", output.Id)
			return nil
		}
		//////////////////////// Update Station //////////////////////////
		output, err := updateStationUseCase.Execute(&usecase.UpdateStationInputDTO{
			Id:        station.Id,
			Rate:      station.Rate + (payload.Rate / 30),
			Owner:     payload.Wallet,
			State:     "active",
			Latitude:  payload.Latitude,
			Longitude: payload.Longitude,
			UpdatedAt: metadata.BlockTimestamp,
		})
		if err != nil {
			return fmt.Errorf("failed to update station: %w", err)
		}
		outputBytes, err := json.Marshal(output)
		if err != nil {
			return fmt.Errorf("failed to marshal output: %w", err)
		}
		env.Report(outputBytes)
		log.Printf("Station updated: %v", output.Id)
	default:
		return fmt.Errorf("invalid input: %v", input)
	}
	return nil
}

func (d *DeVoltRollup) Inspect(env rollmelette.EnvInspector, payload []byte) error {
	parameters := strings.Split(strings.TrimSpace(strings.TrimSuffix(strings.TrimPrefix(string(payload), "/"), "/")), "/")
	
	stationRepository := repository.NewStationRepositorySqlite(d.State)
	auctionRepository := repository.NewAuctionRepositorySqlite(d.State)
	bidRepository := repository.NewBidRepositorySqlite(d.State)

	if len(parameters) == 0 {
		return fmt.Errorf("no parameters provided")
	}

	switch parameters[0] {
	case "station":
		if len(parameters) == 1 {
			findAllStationsUseCase := usecase.NewFindAllStationsUseCase(stationRepository)
			res, err := findAllStationsUseCase.Execute()
			if err != nil {
				return fmt.Errorf("failed to find all stations: %w", err)
			}
			allStations, err := json.Marshal(res)
			if err != nil {
				return fmt.Errorf("failed to marshal all stations: %w", err)
			}
			env.Report(allStations)
		} else if len(parameters) == 2 {
			findStationByIdUseCase := usecase.NewFindStationByIdUseCase(stationRepository)
			res, err := findStationByIdUseCase.Execute(&usecase.FindStationByIdInputDTO{
				Id: parameters[1],
			})
			if err != nil {
				return fmt.Errorf("failed to find station: %w", err)
			}
			station, err := json.Marshal(res)
			if err != nil {
				return fmt.Errorf("failed to marshal station: %w", err)
			}
			env.Report(station)
		} else {
			return fmt.Errorf("invalid payload: %v", payload)
		}
	case "auction":
		if len(parameters) == 1 {
			findAllAuctionsUseCase := usecase.NewFindAllAuctionsUseCase(auctionRepository)
			res, err := findAllAuctionsUseCase.Execute()
			if err != nil {
				return fmt.Errorf("failed to find all auctions: %w", err)
			}
			allAuctions, err := json.Marshal(res)
			if err != nil {
				return fmt.Errorf("failed to marshal all auctions: %w", err)
			}
			env.Report(allAuctions)
		} else if len(parameters) == 2 {
			findAuctionByIdUseCase := usecase.NewFindAuctionByIdUseCase(auctionRepository)
			id, err := strconv.Atoi(parameters[1])
			if err != nil {
				return fmt.Errorf("invalid payload: %v", payload)
			}
			res, err := findAuctionByIdUseCase.Execute(&usecase.FindAuctionByIdInputDTO{
				Id: id,
			})
			if err != nil {
				return fmt.Errorf("failed to find auction: %w", err)
			}
			auction, err := json.Marshal(res)
			if err != nil {
				return fmt.Errorf("failed to marshal auction: %w", err)
			}
			env.Report(auction)
		} else {
			return fmt.Errorf("invalid payload: %v", payload)
		}
	case "bid":
		if len(parameters) == 1 {
			findAllBidsUseCase := usecase.NewFindAllBidsUseCase(bidRepository)
			res, err := findAllBidsUseCase.Execute()
			if err != nil {
				return fmt.Errorf("failed to find all bids: %w", err)
			}
			allBids, err := json.Marshal(res)
			if err != nil {
				return fmt.Errorf("failed to marshal all bids: %w", err)
			}
			env.Report(allBids)
		} else if len(parameters) == 2 {
			findBidByIdUseCase := usecase.NewFindBidByIdUseCase(bidRepository)
			id, err := strconv.Atoi(parameters[1])
			if err != nil {
				return fmt.Errorf("invalid payload: %v", payload)
			}
			res, err := findBidByIdUseCase.Execute(&usecase.FindBidByIdInputDTO{
				Id: id,
			})
			if err != nil {
				return fmt.Errorf("failed to find bid: %w", err)
			}
			bid, err := json.Marshal(res)
			if err != nil {
				return fmt.Errorf("failed to marshal bid: %w", err)
			}
			env.Report(bid)
		} else {
			return fmt.Errorf("invalid payload: %v", payload)
		}
	default:
		return fmt.Errorf("invalid payload: %v", payload)
	}
	return nil
}

func main() {
	//////////////////////// Configs //////////////////////////
	publicKey, err := configs.ECDSAPublicKey()
	if err != nil {
		slog.Error("failed to get public key", "error", err)
	}

	db, err := configs.SetupSQLite()
	if err != nil {
		log.Fatalf("Failed to open and connect to database: %v", err)
	}

	admin := common.HexToAddress("0x0000000000000000000000000000000000000000")

	///////////////////////// Rollmelette //////////////////////////
	ctx := context.Background()
	opts := rollmelette.NewRunOpts()
	app := NewDeVoltRollup(db, &admin, publicKey)
	err = rollmelette.Run(ctx, opts, app)
	if err != nil {
		slog.Error("application error", "error", err)
	}
}

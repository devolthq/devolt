package main

import (
	"context"
	"crypto/ecdsa"
	"database/sql"
	"encoding/json"
	"errors"
	"fmt"
	"log"
	"log/slog"
	"strings"

	"github.com/devolthq/devolt/configs"
	"github.com/devolthq/devolt/internal/domain/entity"
	"github.com/devolthq/devolt/internal/infra/database"
	"github.com/devolthq/devolt/internal/infra/rollup/handler/advance_handler"
	"github.com/devolthq/devolt/internal/infra/rollup/handler/inspect_handler"
	"github.com/devolthq/devolt/internal/infra/rollup/middleware"
	"github.com/devolthq/devolt/internal/usecase/dto"
	"github.com/devolthq/devolt/internal/usecase/user_usecase"
	"github.com/ethereum/go-ethereum/common"
	"github.com/rollmelette/rollmelette"
)

type DeVoltRollup struct {
	UserRepository    entity.UserRepository
	StationRepository entity.StationRepository
	AuctionRepository entity.AuctionRepository
	BidRepository     entity.BidRepository
	TokenAddress      *common.Address
	PublicKey         *ecdsa.PublicKey
}

func NewDeVoltRollup(
	userRepository entity.UserRepository,
	stationRepository entity.StationRepository,
	auctionRepository entity.AuctionRepository,
	bidRepository entity.BidRepository,
	TokenAddress *common.Address,
	publicKey *ecdsa.PublicKey) *DeVoltRollup {
	return &DeVoltRollup{
		UserRepository:    userRepository,
		StationRepository: stationRepository,
		AuctionRepository: auctionRepository,
		BidRepository:     bidRepository,
		TokenAddress:      TokenAddress,
		PublicKey:         publicKey,
	}
}

func (d *DeVoltRollup) Advance(
	env rollmelette.Env,
	metadata rollmelette.Metadata,
	deposit rollmelette.Deposit,
	payload []byte,
) error {
	fmt.Printf("Raw payload: %s\n", string(payload))

	//////////////////////// Decode Input ////////////////////////
	var input *dto.AdvaceInputDTO
	err := json.Unmarshal(payload, &input)
	if err != nil {
		return fmt.Errorf("failed to unmarshal input payload: %w", err)
	}

	/////////////////////////// Middleware //////////////////////////
	RBAC := middleware.NewRBACMiddleware(d.UserRepository)

	////////////////////////// Handlers //////////////////////////
	stationAdvanceHandlers := advance_handler.NewStationAdvanceHandlers(d.StationRepository)
	governanceAdvanceHandlers := advance_handler.NewGovernanceAdvanceHandlers(d.TokenAddress)

	///////////////////////// Router //////////////////////////
	switch input.Kind {
	case "buy":
	case "sell":
	case "cronJob":
	case "token":
		handler := RBAC.Middleware(governanceAdvanceHandlers.SetTokenAddress, "admin")
		if err := handler(env, metadata, deposit, input.Payload); err != nil {
			return fmt.Errorf("failed to set token address: %w", err)
		}
	case "withdraw":
	case "report":
		////////////////////////// Decode Report //////////////////////////
		var report *entity.Report
		if err := json.Unmarshal(input.Payload, &report); err != nil {
			return fmt.Errorf("failed to unmarshal report: %w", err)
		}
		//////////////////////// Verify Report //////////////////////////
		if valid := ecdsa.Verify(d.PublicKey, report.Payload, report.R, report.S); !valid {
			return fmt.Errorf("invalid report: %v", report)
		}
		//////////////////////// Process Report //////////////////////////
		if err := stationAdvanceHandlers.UpdateStationHandler(env, metadata, deposit, report.Payload); errors.Is(err, sql.ErrNoRows) {
			if err := stationAdvanceHandlers.CreateStationHandler(env, metadata, deposit, report.Payload); err != nil {
				return fmt.Errorf("failed to update or create station: %w", err)
			}
		} else if err != nil {
			return fmt.Errorf("failed to update station: %w", err)
		}
	default:
		return fmt.Errorf("unknown input kind: %v", input.Kind)
	}
	return nil
}

func (d *DeVoltRollup) Inspect(env rollmelette.EnvInspector, payload []byte) error {
	parameters := strings.Split(strings.TrimSpace(strings.TrimSuffix(strings.TrimPrefix(string(payload), "/"), "/")), "/")
	switch parameters[0] {
	case "station":
		stationInpectHandlers := inspect_handler.NewStationInspectHandlers(d.StationRepository)
		if len(parameters) == 1 {
			stationInpectHandlers.FindAllStationsInspectHandler(env, parameters)
		} else if len(parameters) == 2 {
			stationInpectHandlers.FindStationByIdInspectHandler(env, parameters)
		} else {
			return fmt.Errorf("invalid payload: %v", payload)
		}
	case "auction":
		auctionInspectHandlers := inspect_handler.NewAuctionInspectHandlers(d.AuctionRepository)
		if len(parameters) == 1 {
			err := auctionInspectHandlers.FindAllAuctionsInspectHandler(env, parameters)
			if err != nil {
				return fmt.Errorf("failed to find all auctions: %w", err)
			}
		} else if len(parameters) == 2 {
			err := auctionInspectHandlers.FindAuctionByIdInspectHandler(env, parameters)
			if err != nil {
				return fmt.Errorf("failed to find auction: %w", err)
			}
		} else {
			return fmt.Errorf("invalid payload: %v", payload)
		}
	case "bid":
		bidInspectHandlers := inspect_handler.NewBidInspectHandlers(d.BidRepository)
		if len(parameters) == 1 {
			err := bidInspectHandlers.FindAllBidsInspectHandler(env, parameters)
			if err != nil {
				return fmt.Errorf("failed to find all bids: %w", err)
			}
		} else if len(parameters) == 2 {
			err := bidInspectHandlers.FindBidByIdInspectHandler(env, parameters)
			if err != nil {
				return fmt.Errorf("failed to find bid: %w", err)
			}
		} else {
			return fmt.Errorf("invalid payload: %v", payload)
		}
	case "user":
		userInspectHandlers := inspect_handler.NewUserInspectHandlers(d.UserRepository)
		if len(parameters) == 1 {
			err := userInspectHandlers.FindAllUsersInspectHandler(env, parameters)
			if err != nil {
				return fmt.Errorf("failed to find all users: %w", err)
			}
		} else if len(parameters) == 2 {
			err := userInspectHandlers.FindUserByIdInspectHandler(env, parameters)
			if err != nil {
				return fmt.Errorf("failed to find user: %w", err)
			}
		} else {
			return fmt.Errorf("invalid payload: %v", payload)
		}
	case "token":
		addressJson, err := json.Marshal(d.TokenAddress)
		if err != nil {
			return fmt.Errorf("failed to marshal addresses: %w", err)
		}
		env.Report(addressJson)
	default:
		return fmt.Errorf("unknown route: %v", string(payload))
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

	//////////////////////// Repositories //////////////////////////
	stationRepository := database.NewStationRepositorySqlite(db)
	userRepository := database.NewUserRepositorySqlite(db)
	auctionRepository := database.NewAuctionRepositorySqlite(db)
	bidRepository := database.NewBidRepositorySqlite(db)

	//////////////////////// Setup Application //////////////////////////
	var addresses *common.Address

	initialOwner := common.HexToAddress("0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266")
	if _, err = user_usecase.NewCreateUserUseCase(userRepository).Execute(&user_usecase.CreateUserInputDTO{
		Address: initialOwner,
		Role:    "admin",
	}); err != nil {
		slog.Error("failed to create initial order", "error", err)
	}

	///////////////////////// Rollmelette //////////////////////////
	ctx := context.Background()
	opts := rollmelette.NewRunOpts()
	app := NewDeVoltRollup(
		userRepository,
		stationRepository,
		auctionRepository,
		bidRepository,
		addresses,
		publicKey,
	)
	err = rollmelette.Run(ctx, opts, app)
	if err != nil {
		slog.Error("application error", "error", err)
	}
}

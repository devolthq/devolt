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
	Addresses         map[string]common.Address
	PublicKey         *ecdsa.PublicKey
}

func NewDeVoltRollup(
	userRepository entity.UserRepository,
	stationRepository entity.StationRepository,
	auctionRepository entity.AuctionRepository,
	bidRepository entity.BidRepository,
	addresses map[string]common.Address,
	publicKey *ecdsa.PublicKey) *DeVoltRollup {
	return &DeVoltRollup{
		UserRepository:    userRepository,
		StationRepository: stationRepository,
		AuctionRepository: auctionRepository,
		BidRepository:     bidRepository,
		Addresses:         addresses,
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
	// TODO: Replace this approach to Cap’n Proto
	var input *dto.AdvaceInputDTO
	err := json.Unmarshal(payload, &input)
	if err != nil {
		return fmt.Errorf("failed to unmarshal input payload: %w", err)
	}

	/////////////////////////// Middleware //////////////////////////

	RBAC := middleware.NewRBACMiddleware(d.UserRepository)

	// ////////////////////////// Handlers //////////////////////////
	stationAdvanceHandlers := advance_handler.NewStationAdvanceHandlers(d.StationRepository)
	governanceAdvanceHandlers := advance_handler.NewGovernanceAdvanceHandlers(d.Addresses, d.UserRepository)

	///////////////////////// Router //////////////////////////
	switch input.Kind {
	case "tokenAddress":
		handler := RBAC.Middleware(governanceAdvanceHandlers.SetTokenAddressAdvanceHandler, "admin")
		if err := handler(env, metadata, deposit, input.Payload); err != nil {
			return fmt.Errorf("failed to set token address: %w", err)
		}
	case "deployerPluginAddress":
		handler := RBAC.Middleware(governanceAdvanceHandlers.SetDeployerPluginAddressAdvanceHandler, "admin")
		if err := handler(env, metadata, deposit, input.Payload); err != nil {
			return fmt.Errorf("failed to set deployer plugin address: %w", err)
		}
	case "grantAdminRole":
		handler := RBAC.Middleware(governanceAdvanceHandlers.GrantAdminRoleAdvanceHandler, "admin")
		if err := handler(env, metadata, deposit, input.Payload); err != nil {
			return fmt.Errorf("failed to grant admin role: %w", err)
		}
	case "revokeAdminRole":
		handler := RBAC.Middleware(governanceAdvanceHandlers.RevokeAdminRoleAdvanceHandler, "admin")
		if err := handler(env, metadata, deposit, input.Payload); err != nil {
			return fmt.Errorf("failed to revoke admin role: %w", err)
		}
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
		if err := stationAdvanceHandlers.UpdateStationAdvanceHandler(env, metadata, deposit, report.Payload); errors.Is(err, sql.ErrNoRows) {
			if err := stationAdvanceHandlers.CreateStationAdvanceHandler(env, metadata, deposit, report.Payload); err != nil {
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
		auctionInpectHandlers := inspect_handler.NewAuctionInspectHandlers(d.AuctionRepository)
		if len(parameters) == 1 {
			err := auctionInpectHandlers.FindAllAuctionsInspectHandler(env, parameters)
			if err != nil {
				return fmt.Errorf("failed to find all auctions: %w", err)
			}
		} else if len(parameters) == 2 {
			err := auctionInpectHandlers.FindAuctionByIdInspectHandler(env, parameters)
			if err != nil {
				return fmt.Errorf("failed to find auction: %w", err)
			}
		} else {
			return fmt.Errorf("invalid payload: %v", payload)
		}
	case "bid":
		bidInpectHandlers := inspect_handler.NewBidInspectHandlers(d.BidRepository)
		if len(parameters) == 1 {
			err := bidInpectHandlers.FindAllBidsInspectHandler(env, parameters)
			if err != nil {
				return fmt.Errorf("failed to find all bids: %w", err)
			}
		} else if len(parameters) == 2 {
			err := bidInpectHandlers.FindBidByIdInspectHandler(env, parameters)
			if err != nil {
				return fmt.Errorf("failed to find bid: %w", err)
			}
		} else {
			return fmt.Errorf("invalid payload: %v", payload)
		}
	case "user":
		userInpectHandlers := inspect_handler.NewUserInspectHandlers(d.UserRepository)
		if len(parameters) == 1 {
			err := userInpectHandlers.FindAllUsersInspectHandler(env, parameters)
			if err != nil {
				return fmt.Errorf("failed to find all users: %w", err)
			}
		} else if len(parameters) == 2 {
			err := userInpectHandlers.FindUserByIdInspectHandler(env, parameters)
			if err != nil {
				return fmt.Errorf("failed to find user: %w", err)
			}
		} else {
			return fmt.Errorf("invalid payload: %v", payload)
		}
	case "address":
		addressesJson, err := json.Marshal(d.Addresses)
		if err != nil {
			return fmt.Errorf("failed to marshal addresses: %w", err)
		}
		env.Report(addressesJson)
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

	deployerPlugin := common.HexToAddress("0x5FbDB2315678afecb367f032d93F642f64180aa3")
	addresses := make(map[string]common.Address)
	addresses["deployerPlugin"] = deployerPlugin

	initialOrder := common.HexToAddress("0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266")
	if _, err = user_usecase.NewCreateUserUseCase(userRepository).Execute(&user_usecase.CreateUserInputDTO{
		Address: initialOrder,
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

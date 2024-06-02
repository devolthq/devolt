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
	"github.com/devolthq/devolt/internal/usecase/dto"
	"github.com/ethereum/go-ethereum/common"
	"github.com/jmoiron/sqlx"
	"github.com/rollmelette/rollmelette"
)

type DeVoltRollup struct {
	State     *sqlx.DB
	Addresses map[string]common.Address
	PublicKey *ecdsa.PublicKey
}

func NewDeVoltRollup(state *sqlx.DB, addresses map[string]common.Address, publicKey *ecdsa.PublicKey) *DeVoltRollup {
	return &DeVoltRollup{
		State:     state,
		Addresses: addresses,
		PublicKey: publicKey,
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
	// ////////////////////////// Repositories //////////////////////////

	stationRepository := database.NewStationRepositorySqlite(d.State)
	userRepository := database.NewUserRepositorySqlite(d.State)

	// ////////////////////////// Handlers //////////////////////////
	stationAdvanceHandlers := advance_handler.NewStationAdvanceHandlers(stationRepository)
	governanceAdvanceHandlers := advance_handler.NewGovernanceAdvanceHandlers(d.Addresses, userRepository)

	///////////////////////// Router //////////////////////////
	switch input.Kind {
	case "tokenAddress":
		log.Printf("Rolling tokenAddress: %v", string(input.Payload))
		if err := governanceAdvanceHandlers.SetTokenAddressAdvanceHandler(env, metadata, deposit, input.Payload); err != nil {
			return fmt.Errorf("failed to set token address: %w", err)
		}
	case "deployerPluginAddress":
		if err := governanceAdvanceHandlers.SetDeployerPluginAddressAdvanceHandler(env, metadata, deposit, input.Payload); err != nil {
			return fmt.Errorf("failed to set deployer plugin address: %w", err)
		}
	case "grantAdminRole":
		if err := governanceAdvanceHandlers.GrantAdminRoleAdvanceHandler(env, metadata, deposit, input.Payload); err != nil {
			return fmt.Errorf("failed to grant admin role: %w", err)
		}
	case "revokeAdminRole":
		if err := governanceAdvanceHandlers.RevokeAdminRoleAdvanceHandler(env, metadata, deposit, input.Payload); err != nil {
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
		stationRepository := database.NewStationRepositorySqlite(d.State)
		stationInpectHandlers := inspect_handler.NewStationInspectHandlers(stationRepository)
		if len(parameters) == 1 {
			stationInpectHandlers.FindAllStationsInspectHandler(env, parameters)
		} else if len(parameters) == 2 {
			stationInpectHandlers.FindStationByIdInspectHandler(env, parameters)
		} else {
			return fmt.Errorf("invalid payload: %v", payload)
		}
	case "auction":
		auctionRepository := database.NewAuctionRepositorySqlite(d.State)
		auctionInpectHandlers := inspect_handler.NewAuctionInspectHandlers(auctionRepository)
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
		bidRepository := database.NewBidRepositorySqlite(d.State)
		bidInpectHandlers := inspect_handler.NewBidInspectHandlers(bidRepository)
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
		userRepository := database.NewUserRepositorySqlite(d.State)
		userInpectHandlers := inspect_handler.NewUserInspectHandlers(userRepository)
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

	//////////////////////// Setup Application //////////////////////////
	deployerPlugin := common.HexToAddress("0x5FbDB2315678afecb367f032d93F642f64180aa3")

	addresses := make(map[string]common.Address)
	addresses["deployerPlugin"] = deployerPlugin

	///////////////////////// Rollmelette //////////////////////////
	ctx := context.Background()
	opts := rollmelette.NewRunOpts()
	app := NewDeVoltRollup(db, addresses, publicKey)
	err = rollmelette.Run(ctx, opts, app)
	if err != nil {
		slog.Error("application error", "error", err)
	}
}

package main

import (
	"context"
	// "crypto/ecdsa"
	"encoding/json"
	"fmt"
	"log"
	"log/slog"
	"github.com/devolthq/devolt/configs"
	// "github.com/ethereum/go-ethereum/common"
	// "github.com/devolthq/devolt/internal/domain/entity"
	// "github.com/devolthq/devolt/internal/infra/repository"
	// "github.com/devolthq/devolt/internal/usecase"
	"github.com/devolthq/devolt/internal/usecase/dto"
	"github.com/rollmelette/rollmelette"
)

type DeVoltRollup struct{}

func NewDeVoltRollup() *DeVoltRollup {
	return &DeVoltRollup{}
}

func (a *DeVoltRollup) Advance(
	env rollmelette.Env,
	metadata rollmelette.Metadata,
	deposit rollmelette.Deposit,
	payload []byte,
) error {
	//////////////////////// Configs //////////////////////////
	_, err := configs.ECDSAPublicKey()
	if err != nil {
		return fmt.Errorf("failed to get public key: %w", err)
	}

	db, err := configs.SetupSQLite()
	if err != nil {
		log.Fatalf("Failed to open and connect to database: %v", err)
	}
	defer db.Close()

	//////////////////////// Decode Input ////////////////////////
	// TODO: Replace this approach to Cap’n Proto
	var input *dto.RollupPayloadInputDTO
	err = json.Unmarshal(payload, &input)
	if err != nil {
		return fmt.Errorf("failed to unmarshal input payload: %w", err)
	}
	
	///////////////////////// Router //////////////////////////
	switch input.Kind {
	case "BuyEnergy":
		log.Printf("Rolling Buy: %v", string(input.Payload))
	case "SellEnergy":
		log.Printf("Rolling Sell: %v", string(input.Payload))
	case "FinishAuction":
		log.Printf("Rolling Finish: %v", string(input.Payload))
	case "DeviceReport":
		log.Printf("Rolling Device: %v", string(input.Payload))
	default:
		return fmt.Errorf("invalid input: %v", input)
	}
	return nil
}

func (a *DeVoltRollup) Inspect(env rollmelette.EnvInspector, payload []byte) error {
	slog.Info("Inspect", "payload", string(payload))
	return nil
}

func main() {
	ctx := context.Background()
	opts := rollmelette.NewRunOpts()
	app := NewDeVoltRollup()
	err := rollmelette.Run(ctx, opts, app)
	if err != nil {
		slog.Error("application error", "error", err)
	}
}

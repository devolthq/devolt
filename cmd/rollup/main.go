package main

import (
	"context"
	"crypto/ecdsa"
	"crypto/x509"
	"encoding/json"
	"encoding/pem"
	"log"
	"log/slog"
	"math/big"
	"os"
	"github.com/rollmelette/rollmelette"
)

type SignedDataInputDTO struct {
	R       *big.Int `json:"r"`
	S       *big.Int `json:"s"`
	Payload []byte   `json:"payload"`
}

type MyApplication struct{}

func (a *MyApplication) Advance(
	env rollmelette.Env,
	metadata rollmelette.Metadata,
	deposit rollmelette.Deposit,
	payload []byte,
) error {
	publicKeyPemData, err := os.ReadFile("./public_key.pem")
	if err != nil {
		panic(err)
	}

	block, _ := pem.Decode(publicKeyPemData)
	if block == nil {
		panic("Falha ao decodificar o bloco PEM")
	}

	publicKey, err := x509.ParsePKIXPublicKey(block.Bytes)
	if err != nil {
			log.Fatalf("Erro ao parsear a chave pública: %v", err)
	}

	var data *SignedDataInputDTO
	if err := json.Unmarshal(payload, &data); err != nil {
		slog.Error("json unmarshal error", "error", err)
		return err
	}
	log.Printf("Advance payload with r: %v and s: %v and payload: %v", data.R, data.S, string(data.Payload))
	valid := ecdsa.Verify(publicKey.(*ecdsa.PublicKey), data.Payload, data.R, data.S)
	log.Printf("Assinatura válida: %t\n", valid)
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
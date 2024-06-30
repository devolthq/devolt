package middleware

import (
	"crypto/ecdsa"
	"encoding/json"
	"fmt"

	"github.com/devolthq/devolt/internal/domain/entity"
	"github.com/devolthq/devolt/pkg/router"
	"github.com/rollmelette/rollmelette"
)

type ECDSAMiddleware struct {
	PublicKey *ecdsa.PublicKey
}

func NewECDSAMiddleware(publicKey *ecdsa.PublicKey) *ECDSAMiddleware {
	return &ECDSAMiddleware{
		PublicKey: publicKey,
	}
}

func (m ECDSAMiddleware) Middleware(handlerFunc router.AdvanceHandlerFunc) router.AdvanceHandlerFunc {
	return func(env rollmelette.Env, metadata rollmelette.Metadata, deposit rollmelette.Deposit, payload []byte) error {
		//TODO: use a transformer instead of this
		var report *entity.Report
		if err := json.Unmarshal(payload, &report); err != nil {
			return fmt.Errorf("failed to unmarshal report: %w", err)
		}
		//////////////////////// Verify Report //////////////////////////
		if valid := ecdsa.Verify(m.PublicKey, report.Payload, report.R, report.S); !valid {
			return fmt.Errorf("invalid report: %v", report)
		}
		return handlerFunc(env, metadata, deposit, report.Payload)
	}
}

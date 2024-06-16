package advance_handler

import (
	"encoding/json"
	"fmt"
	"github.com/ethereum/go-ethereum/common"
	"github.com/rollmelette/rollmelette"
)

type GovernanceAdvanceHandlers struct {
	TokenAddress   *common.Address
}

func NewGovernanceAdvanceHandlers(
	tokenAddress *common.Address,
) *GovernanceAdvanceHandlers {
	return &GovernanceAdvanceHandlers{
		TokenAddress:   tokenAddress,
	}
}

func (h *GovernanceAdvanceHandlers) SetTokenAddress(env rollmelette.Env, metadata rollmelette.Metadata, deposit rollmelette.Deposit, payload []byte) error {
	var NewTokenAddress *common.Address
	if err := json.Unmarshal(payload, &NewTokenAddress); err != nil {
		return err
	}
	h.TokenAddress = NewTokenAddress
	env.Notice([]byte(fmt.Sprintf("token address: %v", NewTokenAddress)))
	return nil
}

// func (h *GovernanceAdvanceHandlers) grantRole(env rollmelette.Env, metadata rollmelette.Metadata, deposit rollmelette.Deposit, payload []byte) error {
// 	return nil
// }

// func (h *GovernanceAdvanceHandlers) revokeRole(env rollmelette.Env, metadata rollmelette.Metadata, deposit rollmelette.Deposit, payload []byte) error {
// 	return nil
// }

// func (h *GovernanceAdvanceHandlers) renounceRole(env rollmelette.Env, metadata rollmelette.Metadata, deposit rollmelette.Deposit, payload []byte) error {
// 	return nil
// }

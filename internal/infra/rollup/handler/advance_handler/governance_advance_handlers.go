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

func (h *GovernanceAdvanceHandlers) SetTokenAddressHandler(env rollmelette.Env, metadata rollmelette.Metadata, deposit rollmelette.Deposit, payload []byte) error {
	var NewTokenAddress *common.Address
	if err := json.Unmarshal(payload, &NewTokenAddress); err != nil {
		return err
	}
	h.TokenAddress = NewTokenAddress
	env.Notice([]byte(fmt.Sprintf("token address: %v", NewTokenAddress)))
	return nil
}

func (h *GovernanceAdvanceHandlers) WithdrawHandler(env rollmelette.Env, metadata rollmelette.Metadata, deposit rollmelette.Deposit, payload []byte) error {
	// first check if msg.sender has the require amount
	// second create 
	return nil
}

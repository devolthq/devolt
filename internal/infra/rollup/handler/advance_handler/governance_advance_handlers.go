package advance_handler

import (
	"encoding/json"
	"fmt"
	"github.com/devolthq/devolt/internal/domain/entity"
	"github.com/devolthq/devolt/internal/usecase/user_usecase"
	"github.com/ethereum/go-ethereum/common"
	"github.com/rollmelette/rollmelette"
)

type GovernanceAdvanceHandlers struct {
	Addresses      *map[string]common.Address
	UserRepository entity.UserRepository
}

func NewGovernanceAdvanceHandlers(
	address map[string]common.Address,
	userRepository entity.UserRepository,
) *GovernanceAdvanceHandlers {
	return &GovernanceAdvanceHandlers{
		Addresses:      &address,
		UserRepository: userRepository,
	}
}

func (h *GovernanceAdvanceHandlers) GrantAdminRoleAdvanceHandler(env rollmelette.Env, metadata rollmelette.Metadata, deposit rollmelette.Deposit, payload []byte) error {
	var input user_usecase.CreateUserInputDTO
	if err := json.Unmarshal(payload, &input); err != nil {
		return fmt.Errorf("failed to unmarshal new User as address: %w", err)
	}
	createUser := user_usecase.NewCreateUserUseCase(h.UserRepository)
	input.Role = "admin"
	res, err := createUser.Execute(&input)
	if err != nil {
		return err
	}
	env.Report([]byte(fmt.Sprintf("granted admin role to: %v with id: %v", res.Address, res.Id)))
	return nil
}

func (h *GovernanceAdvanceHandlers) RevokeAdminRoleAdvanceHandler(env rollmelette.Env, metadata rollmelette.Metadata, deposit rollmelette.Deposit, payload []byte) error {
	var input user_usecase.DeleteUserByAddressInputDTO
	if err := json.Unmarshal(payload, &input); err != nil {
		return fmt.Errorf("failed to unmarshal User as address: %w", err)
	}
	deleteUser := user_usecase.NewDeleteUserByAddressUseCase(h.UserRepository)
	err := deleteUser.Execute(&input)
	if err != nil {
		return err
	}
	env.Report([]byte(fmt.Sprintf("revoked admin role from: %v", metadata.MsgSender)))
	return nil
}

func (h *GovernanceAdvanceHandlers) SetDeployerPluginAddressAdvanceHandler(env rollmelette.Env, metadata rollmelette.Metadata, deposit rollmelette.Deposit, payload []byte) error {
	var NewDeployerPluginAddress common.Address
	if err := json.Unmarshal(payload, &NewDeployerPluginAddress); err != nil {
		return err
	}
	(*h.Addresses)["deployerPlugin"] = NewDeployerPluginAddress
	env.Report([]byte(fmt.Sprintf("set deployer plugin address to: %v", NewDeployerPluginAddress)))
	return nil
}

func (h *GovernanceAdvanceHandlers) SetTokenAddressAdvanceHandler(env rollmelette.Env, metadata rollmelette.Metadata, deposit rollmelette.Deposit, payload []byte) error {
	var NewTokenAddress common.Address
	if err := json.Unmarshal(payload, &NewTokenAddress); err != nil {
		return err
	}
	(*h.Addresses)["token"] = NewTokenAddress
	env.Report([]byte(fmt.Sprintf("set token address to: %v", NewTokenAddress)))
	return nil
}

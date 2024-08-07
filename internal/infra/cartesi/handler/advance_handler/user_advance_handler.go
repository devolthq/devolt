package advance_handler

import (
	"encoding/json"
	"fmt"

	"github.com/devolthq/devolt/internal/domain/entity"
	"github.com/devolthq/devolt/internal/usecase/contract_usecase"
	"github.com/devolthq/devolt/internal/usecase/user_usecase"
	"github.com/rollmelette/rollmelette"
)

type UserAdvanceHandlers struct {
	UserRepository     entity.UserRepository
	ContractRepository entity.ContractRepository
}

func NewUserAdvanceHandlers(userRepository entity.UserRepository, contractRepository entity.ContractRepository) *UserAdvanceHandlers {
	return &UserAdvanceHandlers{
		UserRepository:     userRepository,
		ContractRepository: contractRepository,
	}
}

func (h *UserAdvanceHandlers) CreateUserHandler(env rollmelette.Env, metadata rollmelette.Metadata, deposit rollmelette.Deposit, payload []byte) error {
	var input user_usecase.CreateUserInputDTO
	if err := json.Unmarshal(payload, &input); err != nil {
		return err
	}
	createUser := user_usecase.NewCreateUserUseCase(h.UserRepository)
	res, err := createUser.Execute(&input, metadata)
	if err != nil {
		return err
	}
	env.Notice([]byte(fmt.Sprintf("created user with address: %v and role: %v", res.Address.Address, res.Role)))
	return nil
}

func (h *UserAdvanceHandlers) UpdateUserHandler(env rollmelette.Env, metadata rollmelette.Metadata, deposit rollmelette.Deposit, payload []byte) error {
	var input user_usecase.UpdateUserInputDTO
	if err := json.Unmarshal(payload, &input); err != nil {
		return fmt.Errorf("failed to unmarshal input: %w", err)
	}
	updateUser := user_usecase.NewUpdateUserUseCase(h.UserRepository)
	res, err := updateUser.Execute(&input, metadata)
	if err != nil {
		return err
	}
	env.Notice([]byte(fmt.Sprintf("updated user with address: %v and role: %v", res.Address.Address, res.Role)))
	return nil
}

func (h *UserAdvanceHandlers) DeleteUserByAddressHandler(env rollmelette.Env, metadata rollmelette.Metadata, deposit rollmelette.Deposit, payload []byte) error {
	var input user_usecase.DeleteUserByAddressInputDTO
	if err := json.Unmarshal(payload, &input); err != nil {
		return fmt.Errorf("failed to unmarshal input: %w", err)
	}
	deleteUserByAddress := user_usecase.NewDeleteUserByAddressUseCase(h.UserRepository)
	err := deleteUserByAddress.Execute(&input)
	if err != nil {
		return err
	}
	env.Notice([]byte(fmt.Sprintf("deleted user with address: %v", input.Address.Address)))
	return nil
}

func (h *UserAdvanceHandlers) WithdrawAppHandler(env rollmelette.Env, metadata rollmelette.Metadata, deposit rollmelette.Deposit, payload []byte) error {
	application, isDefined := env.AppAddress()
	if !isDefined {
		return fmt.Errorf("no application address defined yet, contact the DeVolt support")
	}
	findContractBySymbol := contract_usecase.NewFindContractBySymbolUseCase(h.ContractRepository)
	volt, err := findContractBySymbol.Execute(&contract_usecase.FindContractBySymbolInputDTO{Symbol: "VOLT"})
	if err != nil {
		return err
	}
	stablecoin, err := findContractBySymbol.Execute(&contract_usecase.FindContractBySymbolInputDTO{Symbol: "STABLECOIN"})
	if err != nil {
		return err
	}
	voltBalance := env.ERC20BalanceOf(volt.Address.Address, application)
	if voltBalance.Sign() == 0 {
		return fmt.Errorf("no balance of %v to withdraw", volt.Symbol)
	}
	stablecoinBalance := env.ERC20BalanceOf(stablecoin.Address.Address, application)
	if stablecoinBalance.Sign() == 0 {
		return fmt.Errorf("no balance of %v to withdraw", stablecoin.Symbol)
	}
	voltVoucherIndex, err := env.ERC20Withdraw(volt.Address.Address, application, voltBalance)
	if err != nil {
		return err
	}
	stablecoinVoucherIndex, err := env.ERC20Withdraw(stablecoin.Address.Address, application, stablecoinBalance)
	if err != nil {
		return err
	}
	env.Notice([]byte(fmt.Sprintf("withdrawn %v %v and %v %v from %v with voucher index of $VOLT: %v and $STABLECOIN: %v", volt.Symbol, voltBalance, stablecoin.Symbol, stablecoinBalance, metadata.MsgSender, voltVoucherIndex, stablecoinVoucherIndex)))
	return nil
}

func (h *UserAdvanceHandlers) WithdrawStablecoinHandler(env rollmelette.Env, metadata rollmelette.Metadata, deposit rollmelette.Deposit, payload []byte) error {
	findContractBySymbol := contract_usecase.NewFindContractBySymbolUseCase(h.ContractRepository)
	stablecoin, err := findContractBySymbol.Execute(&contract_usecase.FindContractBySymbolInputDTO{Symbol: "STABLECOIN"})
	if err != nil {
		return err
	}
	stablecoinBalance := env.ERC20BalanceOf(stablecoin.Address.Address, metadata.MsgSender)
	if stablecoinBalance.Sign() == 0 {
		return fmt.Errorf("no balance of %v to withdraw", stablecoin.Symbol)
	}
	stablecoinVoucherIndex, err := env.ERC20Withdraw(stablecoin.Address.Address, metadata.MsgSender, stablecoinBalance)
	if err != nil {
		return err
	}
	env.Notice([]byte(fmt.Sprintf("withdrawn %v and %v from %v with voucher index: %v", stablecoin.Symbol, stablecoinBalance, metadata.MsgSender, stablecoinVoucherIndex)))
	return nil
}

func (h *UserAdvanceHandlers) WithdrawVoltHandler(env rollmelette.Env, metadata rollmelette.Metadata, deposit rollmelette.Deposit, payload []byte) error {
	findContractBySymbol := contract_usecase.NewFindContractBySymbolUseCase(h.ContractRepository)
	volt, err := findContractBySymbol.Execute(&contract_usecase.FindContractBySymbolInputDTO{Symbol: "VOLT"})
	if err != nil {
		return err
	}
	voltBalance := env.ERC20BalanceOf(volt.Address.Address, metadata.MsgSender)
	if voltBalance.Sign() == 0 {
		return fmt.Errorf("no balance of %v to withdraw", volt.Symbol)
	}
	voltVoucherIndex, err := env.ERC20Withdraw(volt.Address.Address, metadata.MsgSender, voltBalance)
	if err != nil {
		return err
	}
	env.Notice([]byte(fmt.Sprintf("withdrawn %v and %v from %v with voucher index: %v", volt.Symbol, voltBalance, metadata.MsgSender, voltVoucherIndex)))
	return nil
}

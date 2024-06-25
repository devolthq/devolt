package inspect_handler

import (
	"context"
	"encoding/json"
	"fmt"

	"github.com/devolthq/devolt/internal/domain/entity"
	"github.com/devolthq/devolt/internal/usecase/user_usecase"
	"github.com/rollmelette/rollmelette"
)

type UserInspectHandlers struct {
	UserRepository entity.UserRepository
}

func NewUserInspectHandlers(userRepository entity.UserRepository) *UserInspectHandlers {
	return &UserInspectHandlers{
		UserRepository: userRepository,
	}
}

func (h *UserInspectHandlers) FindUserByIdInspectHandler(env rollmelette.EnvInspector, ctx context.Context) error {	
	findUserById := user_usecase.NewFindUserByIdUseCase(h.UserRepository)
	res, err := findUserById.Execute(&user_usecase.FindUserByIdInputDTO{
		Id: ctx.Value("id").(int),})
	if err != nil {
		return fmt.Errorf("failed to find User: %w", err)
	}
	User, err := json.Marshal(res)
	if err != nil {
		return fmt.Errorf("failed to marshal User: %w", err)
	}
	env.Report(User)
	return nil
}

func (h *UserInspectHandlers) FindUserByAddressInspectHandler(env rollmelette.EnvInspector, payload []string) error {
	var input user_usecase.FindUserByAddressInputDTO
	if err := json.Unmarshal([]byte(payload[1]), &input.Address); err != nil {
		return fmt.Errorf("invalid payload: %v", payload)
	}
	findUserByAddress := user_usecase.NewFindUserByAddressUseCase(h.UserRepository)
	res, err := findUserByAddress.Execute(&input)
	if err != nil {
		return fmt.Errorf("failed to find User: %w", err)
	}
	User, err := json.Marshal(res)
	if err != nil {
		return fmt.Errorf("failed to marshal User: %w", err)
	}
	env.Report(User)
	return nil
}

func (h *UserInspectHandlers) FindAllUsersInspectHandler(env rollmelette.EnvInspector, payload []string) error {
	findAllUsers := user_usecase.NewFindAllUsersUseCase(h.UserRepository)
	res, err := findAllUsers.Execute()
	if err != nil {
		return fmt.Errorf("failed to find all Users: %w", err)
	}
	allUsers, err := json.Marshal(res)
	if err != nil {
		return fmt.Errorf("failed to marshal all Users: %w", err)
	}
	env.Report(allUsers)
	return nil
}

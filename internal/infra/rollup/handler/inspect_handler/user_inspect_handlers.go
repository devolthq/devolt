package inspect_handler

import (
	// "context"
	"context"
	"encoding/json"
	"fmt"

	"github.com/devolthq/devolt/internal/domain/entity"
	"github.com/devolthq/devolt/internal/usecase/user_usecase"
	"github.com/devolthq/devolt/pkg/rollmelette_router"
	"github.com/ethereum/go-ethereum/common"
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

// func (h *UserInspectHandlers) FindUserByIdInspectHandler(env rollmelette.EnvInspector, ctx context.Context) error {
// 	findUserById := user_usecase.NewFindUserByIdUseCase(h.UserRepository)
// 	res, err := findUserById.Execute(&user_usecase.FindUserByIdInputDTO{
// 		Id: ctx.Value("id").(int),})
// 	if err != nil {
// 		return fmt.Errorf("failed to find User: %w", err)
// 	}
// 	User, err := json.Marshal(res)
// 	if err != nil {
// 		return fmt.Errorf("failed to marshal User: %w", err)
// 	}
// 	env.Report(User)
// 	return nil
// }

func (h *UserInspectHandlers) FindUserByAddressInspectHandler(env rollmelette.EnvInspector, ctx context.Context) error {
	findUserByAddress := user_usecase.NewFindUserByAddressUseCase(h.UserRepository)
	res, err := findUserByAddress.Execute(&user_usecase.FindUserByAddressInputDTO{
		Address: common.BytesToAddress([]byte(rollmelette_router.PathValue(ctx, "address"))),
	})
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

func (h *UserInspectHandlers) FindAllUsersInspectHandler(env rollmelette.EnvInspector, ctx context.Context) error {
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

package middleware

import (
	"database/sql"
	"errors"
	"fmt"

	"github.com/devolthq/devolt/internal/domain/entity"
	"github.com/devolthq/devolt/internal/usecase/user_usecase"
	"github.com/devolthq/devolt/pkg/router"
	"github.com/rollmelette/rollmelette"
)

type RBACMiddleware struct {
	UserRepository entity.UserRepository
}

func NewRBACMiddleware(userRepository entity.UserRepository) *RBACMiddleware {
	return &RBACMiddleware{
		UserRepository: userRepository,
	}
}

func (m *RBACMiddleware) Middleware(handlerFunc router.AdvanceHandlerFunc, role string) router.AdvanceHandlerFunc {
	return func(env rollmelette.Env, metadata rollmelette.Metadata, deposit rollmelette.Deposit, payload []byte) error {
		findUserByAddress := user_usecase.NewFindUserByAddressUseCase(m.UserRepository)
		user, err := findUserByAddress.Execute(&user_usecase.FindUserByAddressInputDTO{
			Address: metadata.MsgSender,
		})
		if err != nil {
			if errors.Is(err, sql.ErrNoRows) {
				return fmt.Errorf("user not found during RBAC middleware check")
			}
			return err
		}
		if user.Role == role { 
			return fmt.Errorf("user don't have necessary permission: %v", role)
		}
		return handlerFunc(env, metadata, deposit, payload)
	}
}
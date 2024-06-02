package user_usecase

import (
	"github.com/devolthq/devolt/internal/domain/entity"
	"github.com/ethereum/go-ethereum/common"
)

type CreateUserInputDTO struct {
	Role    string         `json:"role"`
	Address common.Address `json:"address"`
}

type CreateUserOutputDTO struct {
	Id      int            `json:"id"`
	Role    string         `json:"role"`
	Address common.Address `json:"address"`
}

type CreateUserUseCase struct {
	UserRepository entity.UserRepository
}

func NewCreateUserUseCase(userRepository entity.UserRepository) *CreateUserUseCase {
	return &CreateUserUseCase{
		UserRepository: userRepository,
	}
}

func (u *CreateUserUseCase) Execute(input *CreateUserInputDTO) (*CreateUserOutputDTO, error) {
	User := entity.NewUser(input.Role,input.Address)
	res, err := u.UserRepository.CreateUser(User)
	if err != nil {
		return nil, err
	}
	return &CreateUserOutputDTO{
		Id:      res.Id,
		Role:    res.Role,
		Address: res.Address,
	}, nil
}
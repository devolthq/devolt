package user_usecase

import (
	"github.com/devolthq/devolt/internal/domain/entity"
	"github.com/ethereum/go-ethereum/common"
)

type FindUserByIdInputDTO struct {
	Id int `json:"id"`
}

type FindUserByIdOutputDTO struct {
	Id      int            `json:"id"`
	Address common.Address `json:"address"`
}


type FindUserByIdUseCase struct {
	UserRepository entity.UserRepository
}

func NewFindUserByIdUseCase(userRepository entity.UserRepository) *FindUserByIdUseCase {
	return &FindUserByIdUseCase{
		UserRepository: userRepository,
	}
}

func (u *FindUserByIdUseCase) Execute(input *FindUserByIdInputDTO) (*FindUserByIdOutputDTO, error) {
	res, err := u.UserRepository.FindUserById(input.Id)
	if err != nil {
		return nil, err
	}
	return &FindUserByIdOutputDTO{
		Id:      res.Id,
		Address: res.Address,
	}, nil
}
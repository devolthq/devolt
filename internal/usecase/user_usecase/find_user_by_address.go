package user_usecase


import (
	"github.com/devolthq/devolt/internal/domain/entity"
	"github.com/ethereum/go-ethereum/common"
)

type FindUserByAddressInputDTO struct {
	Address common.Address `json:"address"`
}

type FindUserByAddressOutputDTO struct {
	Id      int            `json:"id"`
	Address common.Address `json:"address"`
}


type FindUserByAddressUseCase struct {
	UserRepository entity.UserRepository
}

func NewFindUserByAddressUseCase(userRepository entity.UserRepository) *FindUserByAddressUseCase {
	return &FindUserByAddressUseCase{
		UserRepository: userRepository,
	}
}

func (u *FindUserByAddressUseCase) Execute(input *FindUserByAddressInputDTO) (*FindUserByAddressOutputDTO, error) {
	res, err := u.UserRepository.FindUserByAddress(input.Address)
	if err != nil {
		return nil, err
	}
	return &FindUserByAddressOutputDTO{
		Id:      res.Id,
		Address: res.Address,
	}, nil
}
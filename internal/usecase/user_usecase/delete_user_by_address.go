package user_usecase

import (
	"github.com/devolthq/devolt/internal/domain/entity"
	"github.com/ethereum/go-ethereum/common"
)

type DeleteUserByAddressInputDTO struct {
	Address common.Address
}

type DeleteUserByAddressUseCase struct {
	UserRepository entity.UserRepository
}

func NewDeleteUserByAddressUseCase(userRepository entity.UserRepository) *DeleteUserByAddressUseCase {
	return &DeleteUserByAddressUseCase{
		UserRepository: userRepository,
	}
}

func (u *DeleteUserByAddressUseCase) Execute(input *DeleteUserByAddressInputDTO) error {
	return u.UserRepository.DeleteUserByAddress(input.Address)
}
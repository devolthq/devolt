package user_usecase

import (
	"github.com/devolthq/devolt/internal/domain/entity"
)

type FindAllUsersOutputDTO []*FindUserByAddressOutputDTO

type FindAllUsersUseCase struct {
	UserRepository entity.UserRepository
}

func NewFindAllUsersUseCase(userRepository entity.UserRepository) *FindAllUsersUseCase {
	return &FindAllUsersUseCase{
		UserRepository: userRepository,
	}
}

func (u *FindAllUsersUseCase) Execute() (*FindAllUsersOutputDTO, error) {
	res, err := u.UserRepository.FindAllUsers()
	if err != nil {
		return nil, err
	}
	output := make(FindAllUsersOutputDTO, len(res))
	for i, user := range res {
		output[i] = &FindUserByAddressOutputDTO{
			Address: user.Address,
		}
	}
	return &output, nil
}
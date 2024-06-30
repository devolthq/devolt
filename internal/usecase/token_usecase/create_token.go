package token_usecase

import (
	"github.com/devolthq/devolt/internal/domain/entity"
	"github.com/ethereum/go-ethereum/common"
)

type CreateTokenInputDTO struct {
	Symbol    string         `json:"symbol" db:"symbol"`
	Address   common.Address `json:"address" db:"address"`
	CreatedAt int64          `json:"created_at" db:"created_at"`
}

type CreateTokenOutputDTO struct {
	Id        int            `json:"id" db:"id"`
	Symbol    string         `json:"symbol" db:"symbol"`
	Address   common.Address `json:"address" db:"address"`
	CreatedAt int64          `json:"created_at" db:"created_at"`
}

type CreateTokenUseCase struct {
	TokenRepository entity.TokenRepository
}

func NewCreateTokenUseCase(tokenRepository entity.TokenRepository) *CreateTokenUseCase {
	return &CreateTokenUseCase{
		TokenRepository: tokenRepository,
	}
}

func (s *CreateTokenUseCase) Execute(input *CreateTokenInputDTO) (*CreateTokenOutputDTO, error) {
	token := entity.NewToken(input.Symbol, input.Address, input.CreatedAt)
	res, err := s.TokenRepository.CreateToken(token)
	if err != nil {
		return nil, err
	}
	output := &CreateTokenOutputDTO{
		Id:        res.Id,
		Symbol:    res.Symbol,
		Address:   res.Address,
		CreatedAt: res.CreatedAt,
	}
	return output, nil
}

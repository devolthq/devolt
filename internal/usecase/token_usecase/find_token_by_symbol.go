package token_usecase

import (
	"github.com/devolthq/devolt/internal/domain/entity"
	"github.com/ethereum/go-ethereum/common"
)

type FindTokenBySymbolInputDTO struct {
	Symbol string
}

type FindTokenBySymbolOutputDTO struct {
	Id        int            `json:"id" db:"id"`
	Symbol    string         `json:"symbol" db:"symbol"`
	Address   common.Address `json:"address" db:"address"`
	CreatedAt int64          `json:"created_at" db:"created_at"`
	UpdatedAt int64          `json:"updated_at" db:"updated_at"`
}

type FindTokenBySymbolUseCase struct {
	TokenRepository entity.TokenRepository
}

func NewFindTokenBySymbolUseCase(tokenRepository entity.TokenRepository) *FindTokenBySymbolUseCase {
	return &FindTokenBySymbolUseCase{
		TokenRepository: tokenRepository,
	}
}

func (s *FindTokenBySymbolUseCase) Execute(input *FindTokenBySymbolInputDTO) (*FindTokenBySymbolOutputDTO, error) {
	token, err := s.TokenRepository.FindTokenBySymbol(input.Symbol)
	if err != nil {
		return nil, err
	}
	return &FindTokenBySymbolOutputDTO{
		Id:        token.Id,
		Symbol:    token.Symbol,
		Address:   token.Address,
		CreatedAt: token.CreatedAt,
		UpdatedAt: token.UpdatedAt,
	}, nil
}


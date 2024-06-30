package token_usecase

import (
	"github.com/devolthq/devolt/internal/domain/entity"
	"github.com/ethereum/go-ethereum/common"
)

type UpdateTokenInputDTO struct {
	Id        int            `json:"id"`
	Address   common.Address `json:"address"`
	Symbol    string         `json:"symbol"`
	UpdatedAt int64          `json:"updated_at"`
}

type UpdateTokenOutputDTO struct {
	Id        int            `json:"id"`
	Symbol    string         `json:"symbol"`
	Address   common.Address `json:"address"`
	UpdatedAt int64          `json:"updated_at"`
}

type UpdateTokenUseCase struct {
	TokenReposiotry entity.TokenRepository
}

func NewUpdateTokenUseCase(tokenRepository entity.TokenRepository) *UpdateTokenUseCase {
	return &UpdateTokenUseCase{
		TokenReposiotry: tokenRepository,
	}
}

func (s *UpdateTokenUseCase) Execute(input *UpdateTokenInputDTO) (*UpdateTokenOutputDTO, error) {
	token, err := s.TokenReposiotry.UpdateToken(&entity.Token{
		Id:        input.Id,
		Address:   input.Address,
		Symbol:    input.Symbol,
		UpdatedAt: input.UpdatedAt,
	})
	if err != nil {
		return nil, err
	}
	return &UpdateTokenOutputDTO{
		Id:        token.Id,
		Symbol:    token.Symbol,
		Address:   token.Address,
		UpdatedAt: token.UpdatedAt,
	}, nil
}
package token_usecase

import "github.com/devolthq/devolt/internal/domain/entity"

type DeleteTokenInputDTO struct {
	Symbol string
}

type DeleteTokenUseCase struct {
	TokenReposiotry entity.TokenRepository
}

func NewDeleteTokenUseCase(tokenRepository entity.TokenRepository) *DeleteTokenUseCase {
	return &DeleteTokenUseCase{
		TokenReposiotry: tokenRepository,
	}
}

func (s *DeleteTokenUseCase) Execute(input *DeleteTokenInputDTO) error {
	return s.TokenReposiotry.DeleteToken(input.Symbol)
}

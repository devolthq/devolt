package token_usecase

import "github.com/devolthq/devolt/internal/domain/entity"

type FindAllTokensOutputDTO []*FindTokenOutputDTO

type FindAllTokensUsecase struct {
	TokenRepository entity.TokenRepository
}

func NewFindAllTokensUseCase(tokenRepository entity.TokenRepository) *FindAllTokensUsecase {
	return &FindAllTokensUsecase{
		TokenRepository: tokenRepository,
	}
}

func (s *FindAllTokensUsecase) Execute() (FindAllTokensOutputDTO, error) {
	res, err := s.TokenRepository.FindAllTokens()
	if err != nil {
		return nil, err
	}
	output := make([]*FindTokenOutputDTO, 0, len(res))
	for i, token := range res {
		output[i] = &FindTokenOutputDTO{
			Id:        token.Id,
			Symbol:    token.Symbol,
			Address:   token.Address,
			CreatedAt: token.CreatedAt,
			UpdatedAt: token.UpdatedAt,
		}
	}
	return output, nil
}
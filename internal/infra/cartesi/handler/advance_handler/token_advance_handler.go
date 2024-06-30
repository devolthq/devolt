package advance_handler

import (
	"encoding/json"
	"fmt"

	"github.com/devolthq/devolt/internal/domain/entity"
	"github.com/devolthq/devolt/internal/usecase/token_usecase"
	"github.com/rollmelette/rollmelette"
)

type TokenAdvanceHandlers struct {
	TokenRepository entity.TokenRepository
}

func NewTokenAdvanceHandlers(tokenRepository entity.TokenRepository) *TokenAdvanceHandlers {
	return &TokenAdvanceHandlers{
		TokenRepository: tokenRepository,
	}
}

func (h *TokenAdvanceHandlers) CreateTokenHandler(env rollmelette.Env, metadata rollmelette.Metadata, deposit rollmelette.Deposit, payload []byte) error {
	var input token_usecase.CreateTokenInputDTO
	if err := json.Unmarshal(payload, &input); err != nil {
		return err
	}
	input.CreatedAt = metadata.BlockTimestamp
	createToken := token_usecase.NewCreateTokenUseCase(h.TokenRepository)
	res, err := createToken.Execute(&input)
	if err != nil {
		return err
	}
	env.Report([]byte(fmt.Sprintf("created token with symbol: %v and address: %v", res.Symbol, res.Address)))
	return nil
}

func (h *TokenAdvanceHandlers) UpdateTokenHandler(env rollmelette.Env, metadata rollmelette.Metadata, deposit rollmelette.Deposit, payload []byte) error {
	var input token_usecase.UpdateTokenInputDTO
	if err := json.Unmarshal(payload, &input); err != nil {
		return err
	}
	input.UpdatedAt = metadata.BlockTimestamp
	updateToken := token_usecase.NewUpdateTokenUseCase(h.TokenRepository)
	res, err := updateToken.Execute(&input)
	if err != nil {
		return err
	}
	env.Report([]byte(fmt.Sprintf("updated token with symbol: %v and address: %v", res.Symbol, res.Address)))
	return nil
}

func (h *TokenAdvanceHandlers) DeleteTokenHandler(env rollmelette.Env, metadata rollmelette.Metadata, deposit rollmelette.Deposit, payload []byte) error {
	var input token_usecase.DeleteTokenInputDTO
	if err := json.Unmarshal(payload, &input); err != nil {
		return err
	}
	deleteToken := token_usecase.NewDeleteTokenUseCase(h.TokenRepository)
	err := deleteToken.Execute(&input)
	if err != nil {
		return err
	}
	env.Report([]byte(fmt.Sprintf("deleted token with symbol: %v", input.Symbol)))
	return nil
}
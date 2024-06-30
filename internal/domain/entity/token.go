package entity

import (
	"github.com/ethereum/go-ethereum/common"
)

type TokenRepository interface {
	CreateToken(token *Token) (*Token, error)
	FindAllTokens() ([]*Token, error)
	FindTokenBySymbol(symbol string) (*Token, error)
	UpdateToken(token *Token) (*Token, error)
	DeleteToken(symbol string) error
}

type Token struct {
	Id        int            `json:"id" db:"id"`
	Symbol    string         `json:"symbol" db:"symbol"`
	Address   common.Address `json:"address" db:"address"`
	CreatedAt int64          `json:"created_at" db:"created_at"`
	UpdatedAt int64          `json:"updated_at" db:"updated_at"`
}

func NewToken(symbol string, address common.Address, createdAt int64) *Token {
	return &Token{
		Symbol:  symbol,
		Address: address,
		CreatedAt: createdAt,
	}
}

package token_usecase

import "github.com/ethereum/go-ethereum/common"

type FindTokenOutputDTO struct {
	Id        int            `json:"id" db:"id"`
	Symbol    string         `json:"symbol" db:"symbol"`
	Address   common.Address `json:"address" db:"address"`
	CreatedAt int64          `json:"created_at" db:"created_at"`
	UpdatedAt int64          `json:"updated_at" db:"updated_at"`
}

package auction_usecase

import "github.com/holiman/uint256"

type FindAuctionOutputDTO struct {
	Id         int         `json:"id"`
	Credits    uint256.Int `json:"credits"`
	PriceLimit uint256.Int `json:"price_limit"`
	State      string      `json:"state"`
	ExpiresAt  int64       `json:"expires_at"`
	CreatedAt  int64       `json:"created_at"`
	UpdatedAt  int64       `json:"updated_at"`
}

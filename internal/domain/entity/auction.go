package entity

import (
	"github.com/holiman/uint256"
)

type AuctionRepository interface {
	CreateAuction(auction *Auction) (*Auction, error)
	FindAuctionById(id int) (*Auction, error)
	FindAllAuctions() ([]*Auction, error)
	UpdateAuction(auction *Auction) (*Auction, error)
	DeleteAuction(id int) error
}

type Auction struct {
	Id         int         `json:"id" db:"id"`
	Credits    uint256.Int `json:"credits" db:"credits"`
	PriceLimit uint256.Int `json:"price_limit" db:"price_limit"`
	State      string      `json:"state" db:"state"`
	ExpiresAt  int64       `json:"expires_at" db:"expires_at"`
	CreatedAt  int64       `json:"created_at" db:"created_at"`
	UpdatedAt  int64       `json:"updated_at" db:"updated_at"`
}

func NewAuction(credits uint256.Int, priceLimit uint256.Int, state string, expires_at int64, createdAt int64) *Auction {
	return &Auction{
		Credits:    credits,
		PriceLimit: priceLimit,
		State:      state,
		ExpiresAt:  expires_at,
		CreatedAt:  createdAt,
	}
}

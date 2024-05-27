package entity

import (
	"github.com/ethereum/go-ethereum/common"
	"github.com/holiman/uint256"
)

type BidRepository interface {
	CreateBid(bid *Bid) (*Bid, error)
	FindBidById(id int) (*Bid, error)
	FindAllBids() ([]*Bid, error)
	UpdateBid(bid *Bid) (*Bid, error)
	DeleteBid(id int) error
}

type Bid struct {
	Id        int            `json:"id"`
	AuctionId int            `json:"auction_id"`
	Bidder    common.Address `json:"bidder"`
	Credits   uint256.Int    `json:"credits"`
	Price     uint256.Int    `json:"price"`
	State     string       `json:"state"`
	CreatedAt int64          `json:"created_at"`
	UpdatedAt int64          `json:"updated_at"`
}

func NewBid(bidder common.Address, credits uint256.Int, price uint256.Int, state string, createdAt int64) *Bid {
	return &Bid{
		Bidder:    bidder,
		Credits:   credits,
		Price:     price,
		State:     state,
		CreatedAt: createdAt,
	}
}

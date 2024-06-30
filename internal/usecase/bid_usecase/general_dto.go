package bid_usecase

import (
	"github.com/ethereum/go-ethereum/common"
	"github.com/holiman/uint256"
)

type FindBidOutputDTO struct {
	Id        int            `json:"id"`
	AuctionId int            `json:"auction_id"`
	Bidder    common.Address `json:"bidder"`
	Credits   uint256.Int    `json:"credits"`
	Price     uint256.Int    `json:"price"`
	State     string         `json:"state"`
	CreatedAt int64          `json:"created_at"`
	UpdatedAt int64          `json:"updated_at"`
}

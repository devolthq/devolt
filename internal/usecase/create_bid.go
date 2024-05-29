package usecase

import (
	"github.com/devolthq/devolt/internal/domain/entity"
	"github.com/ethereum/go-ethereum/common"
	"github.com/holiman/uint256"
)

type CreateBidInputDTO struct {
	AuctionId int     `json:"auction_id"`
	Bidder    common.Address  `json:"bidder"`
	Credits   uint256.Int `json:"credits"`
	Price     uint256.Int `json:"price"`
	State     string  `json:"state"`
	CreatedAt int64   `json:"created_at"`
}

type CreateBidOutputDTO struct {
	Id        int            `json:"id"`
	AuctionId int            `json:"auction_id"`
	Bidder    common.Address `json:"bidder"`
	Credits   uint256.Int    `json:"credits"`
	Price     uint256.Int    `json:"price"`
	State     string         `json:"state"`
	CreatedAt int64          `json:"created_at"`
}

type CreateBidUseCase struct {
	BidRepository entity.BidRepository
}

func NewCreateBidUseCase(bidRepository entity.BidRepository) *CreateBidUseCase {
	return &CreateBidUseCase{
		BidRepository: bidRepository,
	}
}

func (c *CreateBidUseCase) Execute(input *CreateBidInputDTO) (*CreateBidOutputDTO, error) {
	bid := entity.NewBid(input.Bidder, input.Credits, input.Price, input.State, input.CreatedAt)
	res, err := c.BidRepository.CreateBid(bid)
	if err != nil {
		return nil, err
	}
	return &CreateBidOutputDTO{
		Id:        res.Id,
		AuctionId: res.AuctionId,
		Bidder:    res.Bidder,
		Credits:   res.Credits,
		Price:     res.Price,
		State:     res.State,
		CreatedAt: res.CreatedAt,
	}, nil
}
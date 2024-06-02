package bid_usecase

import (
	"github.com/devolthq/devolt/internal/domain/entity"
	"github.com/ethereum/go-ethereum/common"
	"github.com/holiman/uint256"
)

type FindBidByIdInputDTO struct {
	Id int `json:"id"`
}

type FindBidByIdOutputDTO struct {
	Id        int            `json:"id"`
	AuctionId int            `json:"auction_id"`
	Bidder    common.Address `json:"bidder"`
	Credits   uint256.Int    `json:"credits"`
	Price     uint256.Int    `json:"price"`
	State     string         `json:"state"`
	CreatedAt int64          `json:"created_at"`
	UpdatedAt int64          `json:"updated_at"`
}

type FindBidByIdUseCase struct {
	BidRepository entity.BidRepository
}

func NewFindBidByIdUseCase(bidRepository entity.BidRepository) *FindBidByIdUseCase {
	return &FindBidByIdUseCase{
		BidRepository: bidRepository,
	}
}

func (c *FindBidByIdUseCase) Execute(input *FindBidByIdInputDTO) (*FindBidByIdOutputDTO, error) {
	res, err := c.BidRepository.FindBidById(input.Id)
	if err != nil {
		return nil, err
	}
	return &FindBidByIdOutputDTO{
		Id:        res.Id,
		AuctionId: res.AuctionId,
		Bidder:    res.Bidder,
		Credits:   res.Credits,
		Price:     res.Price,
		State:     res.State,
		CreatedAt: res.CreatedAt,
		UpdatedAt: res.UpdatedAt,
	}, nil
}

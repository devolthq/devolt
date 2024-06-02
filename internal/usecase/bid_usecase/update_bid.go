package bid_usecase

import (
	"github.com/devolthq/devolt/internal/domain/entity"
	"github.com/ethereum/go-ethereum/common"
	"github.com/holiman/uint256"
)

type UpdateBidInputDTO struct {
	Id        int            `json:"id"`
	AuctionId int            `json:"auction_id"`
	Bidder    common.Address `json:"bidder"`
	Credits   uint256.Int    `json:"credits"`
	Price     uint256.Int    `json:"price"`
	State     string         `json:"state"`
	UpdatedAt int64          `json:"updated_at"`
}

type UpdateBidOutputDTO struct {
	Id        int            `json:"id"`
	AuctionId int            `json:"auction_id"`
	Bidder    common.Address `json:"bidder"`
	Credits   uint256.Int    `json:"credits"`
	Price     uint256.Int    `json:"price"`
	State     string         `json:"state"`
	UpdatedAt int64          `json:"updated_at"`
}

type UpdateBidUseCase struct {
	BidRepository entity.BidRepository
}

func NewUpdateBidUseCase(bidRepository entity.BidRepository) *UpdateBidUseCase {
	return &UpdateBidUseCase{
		BidRepository: bidRepository,
	}
}

func (c *UpdateBidUseCase) Execute(input *UpdateBidInputDTO) (*UpdateBidOutputDTO, error) {
	res, err := c.BidRepository.UpdateBid(&entity.Bid{
		Id:        input.Id,
		AuctionId: input.AuctionId,
		Bidder:    input.Bidder,
		Credits:   input.Credits,
		Price:     input.Price,
		State:     input.State,
		UpdatedAt: input.UpdatedAt,
	})
	if err != nil {
		return nil, err
	}
	return &UpdateBidOutputDTO{
		Id:        res.Id,
		AuctionId: res.AuctionId,
		Bidder:    res.Bidder,
		Credits:   res.Credits,
		Price:     res.Price,
		State:     res.State,
		UpdatedAt: res.UpdatedAt,
	}, nil
}
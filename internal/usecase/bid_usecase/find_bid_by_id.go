package bid_usecase

import (
	"github.com/devolthq/devolt/internal/domain/entity"
)

type FindBidByIdInputDTO struct {
	Id int `json:"id"`
}

type FindBidByIdUseCase struct {
	BidRepository entity.BidRepository
}

func NewFindBidByIdUseCase(bidRepository entity.BidRepository) *FindBidByIdUseCase {
	return &FindBidByIdUseCase{
		BidRepository: bidRepository,
	}
}

func (c *FindBidByIdUseCase) Execute(input *FindBidByIdInputDTO) (*FindBidOutputDTO, error) {
	res, err := c.BidRepository.FindBidById(input.Id)
	if err != nil {
		return nil, err
	}
	return &FindBidOutputDTO{
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

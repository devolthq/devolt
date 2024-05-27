package usecase

import (
	"github.com/devolthq/devolt/internal/domain/entity"
)

type FindAllBidsOutputDTO []*FindBidByIdOutputDTO

type FindAllBidsUseCase struct {
	BidRepository entity.BidRepository
}

func NewFindAllBidsUseCase(bidRepository entity.BidRepository) *FindAllBidsUseCase {
	return &FindAllBidsUseCase{
		BidRepository: bidRepository,
	}
}

func (c *FindAllBidsUseCase) Execute() (*FindAllBidsOutputDTO, error) {
	res, err := c.BidRepository.FindAllBids()
	if err != nil {
		return nil, err
	}
	output := make(FindAllBidsOutputDTO, len(res))
	for i, bid := range res {
		output[i] = &FindBidByIdOutputDTO{
			Id:        bid.Id,
			AuctionId: bid.AuctionId,
			Bidder:    bid.Bidder,
			Credits:   bid.Credits,
			Price:     bid.Price,
			State:     bid.State,
			CreatedAt: bid.CreatedAt,
			UpdatedAt: bid.UpdatedAt,
		}
	}
	return &output, nil
}
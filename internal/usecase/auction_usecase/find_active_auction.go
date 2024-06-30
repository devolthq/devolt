package auction_usecase

import (
	"github.com/devolthq/devolt/internal/domain/entity"
)

type FindActiveAuctionUseCase struct {
	AuctionRepository entity.AuctionRepository
}

func NewFindActiveAuctionUseCase(auctionRepository entity.AuctionRepository) *FindActiveAuctionUseCase {
	return &FindActiveAuctionUseCase{
		AuctionRepository: auctionRepository,
	}
}

func (f *FindActiveAuctionUseCase) Execute() (*FindAuctionOutputDTO, error) {
	res, err := f.AuctionRepository.FindActiveAuction()
	if err != nil {
		return nil, err
	}
	return &FindAuctionOutputDTO{
		Id:         res.Id,
		Credits:    res.Credits,
		PriceLimit: res.PriceLimit,
		State:      res.State,
		ExpiresAt:  res.ExpiresAt,
		CreatedAt:  res.CreatedAt,
		UpdatedAt:  res.UpdatedAt,
	}, nil
}

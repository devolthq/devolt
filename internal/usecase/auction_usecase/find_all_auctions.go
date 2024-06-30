package auction_usecase

import (
	"github.com/devolthq/devolt/internal/domain/entity"
)

type FindAllAuctionsOutputDTO []*FindAuctionOutputDTO

type FindAllAuctionsUseCase struct {
	AuctionRepository entity.AuctionRepository
}

func NewFindAllAuctionsUseCase(auctionRepository entity.AuctionRepository) *FindAllAuctionsUseCase {
	return &FindAllAuctionsUseCase{AuctionRepository: auctionRepository}
}

func (f *FindAllAuctionsUseCase) Execute() (*FindAllAuctionsOutputDTO, error) {
	res, err := f.AuctionRepository.FindAllAuctions()
	if err != nil {
		return nil, err
	}
	output := make(FindAllAuctionsOutputDTO, len(res))
	for i, auction := range res {
		output[i] = &FindAuctionOutputDTO{
			Id:        auction.Id,
			Credits:   auction.Credits, 
			PriceLimit: auction.PriceLimit,
			State:     auction.State,
			ExpiresAt: auction.ExpiresAt,
			CreatedAt: auction.CreatedAt,
			UpdatedAt: auction.UpdatedAt,
		}
	}
	return &output, nil
}
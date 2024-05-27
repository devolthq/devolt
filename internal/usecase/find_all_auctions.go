package usecase

import (
	"github.com/devolthq/devolt/internal/domain/entity"
)

type FindAllAuctionsOutputDTO []*FindAuctionByIdOutputDTO

type FindAllAuctionsUseCase struct {
	AuctionRepository entity.AuctionRepository
}

func NewFindAllAuctionsUseCase(auctionRepository entity.AuctionRepository) *FindAllAuctionsUseCase {
	return &FindAllAuctionsUseCase{AuctionRepository: auctionRepository}
}

func (u *FindAllAuctionsUseCase) Execute() (*FindAllAuctionsOutputDTO, error) {
	res, err := u.AuctionRepository.FindAllAuctions()
	if err != nil {
		return nil, err
	}
	output := make(FindAllAuctionsOutputDTO, len(res))
	for i, auction := range res {
		output[i] = &FindAuctionByIdOutputDTO{
			Id:        auction.Id,
			Credits:   auction.Credits, 
			PriceLimit: auction.PriceLimit,
			State:     auction.State,
			ExpiresAt: auction.ExpiresAt,
			CreatedAt: auction.CreatedAt,
		}
	}
	return &output, nil
}
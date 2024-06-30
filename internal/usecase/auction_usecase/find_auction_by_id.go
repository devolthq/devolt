package auction_usecase

import (
	"github.com/devolthq/devolt/internal/domain/entity"
)

type FindAuctionByIdInputDTO struct {
	Id int `json:"id"`
}

type FindAuctionByIdUseCase struct {
	AuctionRepository entity.AuctionRepository
}

func NewFindAuctionByIdUseCase(auctionRepository entity.AuctionRepository) *FindAuctionByIdUseCase {
	return &FindAuctionByIdUseCase{AuctionRepository: auctionRepository}
}

func (f *FindAuctionByIdUseCase) Execute(input *FindAuctionByIdInputDTO) (*FindAuctionOutputDTO, error) {
	res, err := f.AuctionRepository.FindAuctionById(input.Id)
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

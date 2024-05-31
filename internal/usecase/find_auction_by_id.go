package usecase

import (
	"github.com/devolthq/devolt/internal/domain/entity"
	"github.com/holiman/uint256"
)

type FindAuctionByIdInputDTO struct {
	Id int `json:"id"`
}

type FindAuctionByIdOutputDTO struct {
	Id         int         `json:"id"`
	Credits    uint256.Int `json:"credits"`
	PriceLimit uint256.Int `json:"price_limit"`
	State      string      `json:"state"`
	ExpiresAt  int64       `json:"expires_at"`
	CreatedAt  int64       `json:"created_at"`
	UpdatedAt  int64       `json:"updated_at"`
}

type FindAuctionByIdUseCase struct {
	AuctionRepository entity.AuctionRepository
}

func NewFindAuctionByIdUseCase(auctionRepository entity.AuctionRepository) *FindAuctionByIdUseCase {
	return &FindAuctionByIdUseCase{AuctionRepository: auctionRepository}
}

func (f *FindAuctionByIdUseCase) Execute(input *FindAuctionByIdInputDTO) (*FindAuctionByIdOutputDTO, error) {
	res, err := f.AuctionRepository.FindAuctionById(input.Id)
	if err != nil {
		return nil, err
	}
	return &FindAuctionByIdOutputDTO{
		Id:         res.Id,
		Credits:    res.Credits,
		PriceLimit: res.PriceLimit,
		State:      res.State,
		ExpiresAt:  res.ExpiresAt,
		CreatedAt:  res.CreatedAt,
		UpdatedAt:  res.UpdatedAt,
	}, nil
}

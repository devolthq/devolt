package auction_usecase

import (
	"github.com/devolthq/devolt/internal/domain/entity"
	"github.com/holiman/uint256"
)

type UpdateAuctionInputDTO struct {
	Id         int         `json:"id"`
	Credits    uint256.Int `json:"credits"`
	PriceLimit uint256.Int `json:"price_limit"`
	State      string      `json:"state"`
	ExpiresAt  int64       `json:"expires_at"`
	UpdatedAt  int64       `json:"updated_at"`
}

type UpdateAuctionOutputDTO struct {
	Id         int         `json:"id"`
	Credits    uint256.Int `json:"credits"`
	PriceLimit uint256.Int `json:"price_limit"`
	State      string      `json:"state"`
	ExpiresAt  int64       `json:"expires_at"`
	UpdatedAt  int64       `json:"updated_at"`
}

type UpdateAuctionUseCase struct {
	AuctionRepository entity.AuctionRepository
}

func NewUpdateAuctionUseCase(auctionRepository entity.AuctionRepository) *UpdateAuctionUseCase {
	return &UpdateAuctionUseCase{AuctionRepository: auctionRepository}
}

func (u *UpdateAuctionUseCase) Execute(input *UpdateAuctionInputDTO) (*UpdateAuctionOutputDTO, error) {
	res, err := u.AuctionRepository.UpdateAuction(&entity.Auction{
		Id:         input.Id,
		Credits:    input.Credits,
		PriceLimit: input.PriceLimit,
		State:      input.State,
		ExpiresAt:  input.ExpiresAt,
		UpdatedAt:  input.UpdatedAt,
	})
	if err != nil {
		return nil, err
	}
	return &UpdateAuctionOutputDTO{
		Id:         res.Id,
		Credits:    res.Credits,
		PriceLimit: res.PriceLimit,
		State:      res.State,
		ExpiresAt:  res.ExpiresAt,
		UpdatedAt:  res.UpdatedAt,
	}, nil
}

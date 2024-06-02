package auction_usecase

import (
	"github.com/devolthq/devolt/internal/domain/entity"
	"github.com/holiman/uint256"
)

type CreateAuctionInputDTO struct {
	Credits    uint256.Int `json:"credits"`
	PriceLimit uint256.Int `json:"price_limit"`
	State      string      `json:"state"`
	ExpiresAt  int64       `json:"expires_at"`
	CreatedAt  int64       `json:"created_at"`
}

type CreateAuctionOutputDTO struct {
	Id         int         `json:"id"`
	Credits    uint256.Int `json:"credits"`
	PriceLimit uint256.Int `json:"price_limit"`
	State      string      `json:"state"`
	ExpiresAt  int64       `json:"expires_at"`
	CreatedAt  int64       `json:"created_at"`
}

type CreateAuctionUseCase struct {
	DeviceRepository entity.AuctionRepository
}

func NewCreateAuctionUseCase(deviceRepository entity.AuctionRepository) *CreateAuctionUseCase {
	return &CreateAuctionUseCase{DeviceRepository: deviceRepository}
}

func (c *CreateAuctionUseCase) Execute(input *CreateAuctionInputDTO) (*CreateAuctionOutputDTO, error) {
	auction := entity.NewAuction(input.Credits, input.PriceLimit, input.State, input.ExpiresAt, input.CreatedAt)
	res, err := c.DeviceRepository.CreateAuction(auction)
	if err != nil {
		return nil, err
	}
	return &CreateAuctionOutputDTO{
		Id:         res.Id,
		Credits:    res.Credits,
		PriceLimit: res.PriceLimit,
		State:      res.State,
		ExpiresAt:  res.ExpiresAt,
		CreatedAt:  res.CreatedAt,
	}, nil
}

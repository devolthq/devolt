package usecase

import (
	"github.com/devolthq/devolt/internal/domain/entity"
)

type DeleteBidInputDTO struct {
	Id int `json:"id"`
}

type DeleteBidUseCase struct {
	BidRepository entity.BidRepository
}

func NewDeleteBidUseCase(bidRepository entity.BidRepository) *DeleteBidUseCase {
	return &DeleteBidUseCase{
		BidRepository: bidRepository,
	}
}

func (c *DeleteBidUseCase) Execute(input *DeleteBidInputDTO) error {
	return c.BidRepository.DeleteBid(input.Id)
}
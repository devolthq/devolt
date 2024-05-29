package usecase

import (
	"github.com/devolthq/devolt/internal/domain/entity"
)

type DeleteStationInputDTO struct {
	Id string `json:"id"`
}

type DeleteStationUseCase struct {
	StationRepository entity.StationRepository
}

func NewDeleteStationUseCase(stationRepository entity.StationRepository) *DeleteStationUseCase {
	return &DeleteStationUseCase{
		StationRepository: stationRepository,
	}
}

func (c *DeleteStationUseCase) Execute(input *DeleteStationInputDTO) error {
	return c.StationRepository.DeleteStation(input.Id)
}


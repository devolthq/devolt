package usecase

import (
	"github.com/devolthq/devolt/internal/domain/entity"
)

type FindAllStationsOutputDTO []*FindStationByIdOutputDTO

type FindAllStationsUseCase struct {
	StationReposiory entity.StationRepository
}

func NewFindAllStationsUseCase(stationRepository entity.StationRepository) *FindAllStationsUseCase {
	return &FindAllStationsUseCase{
		StationReposiory: stationRepository,
	}
}

func (c *FindAllStationsUseCase) Execute() (*FindAllStationsOutputDTO, error) {
	res, err := c.StationReposiory.FindAllStations()
	if err != nil {
		return nil, err
	}
	output := make(FindAllStationsOutputDTO, len(res))
	for i, station := range res {
		output[i] = &FindStationByIdOutputDTO{
			Id:        station.Id,
			Rate:      station.Rate,
			Owner:     station.Owner,
			State:     station.State,
			Latitude:  station.Latitude,
			Longitude: station.Longitude,
			CreatedAt: station.CreatedAt,
			UpdatedAt: station.UpdatedAt,
		}
	}
	return &output, nil
}
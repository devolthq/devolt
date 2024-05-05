package usecase

import (
	"github.com/devolthq/devolt/internal/domain/entity"
)

type FindAllStationsUseCase struct {
	StationRepository entity.StationSimulationRepository
}

type FindAllStationsOutputDTO struct {
	Station_ID string                 `json:"station_id"`
	Latitude   float64                `json:"latitude"`
	Longitude  float64                `json:"longitude"`
	Params     map[string]interface{} `json:"params"`
}

func NewFindAllStationsUseCase(stationRepository entity.StationSimulationRepository) *FindAllStationsUseCase {
	return &FindAllStationsUseCase{StationRepository: stationRepository}
}

func (f *FindAllStationsUseCase) Execute() ([]FindAllStationsOutputDTO, error) {
	stations, err := f.StationRepository.FindAllStations()
	if err != nil {
		return nil, err
	}
	var output []FindAllStationsOutputDTO
	for _, station := range stations {
		output = append(output, FindAllStationsOutputDTO{
			Station_ID: station.Station_ID,
			Latitude:   station.Latitude,
			Longitude:  station.Longitude,
			Params:     station.Params,
		})
	}
	return output, nil
}

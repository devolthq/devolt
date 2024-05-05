package usecase

import (
	"github.com/devolthq/devolt/internal/domain/entity"
	"github.com/google/uuid"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

type CreateStationUseCase struct {
	StationRepository entity.StationSimulationRepository
}

func NewCreateStationUseCase(stationRepository entity.StationSimulationRepository) *CreateStationUseCase {
	return &CreateStationUseCase{StationRepository: stationRepository}
}

type CreateStationInputDTO struct {
	Latitude  float64                `json:"latitude"`
	Longitude float64                `json:"longitude"`
	Params    map[string]interface{} `json:"params"`
}

type CreateStationOutputDTO struct {
	ID         primitive.ObjectID     `json:"_id"`
	Station_ID string                 `json:"station_id"`
	Latitude   float64                `json:"latitude"`
	Longitude  float64                `json:"longitude"`
	Params     map[string]interface{} `json:"params"`
}

func (c *CreateStationUseCase) Execute(input CreateStationInputDTO) (*CreateStationOutputDTO, error) {
	station := entity.NewStationSimulation(uuid.New().String(), input.Latitude, input.Longitude, input.Params)
	id, err := c.StationRepository.CreateStation(station)
	if err != nil {
		return nil, err
	}
	return &CreateStationOutputDTO{
		ID:         id.InsertedID.(primitive.ObjectID),
		Station_ID: station.Station_ID,
		Latitude:   station.Latitude,
		Longitude:  station.Longitude,
		Params:     station.Params,
	}, nil
}

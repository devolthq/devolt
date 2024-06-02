package station_usecase

import (
	"github.com/devolthq/devolt/internal/domain/entity"
	"github.com/ethereum/go-ethereum/common"
)

type CreateStationInputDTO struct {
	Id        string         `json:"id"`
	Rate      float64        `json:"rate"`
	Owner     common.Address `json:"owner"`
	State     string         `json:"state"`
	Latitude  float64        `json:"latitude"`
	Longitude float64        `json:"longitude"`
	CreatedAt int64          `json:"created_at"`
}

type CreateStationOutputDTO struct {
	Id        string         `json:"id"`
	Rate      float64        `json:"rate"`
	Owner     common.Address `json:"owner"`
	State     string         `json:"state"`
	Latitude  float64        `json:"latitude"`
	Longitude float64        `json:"longitude"`
	CreatedAt int64          `json:"created_at"`
}

type CreateStationUseCase struct {
	StationRepository entity.StationRepository
}

func NewCreateStationUseCase(stationRepository entity.StationRepository) *CreateStationUseCase {
	return &CreateStationUseCase{
		StationRepository: stationRepository,
	}
}

func (u *CreateStationUseCase) Execute(input *CreateStationInputDTO) (*CreateStationOutputDTO, error) {
	station := entity.NewStation(input.Id, input.Rate, input.Owner, input.Latitude, input.Longitude, input.State, input.CreatedAt)
	res, err := u.StationRepository.CreateStation(station)
	if err != nil {
		return nil, err
	}
	return &CreateStationOutputDTO{
		Id:        res.Id,
		Rate:      res.Rate,
		Owner:     res.Owner,
		State:     res.State,
		Latitude:  res.Latitude,
		Longitude: res.Longitude,
		CreatedAt: res.CreatedAt,
	}, nil
}
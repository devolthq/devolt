package usecase

import (
	"github.com/devolthq/devolt/internal/domain/entity"
	"github.com/ethereum/go-ethereum/common"
)

type UpdateStationInputDTO struct {
	Id        string         `json:"id"`
	Rate      float64        `json:"rate"`
	Owner     common.Address `json:"owner"`
	State     string         `json:"state"`
	Latitude  float64        `json:"latitude"`
	Longitude float64        `json:"longitude"`
	UpdatedAt int64          `json:"updated_at"`
}

type UpdateStationOutputDTO struct {
	Id        string         `json:"id"`
	Rate      float64        `json:"rate"`
	Owner     common.Address `json:"owner"`
	State     string         `json:"state"`
	Latitude  float64        `json:"latitude"`
	Longitude float64        `json:"longitude"`
	UpdatedAt int64          `json:"updated_at"`
}

type UpdateStationUseCase struct {
	StationRepository entity.StationRepository
}

func NewUpdateStationUseCase(stationRepository entity.StationRepository) *UpdateStationUseCase {
	return &UpdateStationUseCase{
		StationRepository: stationRepository,
	}
}

func (u *UpdateStationUseCase) Execute(input *UpdateStationInputDTO) (*UpdateStationOutputDTO, error) {
	res, err := u.StationRepository.UpdateStation(&entity.Station{
		Id:        input.Id,
		Rate:      input.Rate,
		Owner:     input.Owner,
		State:     input.State,
		Latitude:  input.Latitude,
		Longitude: input.Longitude,
		UpdatedAt: input.UpdatedAt,
	})
	if err != nil {
		return nil, err
	}
	return &UpdateStationOutputDTO{
		Id:        res.Id,
		Rate:      res.Rate,
		Owner:     res.Owner,
		State:     res.State,
		Latitude:  res.Latitude,
		Longitude: res.Longitude,
		UpdatedAt: res.UpdatedAt,
	}, nil
}

package station_usecase

import (
	"github.com/devolthq/devolt/internal/domain/entity"
	"github.com/ethereum/go-ethereum/common"
)

type FindStationByIdInputDTO struct {
	Id string `json:"id"`
}

type FindStationByIdOutputDTO struct {
	Id        string            `json:"id"`
	Rate      float64        `json:"rate"`
	Owner     common.Address `json:"owner"`
	State     string         `json:"state"`
	Latitude  float64        `json:"latitude"`
	Longitude float64        `json:"longitude"`
	CreatedAt int64          `json:"created_at"`
	UpdatedAt int64          `json:"updated_at"`
}

type FindStationByIdUseCase struct {
	StationRepository entity.StationRepository
}

func NewFindStationByIdUseCase(stationRepository entity.StationRepository) *FindStationByIdUseCase {
	return &FindStationByIdUseCase{
		StationRepository: stationRepository,
	}
}

func (u *FindStationByIdUseCase) Execute(input *FindStationByIdInputDTO) (*FindStationByIdOutputDTO, error) {
	res, err := u.StationRepository.FindStationById(input.Id)
	if err != nil {
		return nil, err
	}
	return &FindStationByIdOutputDTO{
		Id:        res.Id,
		Rate:      res.Rate,
		Owner:     res.Owner,
		State:     res.State,
		Latitude:  res.Latitude,
		Longitude: res.Longitude,
		CreatedAt: res.CreatedAt,
		UpdatedAt: res.UpdatedAt,
	}, nil
}
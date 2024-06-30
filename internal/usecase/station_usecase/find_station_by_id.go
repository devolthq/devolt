package station_usecase

import (
	"github.com/devolthq/devolt/internal/domain/entity"
)

type FindStationByIdInputDTO struct {
	Id string `json:"id"`
}

type FindStationByIdUseCase struct {
	StationRepository entity.StationRepository
}

func NewFindStationByIdUseCase(stationRepository entity.StationRepository) *FindStationByIdUseCase {
	return &FindStationByIdUseCase{
		StationRepository: stationRepository,
	}
}

func (u *FindStationByIdUseCase) Execute(input *FindStationByIdInputDTO) (*FindStationOutputDTO, error) {
	res, err := u.StationRepository.FindStationById(input.Id)
	if err != nil {
		return nil, err
	}
	return &FindStationOutputDTO{
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

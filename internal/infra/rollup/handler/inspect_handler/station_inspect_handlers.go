package inspect_handler

import (
	"context"
	"encoding/json"
	"fmt"

	"github.com/devolthq/devolt/internal/domain/entity"
	"github.com/devolthq/devolt/internal/usecase/station_usecase"
	"github.com/devolthq/devolt/pkg/rollmelette_router"
	"github.com/rollmelette/rollmelette"
)

type StationInspectHandlers struct {
	StationRepository entity.StationRepository
}

func NewStationInspectHandlers(stationRepository entity.StationRepository) *StationInspectHandlers {
	return &StationInspectHandlers{
		StationRepository: stationRepository,
	}
}

func (h *StationInspectHandlers) FindStationByIdInspectHandler(env rollmelette.EnvInspector, ctx context.Context) error {
	findStationById := station_usecase.NewFindStationByIdUseCase(h.StationRepository)
	res, err := findStationById.Execute(&station_usecase.FindStationByIdInputDTO{
		Id: rollmelette_router.PathValue(ctx, "id"),
	})
	if err != nil {
		return fmt.Errorf("failed to find station by id: %w from id: %s", err, rollmelette_router.PathValue(ctx, "id"))
	}
	station, err := json.Marshal(res)
	if err != nil {
		return fmt.Errorf("failed to marshal station: %w", err)
	}
	env.Report(station)
	return nil
}

func (h *StationInspectHandlers) FindAllStationsInspectHandler(env rollmelette.EnvInspector, ctx context.Context) error {
	findAllStationsUseCase := station_usecase.NewFindAllStationsUseCase(h.StationRepository)
	res, err := findAllStationsUseCase.Execute()
	if err != nil {
		return fmt.Errorf("failed to find all stations: %w", err)
	}
	allStations, err := json.Marshal(res)
	if err != nil {
		return fmt.Errorf("failed to marshal all stations: %w", err)
	}
	env.Report(allStations)
	return nil
}

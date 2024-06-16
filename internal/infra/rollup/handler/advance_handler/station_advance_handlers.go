package advance_handler

import (
	"encoding/json"
	"fmt"
	"github.com/devolthq/devolt/internal/domain/entity"
	"github.com/devolthq/devolt/internal/usecase/station_usecase"
	"github.com/rollmelette/rollmelette"
)

type StationAdvanceHandlers struct {
	StationRepository entity.StationRepository
}

func NewStationAdvanceHandlers(
	stationRepository entity.StationRepository,
) *StationAdvanceHandlers {
	return &StationAdvanceHandlers{
		StationRepository: stationRepository,
	}
}

func (h *StationAdvanceHandlers) CreateStationHandler(env rollmelette.Env, metadata rollmelette.Metadata, deposit rollmelette.Deposit, payload []byte) error {
	var input station_usecase.CreateStationInputDTO
	if err := json.Unmarshal(payload, &input); err != nil {
		return fmt.Errorf("failed to unmarshal input: %w", err)
	}
	input.Rate = input.Rate / 30
	input.State = "active"
	input.CreatedAt = metadata.BlockTimestamp
	createStation := station_usecase.NewCreateStationUseCase(h.StationRepository)
	res, err := createStation.Execute(&input)
	if err != nil {
		return err
	}
	env.Notice([]byte(fmt.Sprintf("created station with id: %v, address: %v and rate: %v", res.Id, res.Owner, res.Rate)))
	return nil
}

func (h *StationAdvanceHandlers) UpdateStationHandler(env rollmelette.Env, metadata rollmelette.Metadata, deposit rollmelette.Deposit, payload []byte) error {
	var input station_usecase.UpdateStationInputDTO
	if err := json.Unmarshal(payload, &input); err != nil {
		return fmt.Errorf("failed to unmarshal input: %w", err)
	}
	input.Rate = input.Rate / 30
	input.UpdatedAt = metadata.BlockTimestamp
	updateStation := station_usecase.NewUpdateStationUseCase(h.StationRepository)
	res, err := updateStation.Execute(&input)
	if err != nil {
		return err
	}
	env.Notice([]byte(fmt.Sprintf("updated station with id: %v, address: %v and rate: %v", res.Id, res.Owner, res.Rate)))
	return nil
}

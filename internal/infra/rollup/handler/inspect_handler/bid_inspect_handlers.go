package inspect_handler

import (
	"encoding/json"
	"fmt"
	"strconv"

	"github.com/devolthq/devolt/internal/domain/entity"
	"github.com/devolthq/devolt/internal/usecase/bid_usecase"
	"github.com/rollmelette/rollmelette"
)

type BidInspectHandlers struct {
	BidRepository entity.BidRepository
}

func NewBidInspectHandlers(bidRepository entity.BidRepository) *BidInspectHandlers {
	return &BidInspectHandlers{
		BidRepository: bidRepository,
	}
}

func (h *BidInspectHandlers) FindBidByIdInspectHandler(env rollmelette.EnvInspector, payload []string) error {
	id, err := strconv.Atoi(payload[1])
	if err != nil {
		return fmt.Errorf("failed to parse id into int: %v", payload)
	}
	findBidById := bid_usecase.NewFindBidByIdUseCase(h.BidRepository)
	res, err := findBidById.Execute(&bid_usecase.FindBidByIdInputDTO{
		Id: id,
	})
	if err != nil {
		return fmt.Errorf("failed to find bid: %w", err)
	}
	bid, err := json.Marshal(res)
	if err != nil {
		return fmt.Errorf("failed to marshal bid: %w", err)
	}
	env.Report(bid)
	return nil
}

func (h *BidInspectHandlers) FindAllBidsInspectHandler(env rollmelette.EnvInspector, payload []string) error {
	findAllBids := bid_usecase.NewFindAllBidsUseCase(h.BidRepository)
	res, err := findAllBids.Execute()
	if err != nil {
		return fmt.Errorf("failed to find all bids: %w", err)
	}
	allBids, err := json.Marshal(res)
	if err != nil {
		return fmt.Errorf("failed to marshal all bids: %w", err)
	}
	env.Report(allBids)
	return nil
}
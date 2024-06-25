package inspect_handler

import (
	"context"
	"encoding/json"
	"fmt"
	"strconv"

	"github.com/devolthq/devolt/internal/domain/entity"
	"github.com/devolthq/devolt/internal/usecase/auction_usecase"
	"github.com/devolthq/devolt/pkg/rollmelette_router"
	"github.com/rollmelette/rollmelette"
)

type AuctionInspectHandlers struct {
	AuctionRepository entity.AuctionRepository
}

func NewAuctionInspectHandlers(auctionRepository entity.AuctionRepository) *AuctionInspectHandlers {
	return &AuctionInspectHandlers{
		AuctionRepository: auctionRepository,
	}
}

func (h *AuctionInspectHandlers) FindAuctionByIdInspectHandler(env rollmelette.EnvInspector, ctx context.Context) error {
	id, err := strconv.Atoi(rollmelette_router.GetValue(ctx, "id"))
	if err != nil {
		return fmt.Errorf("failed to parse id into int: %v", rollmelette_router.GetValue(ctx, "id"))
	}
	findAuctionById := auction_usecase.NewFindAuctionByIdUseCase(h.AuctionRepository)
	res, err := findAuctionById.Execute(&auction_usecase.FindAuctionByIdInputDTO{
		Id: id,
	})
	if err != nil {
		return fmt.Errorf("failed to find auction: %w", err)
	}
	auction, err := json.Marshal(res)
	if err != nil {
		return fmt.Errorf("failed to marshal auction: %w", err)
	}
	env.Report(auction)
	return nil
}

func (h *AuctionInspectHandlers) FindAllAuctionsInspectHandler(env rollmelette.EnvInspector, ctx context.Context) error {
	findAllAuctionsUseCase := auction_usecase.NewFindAllAuctionsUseCase(h.AuctionRepository)
	res, err := findAllAuctionsUseCase.Execute()
	if err != nil {
		return fmt.Errorf("failed to find all auctions: %w", err)
	}
	allAuctions, err := json.Marshal(res)
	if err != nil {
		return fmt.Errorf("failed to marshal all auctions: %w", err)
	}
	env.Report(allAuctions)
	return nil
}

package advance_handler

import (
	"encoding/json"
	"fmt"

	"github.com/devolthq/devolt/internal/domain/entity"
	"github.com/devolthq/devolt/internal/usecase/auction_usecase"
	"github.com/rollmelette/rollmelette"
)

type AuctionAdvanceHandlers struct {
	AuctionRepository entity.AuctionRepository
	BidRepository entity.BidRepository
}

func NewAuctionAdvanceHandlers(auctionRepository entity.AuctionRepository, bidRepository entity.BidRepository) *AuctionAdvanceHandlers {
	return &AuctionAdvanceHandlers{
		AuctionRepository: auctionRepository,
		BidRepository: bidRepository,
	}
}

func (h *AuctionAdvanceHandlers) CreateAuctionHandler(env rollmelette.Env, metadata rollmelette.Metadata, deposit rollmelette.Deposit, payload []byte) error {
	var input *auction_usecase.CreateAuctionInputDTO
	if err := json.Unmarshal(payload, &input); err != nil {
		return err
	}
	input.State = "ongoing"
	input.CreatedAt = metadata.BlockTimestamp
	createAuction := auction_usecase.NewCreateAuctionUseCase(h.AuctionRepository)
	res, err := createAuction.Execute(input)
	if err != nil {
		return err
	}
	env.Report([]byte(fmt.Sprintf("created auction with id: %v and expiration: %v", res.Id, res.ExpiresAt)))
	return nil
}

func (h *AuctionAdvanceHandlers) DeleteStationHandler(env rollmelette.Env, metadata rollmelette.Metadata, deposit rollmelette.Deposit, payload []byte) error {
	var input *auction_usecase.DeleteAuctionInputDTO
	if err := json.Unmarshal(payload, &input); err != nil {
		return err
	}
	deleteAuction := auction_usecase.NewDeleteAuctionUseCase(h.AuctionRepository)
	err := deleteAuction.Execute(input)
	if err != nil {
		return err
	}
	env.Report([]byte(fmt.Sprintf("deleted auction with id: %v", input.Id)))
	return nil
}

func (h *AuctionAdvanceHandlers) FinishAuctionHandler(env rollmelette.Env, metadata rollmelette.Metadata, deposit rollmelette.Deposit, payload []byte) error {
	findActiveAuction := auction_usecase.NewFindActiveAuctionUseCase(h.AuctionRepository)
	activeAuctionRes, err := findActiveAuction.Execute()
	if err != nil {
		return err
	}
	
	var input *auction_usecase.UpdateAuctionInputDTO
	if err := json.Unmarshal(payload, &input); err != nil {
		return err
	}
	input.State = "expired"
	input.Id = activeAuctionRes.Id
	input.UpdatedAt = metadata.BlockTimestamp
	updateAuction := auction_usecase.NewUpdateAuctionUseCase(h.AuctionRepository)
	res, err := updateAuction.Execute(input)
	if err != nil {
		return err
	}
	//TODO: Create vouchers for winner and losers
	env.Report([]byte(fmt.Sprintf("finished auction: %v at: %v", res, metadata.BlockTimestamp)))
	return nil
}

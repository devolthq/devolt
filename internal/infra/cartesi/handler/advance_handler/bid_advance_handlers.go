package advance_handler

import (
	"encoding/json"
	"fmt"
	"github.com/devolthq/devolt/internal/domain/entity"
	"github.com/devolthq/devolt/internal/usecase/bid_usecase"
	"github.com/rollmelette/rollmelette"
)

type BidAdvanceHandler struct {
	BidRepository     entity.BidRepository
	TokenRepository   entity.TokenRepository
	AuctionRepository entity.AuctionRepository
}

func NewBidAdvanceHandler(bidRepository entity.BidRepository, tokenRepository entity.TokenRepository, auctionRepository entity.AuctionRepository) *BidAdvanceHandler {
	return &BidAdvanceHandler{
		BidRepository:     bidRepository,
		TokenRepository:   tokenRepository,
		AuctionRepository: auctionRepository,
	}
}

func (h *BidAdvanceHandler) CreateBidHandler(env rollmelette.Env, metadata rollmelette.Metadata, deposit rollmelette.Deposit, payload []byte) error {
	var input bid_usecase.CreateBidInputDTO
	if err := json.Unmarshal(payload, &input); err != nil {
		return err
	}
	createBid := bid_usecase.NewCreateBidUseCase(h.BidRepository, h.TokenRepository, h.AuctionRepository)
	res, err := createBid.Execute(&input, deposit, metadata)
	if err != nil {
		return err
	}
	env.Report([]byte(fmt.Sprintf("created bid with id: %v and amount of credits: %v and price: %v", res.Id, res.Credits, res.Price)))
	return nil
}

func (h *BidAdvanceHandler) UpdateBidHandler(env rollmelette.Env, metadata rollmelette.Metadata, deposit rollmelette.Deposit, payload []byte) error {
	var input bid_usecase.UpdateBidInputDTO
	if err := json.Unmarshal(payload, &input); err != nil {
		return fmt.Errorf("failed to unmarshal input: %w", err)
	}
	input.UpdatedAt = metadata.BlockTimestamp
	updateBid := bid_usecase.NewUpdateBidUseCase(h.BidRepository)
	res, err := updateBid.Execute(&input)
	if err != nil {
		return err
	}
	env.Report([]byte(fmt.Sprintf("updated bid with id: %v and amount of credits: %v and price: %v", res.Id, res.Credits, res.Price)))
	return nil
}

package bid_usecase

import (
	"fmt"
	"log"

	"github.com/devolthq/devolt/internal/domain/entity"
	"github.com/ethereum/go-ethereum/common"
	"github.com/holiman/uint256"
	"github.com/rollmelette/rollmelette"
)

type CreateBidInputDTO struct {
	Bidder    common.Address `json:"bidder"`
	Credits   uint256.Int    `json:"credits"`
	Price     uint256.Int    `json:"price"`
}

type CreateBidOutputDTO struct {
	Id        int            `json:"id"`
	AuctionId int            `json:"auction_id"`
	Bidder    common.Address `json:"bidder"`
	Credits   uint256.Int    `json:"credits"`
	Price     uint256.Int    `json:"price"`
	State     string         `json:"state"`
	CreatedAt int64          `json:"created_at"`
}

type CreateBidUseCase struct {
	BidRepository     entity.BidRepository
	TokenRepository   entity.TokenRepository
	AuctionRepository entity.AuctionRepository
}

func NewCreateBidUseCase(bidRepository entity.BidRepository, tokenRepository entity.TokenRepository, auctionRepository entity.AuctionRepository) *CreateBidUseCase {
	return &CreateBidUseCase{
		BidRepository:     bidRepository,
		TokenRepository:   tokenRepository,
		AuctionRepository: auctionRepository,
	}
}

func (c *CreateBidUseCase) Execute(input *CreateBidInputDTO, deposit rollmelette.Deposit, metadata rollmelette.Metadata) (*CreateBidOutputDTO, error) {
	bidDeposit, ok := deposit.(*rollmelette.ERC20Deposit)
	if bidDeposit == nil || !ok {
		return nil, fmt.Errorf("unsupported deposit type for bid creation: %T", deposit)
	}

	token, err := c.TokenRepository.FindTokenBySymbol("VOLT")
	if err != nil || token.Address != bidDeposit.Token {
		return nil, fmt.Errorf("invalid token address provided for bid creation: %v, query error: %w", bidDeposit.Token, err)
	}

	activeAuctionRes, err := c.AuctionRepository.FindActiveAuction()
	if err != nil {
		return nil, err
	}

	log.Printf("active auction price limit: %v and bid price: %v", activeAuctionRes.PriceLimit[0], input.Price[0])

	if input.Price[0] > activeAuctionRes.PriceLimit[0] {
		return nil, fmt.Errorf("bid price exceeds auction price limit")
	}

	bid := entity.NewBid(activeAuctionRes.Id, input.Bidder, input.Credits, input.Price, "pending", metadata.BlockTimestamp)
	res, err := c.BidRepository.CreateBid(bid)
	if err != nil {
		return nil, err
	}
	
	return &CreateBidOutputDTO{
		Id:        res.Id,
		AuctionId: res.AuctionId,
		Bidder:    res.Bidder,
		Credits:   res.Credits,
		Price:     res.Price,
		State:     res.State,
		CreatedAt: res.CreatedAt,
	}, nil
}

package repository

import (
	"github.com/devolthq/devolt/internal/domain/entity"
	"github.com/jmoiron/sqlx"
)

type BidRepositorySqlite struct {
	Db *sqlx.DB
}

func NewBidRepositorySqlite(db *sqlx.DB) *BidRepositorySqlite {
	return &BidRepositorySqlite{
		Db: db,
	}
}

func (s *BidRepositorySqlite) CreateBid(input *entity.Bid) (*entity.Bid, error) {
	var bid entity.Bid
	err := s.Db.QueryRow(
		"INSERT INTO bids (auction_id, bidder, credits, price) VALUES ($1, $2, $3, $4) RETURNING id, auction_id, bidder, credits, price, state, created_at, updated_at",
		input.AuctionId,
		input.Bidder.String(),
		input.Credits.String(),
		input.Price.String(),
	).Scan(
		&bid.Id,
		&bid.AuctionId,
		&bid.Bidder,
		&bid.Credits,
		&bid.Price,
		&bid.State,
		&bid.CreatedAt,
		&bid.UpdatedAt,
	)
	if err != nil {
		return nil, err
	}
	return &bid, err
}

func (s *BidRepositorySqlite) FindBidById(id int) (*entity.Bid, error) {
	var bid entity.Bid
	err := s.Db.Get(&bid, "SELECT * FROM bids WHERE id = $1", id)
	if err != nil {
		return nil, err
	}
	return &bid, nil
}

func (s *BidRepositorySqlite) FindAllBids() ([]*entity.Bid, error) {
	var bids []*entity.Bid
	err := s.Db.Select(&bids, "SELECT * FROM bids")
	if err != nil {
		return nil, err
	}
	return bids, nil
}

func (s *BidRepositorySqlite) UpdateBid(input *entity.Bid) (*entity.Bid, error) {
	var bid entity.Bid
	err := s.Db.QueryRow(
		"UPDATE bids SET auction_id = $1, bidder = $2, credits = $3, price = $4, state = $5 WHERE id = $6 RETURNING id, auction_id, bidder, credits, price, state, created_at, updated_at",
		input.AuctionId,
		input.Bidder.String(),
		input.Credits.String(),
		input.Price.String(),
		input.State,
		input.Id,
	).Scan(
		&bid.Id,
		&bid.AuctionId,
		&bid.Bidder,
		&bid.Credits,
		&bid.Price,
		&bid.State,
		&bid.CreatedAt,
		&bid.UpdatedAt,
	)
	if err != nil {
		return nil, err
	}
	return &bid, err
}

func (s *BidRepositorySqlite) DeleteBid(id int) error {
	_, err := s.Db.Exec("DELETE FROM bids WHERE id = $1", id)
	if err != nil {
		return err
	}
	return nil
}
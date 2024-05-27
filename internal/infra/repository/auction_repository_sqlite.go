package repository

import (
	"github.com/devolthq/devolt/internal/domain/entity"
	"github.com/jmoiron/sqlx"
)

type AuctionRepositorySqlite struct {
	Db *sqlx.DB
}

func NewAuctionRepositorySqlite(db *sqlx.DB) *AuctionRepositorySqlite {
	return &AuctionRepositorySqlite{
		Db: db,
	}
}

func (s *AuctionRepositorySqlite) CreateAuction(input *entity.Auction) (*entity.Auction, error) {
	var auction entity.Auction
	err := s.Db.QueryRow(
		"INSERT INTO auctions (credits, price_limit, expires_at) VALUES ($1, $2, $3) RETURNING id, credits, price_limit, state, expires_at, created_at, updated_at",
		input.Credits.String(),
		input.PriceLimit.String(),
		input.ExpiresAt,
	).Scan(
		&auction.Id,
		&auction.Credits,
		&auction.PriceLimit,
		&auction.State,
		&auction.ExpiresAt,
		&auction.CreatedAt,
		&auction.UpdatedAt,
	)
	if err != nil {
		return nil, err
	}
	return &auction, err
}

func (s *AuctionRepositorySqlite) FindAuctionById(id int) (*entity.Auction, error) {
	var auction entity.Auction
	err := s.Db.Get(&auction, "SELECT * FROM auctions WHERE id = $1", id)
	if err != nil {
		return nil, err
	}
	return &auction, nil
}

func (s *AuctionRepositorySqlite) FindAllAuctions() ([]*entity.Auction, error) {
	var auctions []*entity.Auction
	err := s.Db.Select(&auctions, "SELECT * FROM auctions")
	if err != nil {
		return nil, err
	}
	return auctions, nil
}

func (s *AuctionRepositorySqlite) UpdateAuction(input *entity.Auction) (*entity.Auction, error) {
	var auction entity.Auction
	err := s.Db.QueryRow(
		"UPDATE auctions SET credits = $1, price_limit = $2, expires_at = $3, state = $4 WHERE id = $5 RETURNING id, credits, price_limit, state, expires_at, created_at, updated_at",
		input.Credits.String(),
		input.PriceLimit.String(),
		input.ExpiresAt,
		input.State,
		input.Id,
	).Scan(
		&auction.Id,
		&auction.Credits,
		&auction.PriceLimit,
		&auction.State,
		&auction.ExpiresAt,
		&auction.CreatedAt,
		&auction.UpdatedAt,
	)
	if err != nil {
		return nil, err
	}
	return &auction, err
}

func (s *AuctionRepositorySqlite) DeleteAuction(id int) error {
	_, err := s.Db.Exec("DELETE FROM auctions WHERE id = $1", id)
	if err != nil {
		return err
	}
	return nil
}
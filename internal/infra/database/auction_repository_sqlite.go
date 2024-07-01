package database

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
	err := s.Db.QueryRowx(
		"INSERT INTO auctions (credits, price_limit, state, expires_at, created_at) VALUES ($1, $2, $3, $4, $5) RETURNING id, credits, price_limit, state, expires_at, created_at",
		input.Credits.String(),
		input.PriceLimit.String(),
		input.State,
		input.ExpiresAt,
		input.CreatedAt,
	).StructScan(
		&auction,
	)
	if err != nil {
		return nil, err
	}
	return &auction, nil
}

func (s *AuctionRepositorySqlite) FindActiveAuction() (*entity.Auction, error) {
	var auction entity.Auction
	err := s.Db.Get(&auction, "SELECT * FROM auctions WHERE status = 'ongoing'")
	if err != nil {
		return nil, err
	}
	return &auction, nil
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
	sql := `UPDATE auctions SET
					credits = COALESCE($1, credits),
					price_limit = COALESCE($2, price_limit),
				  expires_at = COALESCE($3, expires_at),
				  updated_at = COALESCE($4, updated_at),
				  state = COALESCE($5, state)
				  WHERE id = $6 RETURNING id, credits, price_limit, state, expires_at, updated_at`

	stmt, err := s.Db.Preparex(sql)
	if err != nil {
			return nil, err
	}
	defer stmt.Close()

	var auction entity.Auction
	err = stmt.QueryRowx(
		NilIfZero(input.Credits),
		NilIfZero(input.PriceLimit),
		NilIfZero(input.ExpiresAt),
		NilIfZero(input.UpdatedAt),
		NilIfZero(input.State),
		NilIfZero(input.Id),
	).StructScan(&auction)
	if err != nil {
			return nil, err
	}
	return &auction, nil
}

func (s *AuctionRepositorySqlite) DeleteAuction(id int) error {
	_, err := s.Db.Exec("DELETE FROM auctions WHERE id = $1", id)
	if err != nil {
		return err
	}
	return nil
}

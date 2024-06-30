package database

import (
	"github.com/devolthq/devolt/internal/domain/entity"
	"github.com/devolthq/devolt/tools"
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
	err := s.Db.QueryRowx(
		"INSERT INTO bids (auction_id, bidder, credits, price) VALUES ($1, $2, $3, $4) RETURNING id, auction_id, bidder, credits, price, state, created_at, updated_at",
		input.AuctionId,
		input.Bidder.String(),
		input.Credits.String(),
		input.Price.String(),
	).StructScan(
		&bid,
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

func (s *BidRepositorySqlite) FindBidsByAuctionId(id int) ([]*entity.Bid, error) {
	var bids []*entity.Bid
	err := s.Db.Select(&bids, "SELECT * FROM bids WHERE auction_id = $1", id)
	if err != nil {
		return nil, err
	}
	return bids, nil
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
	sql := `UPDATE bids SET auction_id = COALESCE($1, auction_id), 
					bidder = COALESCE($2, bidder), 
					credits = COALESCE($3, credits), 
					price = COALESCE($4, price), 
					state = COALESCE($5, state) 
					WHERE id = $6 RETURNING id, auction_id, bidder, credits, price, state, created_at, updated_at`

	stmt, err := s.Db.Preparex(sql)
	if err != nil {
		return nil, err
	}
	defer stmt.Close()

	var bid entity.Bid
	err = stmt.QueryRowx(
		tools.NilIfZero(input.AuctionId),
		tools.NilIfZero(input.Bidder),
		tools.NilIfZero(input.Credits),
		tools.NilIfZero(input.Price),
		tools.NilIfZero(input.State),
		tools.NilIfZero(input.Id),
	).StructScan(&bid)
	if err != nil {
		return nil, err
	}
	return &bid, nil
}

func (s *BidRepositorySqlite) DeleteBid(id int) error {
	_, err := s.Db.Exec("DELETE FROM bids WHERE id = $1", id)
	if err != nil {
		return err
	}
	return nil
}

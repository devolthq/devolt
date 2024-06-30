package database

import (
	"fmt"
	"github.com/devolthq/devolt/internal/domain/entity"
	"github.com/devolthq/devolt/tools"
	"github.com/jmoiron/sqlx"
)

type TokenRepositorySqlite struct {
	Db *sqlx.DB
}

func NewTokenRepositorySqlite(db *sqlx.DB) *TokenRepositorySqlite {
	return &TokenRepositorySqlite{
		Db: db,
	}
}

func (s *TokenRepositorySqlite) CreateToken(token *entity.Token) (*entity.Token, error) {
	var createdToken entity.Token
	err := s.Db.QueryRowx(
		"INSERT INTO tokens (symbol, address, created_at) VALUES ($1, $2, $3) RETURNING id, symbol, address, created_at",
		token.Symbol,
		token.Address.String(),
		token.CreatedAt,
	).StructScan(&createdToken)
	if err != nil {
		return nil, err
	}
	return &createdToken, nil
}

func (s *TokenRepositorySqlite) FindAllTokens() ([]*entity.Token, error) {
	var tokens []*entity.Token
	err := s.Db.Select(&tokens, "SELECT * FROM tokens")
	if err != nil {
		return nil, fmt.Errorf("failed to fetch tokens: %w", err)
	}
	return tokens, nil
}

func (s *TokenRepositorySqlite) FindTokenBySymbol(symbol string) (*entity.Token, error) {
	var token entity.Token
	err := s.Db.Get(&token, "SELECT * FROM tokens WHERE symbol = $1", symbol)
	if err != nil {
		return nil, err
	}
	return &token, nil
}

func (s *TokenRepositorySqlite) UpdateToken(token *entity.Token) (*entity.Token, error) {
	sql := `UPDATE tokens SET
			address = COALESCE($1, address),
			updated_at = COALESCE($2, updated_at)
			WHERE id = $3 RETURNING id, symbol, address, created_at, updated_at`

	stmt, err := s.Db.Preparex(sql)
	if err != nil {
		return nil, fmt.Errorf("failed to prepare update statement: %w", err)
	}
	defer stmt.Close()

	var updatedToken entity.Token
	err = stmt.QueryRowx(
		tools.NilIfZero(token.Address.String()),
		tools.NilIfZero(token.UpdatedAt),
		tools.NilIfZero(token.Id),
	).StructScan(&updatedToken)
	if err != nil {
		return nil, err
	}
	return &updatedToken, nil
}

func (s *TokenRepositorySqlite) DeleteToken(symbol string) error {
	_, err := s.Db.Exec("DELETE FROM tokens WHERE symbol = $1", symbol)
	if err != nil {
		return err
	}
	return nil
}

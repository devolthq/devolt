package configs

import (
	"fmt"
	"github.com/jmoiron/sqlx"
	_ "github.com/mattn/go-sqlite3"
)

func SetupSQLite() (*sqlx.DB, error) {
	db, err := sqlx.Open("sqlite3", ":memory:")
	if err != nil {
		return nil, fmt.Errorf("failed to open database: %v", err)
	}

	migrations := []string{
		`CREATE TABLE auctions (
			id INTEGER PRIMARY KEY AUTOINCREMENT,
			credits TEXT,
			price_limit TEXT,
			state TEXT,
			expires_at INTEGER,
			created_at INTEGER,
			updated_at INTEGER
		);`,
		`CREATE TABLE bids (
			id INTEGER PRIMARY KEY AUTOINCREMENT,
			auction_id INTEGER,
			bidder TEXT,
			credits TEXT,
			price TEXT,
			state TEXT,
			created_at INTEGER,
			updated_at INTEGER
		);`,
		`CREATE TABLE stations (
			id TEXT PRIMARY KEY NOT NULL,
			rate REAL,
			owner TEXT,
			state TEXT,
			latitude REAL,
			longitude REAL,
			created_at INTEGER,
			updated_at INTEGER
		);`,
	}

	for _, m := range migrations {
		_, err := db.Exec(m)
		if err != nil {
			return nil, fmt.Errorf("failed to execute migration: %v", err)
		}
	}
	return db, err
}

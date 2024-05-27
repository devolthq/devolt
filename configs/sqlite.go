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
		`CREATE TABLE Auctions (
			Id INTEGER PRIMARY KEY AUTOINCREMENT,
			Credits TEXT,
			PriceLimit TEXT,
			State TEXT,
			ExpiresAt INTEGER,
			CreatedAt INTEGER,
			UpdatedAt INTEGER
		);`,
		`CREATE TABLE Bids (
			Id INTEGER PRIMARY KEY AUTOINCREMENT,
			AuctionId INTEGER,
			Bidder TEXT,
			Credits TEXT,
			Price TEXT,
			State TEXT,
			CreatedAt INTEGER,
			UpdatedAt INTEGER
		);`,
		`CREATE TABLE Stations (
			Id INTEGER PRIMARY KEY AUTOINCREMENT,
			Rate REAL,
			Owner TEXT,
			State TEXT,
			Latitude REAL,
			Longitude REAL,
			CreatedAt INTEGER,
			UpdatedAt INTEGER
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

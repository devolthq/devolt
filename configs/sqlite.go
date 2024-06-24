package configs

import (
	"fmt"
	"os"

	"github.com/jmoiron/sqlx"
	_ "github.com/mattn/go-sqlite3"
)

func SetupSqlite() (*sqlx.DB, error) {
	os.Remove("./devolt.db")
	
	db, err := sqlx.Open("sqlite3", ":memory:")
	if err != nil {
		return nil, fmt.Errorf("failed to open database: %v", err)
	}

	migrations := []string{
		`CREATE TABLE auctions (
			id INTEGER PRIMARY KEY AUTOINCREMENT,
			credits TEXT NOT NULL,
			price_limit TEXT NOT NULL,
			state TEXT DEFAULT 'ongoing',
			expires_at INTEGER NOT NULL,
			created_at INTEGER NOT NULL,
			updated_at INTEGER DEFAULT 0
		);`,
		`CREATE TABLE bids (
			id INTEGER PRIMARY KEY AUTOINCREMENT,
			auction_id INTEGER NOT NULL,
			bidder TEXT NOT NULL,
			credits TEXT NOT NULL,
			price TEXT NOT NULL,
			state TEXT NOT NULL,
			created_at INTEGER NOT NULL,
			updated_at INTEGER NOT NULL,
			FOREIGN KEY (auction_id) REFERENCES auctions(id) ON DELETE CASCADE
		);`,
		`CREATE TABLE stations (
			id TEXT PRIMARY KEY NOT NULL,
			rate REAL NOT NULL,
			owner TEXT NOT NULL,
			state TEXT NOT NULL,
			latitude REAL NOT NULL,
			longitude REAL NOT NULL,
			created_at INTEGER NOT NULL,
			updated_at INTEGER DEFAULT 0
		);`,
		`CREATE TABLE users (
			id INTEGER PRIMARY KEY AUTOINCREMENT,
			address TEXT NOT NULL ,
			role TEXT NOT NULL
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

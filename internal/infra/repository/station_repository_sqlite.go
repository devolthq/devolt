package repository

import (
	// "github.com/devolthq/devolt/internal/domain/entity"
	"github.com/devolthq/devolt/internal/domain/entity"
	"github.com/jmoiron/sqlx"
)

type StationRepositorySqlite struct {
	Db *sqlx.DB
}

func NewStationRepositorySqlite(db *sqlx.DB) *StationRepositorySqlite {
	return &StationRepositorySqlite{
		Db: db,
	}
}

func (s *StationRepositorySqlite) CreateStation(input *entity.Station) (*entity.Station, error) {
	var station entity.Station
	err := s.Db.QueryRow(
		"INSERT INTO stations (id, rate, owner, state, latitude, longitude) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id, rate, owner, state, latitude, longitude, created_at",
		input.Id,
		station.Rate,
		station.Owner.String(),
		station.State,
		station.Latitude,
		station.Longitude,
	).Scan(
		&station.Id,
		&station.Rate,
		&station.Owner,
		&station.State,
		&station.Latitude,
		&station.Longitude,
		&station.CreatedAt,
	)
	if err != nil {
		return nil, err
	}
	return &station, err
}

func (s *StationRepositorySqlite) FindStationById(id string) (*entity.Station, error) {
	var station entity.Station
	err := s.Db.Get(&station, "SELECT * FROM stations WHERE id = $1", id)
	if err != nil {
		return nil, err
	}
	return &station, nil
}

func (s *StationRepositorySqlite) FindAllStations() ([]*entity.Station, error) {
	var stations []*entity.Station
	err := s.Db.Select(&stations, "SELECT * FROM stations")
	if err != nil {
		return nil, err
	}
	return stations, nil
}

func (s *StationRepositorySqlite) UpdateStation(input *entity.Station) (*entity.Station, error) {
	var station entity.Station
	err := s.Db.QueryRow(
		"UPDATE stations SET rate = $1, owner = $2, state = $3, latitude = $4, longitude = $5 WHERE id = $6 RETURNING id, rate, owner, state, latitude, longitude, created_at, updated_at",
		input.Rate,
		input.Owner.String(),
		input.State,
		input.Latitude,
		input.Longitude,
		input.Id,
	).Scan(
		&station.Id,
		&station.Rate,
		&station.Owner,
		&station.State,
		&station.Latitude,
		&station.Longitude,
		&station.CreatedAt,
		&station.UpdatedAt,
	)
	if err != nil {
		return nil, err
	}
	return &station, err
}

func (s *StationRepositorySqlite) DeleteStation(id string) error {
	_, err := s.Db.Exec("DELETE FROM stations WHERE id = $1", id)
	if err != nil {
		return err
	}
	return nil
}
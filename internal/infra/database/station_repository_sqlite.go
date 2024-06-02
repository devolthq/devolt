package database

import (
	"github.com/devolthq/devolt/internal/domain/entity"
	"github.com/devolthq/devolt/tools"
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
	err := s.Db.QueryRowx(
		"INSERT INTO stations (id, rate, owner, state, latitude, longitude, created_at) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id, rate, owner, state, latitude, longitude, created_at",
		input.Id,
		input.Rate,
		input.Owner,
		input.State,
		input.Latitude,
		input.Longitude,
		input.CreatedAt,
	).StructScan(
		&station,
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
	sql := `UPDATE stations SET
					rate = CASE WHEN $1 IS NOT NULL THEN rate + $1 ELSE rate END,
					owner = COALESCE($2, owner),
					state = COALESCE($3, state),
					latitude = COALESCE($4, latitude),
					longitude = COALESCE($5, longitude),
					updated_at = COALESCE($6, updated_at)
					WHERE id = $7 RETURNING id, rate, owner, state, latitude, longitude, updated_at`

	stmt, err := s.Db.Preparex(sql)
	if err != nil {
		return nil, err
	}
	defer stmt.Close()

	var station entity.Station
	err = stmt.QueryRowx(
		tools.NilIfZero(input.Rate),
		tools.NilIfZero(input.Owner),
		tools.NilIfZero(input.State),
		tools.NilIfZero(input.Latitude),
		tools.NilIfZero(input.Longitude),
		tools.NilIfZero(input.UpdatedAt),
		tools.NilIfZero(input.Id),
	).StructScan(&station)
	if err != nil {
		return nil, err
	}
	return &station, nil
}

func (s *StationRepositorySqlite) DeleteStation(id string) error {
	_, err := s.Db.Exec("DELETE FROM stations WHERE id = $1", id)
	if err != nil {
		return err
	}
	return nil
}

package entity

import (
	"github.com/ethereum/go-ethereum/common"
)

type StationRepository interface {
	CreateStation(station *Station) (*Station, error)
	FindStationById(id string) (*Station, error)
	FindAllStations() ([]*Station, error)
	UpdateStation(station *Station) (*Station, error)
	DeleteStation(id string) error
}

type Station struct {
	Id        string         `json:"id" db:"id"`
	Rate      float64        `json:"rate" db:"rate"`
	Owner     common.Address `json:"owner" db:"owner"`
	State     string         `json:"state" db:"state"`
	Latitude  float64        `json:"latitude" db:"latitude"`
	Longitude float64        `json:"longitude" db:"longitude"`
	CreatedAt int64          `json:"created_at" db:"created_at"`
	UpdatedAt int64          `json:"updated_at" db:"updated_at"`
}

func NewStation(rate float64, owner common.Address, latitude float64, longitude float64, state string, createdAt int64) *Station {
	return &Station{
		Rate:      rate,
		Owner:     owner,
		State:     state,
		Latitude:  latitude,
		Longitude: longitude,
		CreatedAt: createdAt,
	}
}

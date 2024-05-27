package entity

import (
	"github.com/ethereum/go-ethereum/common"
)

type StationRepository interface {
	CreateStation(station *Station) (*Station, error)
	FindStationById(id int) (*Station, error)
	FindAllStations() ([]*Station, error)
	UpdateStation(station *Station) (*Station, error)
	DeleteStation(id int) error
}

type Station struct {
	Id        int            `json:"id"`
	Rate      float64        `json:"rate"`
	Owner     common.Address `json:"owner"`
	State     string         `json:"state"`
	Latitude  float64        `json:"latitude"`
	Longitude float64        `json:"longitude"`
	CreatedAt int64          `json:"created_at"`
	UpdatedAt int64          `json:"updated_at"`
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

package station_usecase

import "github.com/ethereum/go-ethereum/common"

type FindStationOutputDTO struct {
	Id        string         `json:"id"`
	Rate      float64        `json:"rate"`
	Owner     common.Address `json:"owner"`
	State     string         `json:"state"`
	Latitude  float64        `json:"latitude"`
	Longitude float64        `json:"longitude"`
	CreatedAt int64          `json:"created_at"`
	UpdatedAt int64          `json:"updated_at"`
}

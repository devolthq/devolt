package entity

type Station struct {
	Station_ID string  `json:"station_id"`
	Rate       float64 `json:"rate"`
	Credits    float64 `json:"credits"`
	Latitude   float64 `json:"latitude"`
	Longitude  float64 `json:"longitude"`
}
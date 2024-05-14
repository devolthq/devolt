package entity

type StationRollup struct {
	Station_ID string  `json:"station_id"`
	Rate       float64 `json:"rate"`
	Credits    float64 `json:"credits"`
}
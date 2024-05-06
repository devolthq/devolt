package entity

type StationSimulationRepository interface {
	CreateStation(station *StationSimulation) (error)
	FindAllStations() ([]*StationSimulation, error)
}

type StationSimulation struct {
	Station_ID string                 `json:"station_id"`
	Latitude   float64                `json:"latitude"`
	Longitude  float64                `json:"longitude"`
	Params     map[string]interface{} `json:"params"`
}

func NewStationSimulation(id string, latitude float64, longitude float64, params map[string]interface{}) *StationSimulation {
	return &StationSimulation{
		Station_ID: id,
		Latitude:   latitude,
		Longitude:  longitude,
		Params:     params,
	}
}

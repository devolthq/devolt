package dto

type CreateDeviceInputDTO struct {
	Owner     string                 `json:"owner"`
	Latitude  float64                `json:"latitude"`
	Longitude float64                `json:"longitude"`
	Params    map[string]interface{} `json:"params"`
}

type CreateDeviceOutputDTO struct {
	Device_ID string                 `json:"device_id"`
	Owner     string                 `json:"owner"`
	Latitude  float64                `json:"latitude"`
	Longitude float64                `json:"longitude"`
	Params    map[string]interface{} `json:"params"`
}

type FindAllDevicesOutputDTO struct {
	Device_ID string                 `json:"device_id"`
	Owner     string                 `json:"owner"`
	Latitude  float64                `json:"latitude"`
	Longitude float64                `json:"longitude"`
	Params    map[string]interface{} `json:"params"`
}

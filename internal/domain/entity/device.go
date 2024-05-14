package entity

type DeviceRepository interface {
	CreateDevice(device *Device) error
	FindAllDevices() ([]*Device, error)
}

type Device struct {
	Device_ID string                 `json:"device_id"`
	Owner     string                 `json:"owner"`
	Latitude  float64                `json:"latitude"`
	Longitude float64                `json:"longitude"`
	Params    map[string]interface{} `json:"params"`
}

func NewDevice(device_id string, owner string, latitude float64, longitude float64, params map[string]interface{}) *Device {
	return &Device{
		Device_ID: device_id,
		Owner:     owner,
		Latitude:  latitude,
		Longitude: longitude,
		Params:    params,
	}
}

package entity

import "github.com/ethereum/go-ethereum/common"

type DeviceRepository interface {
	CreateDevice(device *Device) error
	FindAllDevices() ([]*Device, error)
}

type Device struct {
	DeviceId  string                 `json:"device_id"`
	Wallet    common.Address                 `json:"wallet"`
	Latitude  float64                `json:"latitude"`
	Longitude float64                `json:"longitude"`
	Params    map[string]interface{} `json:"params"`
}

func NewDevice(deviceId string, wallet common.Address, latitude float64, longitude float64, params map[string]interface{}) *Device {
	return &Device{
		DeviceId:  deviceId,
		Wallet:    wallet,
		Latitude:  latitude,
		Longitude: longitude,
		Params:    params,
	}
}

package usecase

import (
	"github.com/devolthq/devolt/internal/domain/entity"
	"github.com/ethereum/go-ethereum/common"
)

type FindAllDevicesOutputDTO struct {
	DeviceId  string                 `json:"device_id"`
	Wallet    common.Address         `json:"wallet"`
	Latitude  float64                `json:"latitude"`
	Longitude float64                `json:"longitude"`
	Params    map[string]interface{} `json:"params"`
}

type FindAllDevicesUseCase struct {
	DeviceRepository entity.DeviceRepository
}

func NewFindAllDevicesUseCase(deviceRepository entity.DeviceRepository) *FindAllDevicesUseCase {
	return &FindAllDevicesUseCase{DeviceRepository: deviceRepository}
}

func (f *FindAllDevicesUseCase) Execute() ([]*FindAllDevicesOutputDTO, error) {
	res, err := f.DeviceRepository.FindAllDevices()
	if err != nil {
		return nil, err
	}
	var output []*FindAllDevicesOutputDTO
	for _, device := range res {
		output = append(output, &FindAllDevicesOutputDTO{
			DeviceId: device.DeviceId,
			Wallet:     device.Wallet,
			Latitude:  device.Latitude,
			Longitude: device.Longitude,
			Params:    device.Params,
		})
	}
	return output, nil
}

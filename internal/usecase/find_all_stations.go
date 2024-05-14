package usecase

import (
	"github.com/devolthq/devolt/internal/domain/dto"
	"github.com/devolthq/devolt/internal/domain/entity"
)

type FindAllDevicesUseCase struct {
	DeviceRepository entity.DeviceRepository
}

func NewFindAllDevicesUseCase(deviceRepository entity.DeviceRepository) *FindAllDevicesUseCase {
	return &FindAllDevicesUseCase{DeviceRepository: deviceRepository}
}

func (f *FindAllDevicesUseCase) Execute() ([]*dto.FindAllDevicesOutputDTO, error) {
	devices, err := f.DeviceRepository.FindAllDevices()
	if err != nil {
		return nil, err
	}
	var output []*dto.FindAllDevicesOutputDTO
	for _, device := range devices {
		output = append(output, &dto.FindAllDevicesOutputDTO{
			Device_ID: device.Device_ID,
			Owner:     device.Owner,
			Latitude:  device.Latitude,
			Longitude: device.Longitude,
			Params:    device.Params,
		})
	}
	return output, nil
}

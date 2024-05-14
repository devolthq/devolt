package usecase

import (
	"github.com/devolthq/devolt/internal/domain/entity"
	"github.com/google/uuid"
	"github.com/devolthq/devolt/internal/domain/dto"
)

type CreateDeviceUseCase struct {
	DeviceRepository entity.DeviceRepository
}

func NewCreateDeviceUseCase(deviceRepository entity.DeviceRepository) *CreateDeviceUseCase {
	return &CreateDeviceUseCase{DeviceRepository: deviceRepository}
}

func (c *CreateDeviceUseCase) Execute(input *dto.CreateDeviceInputDTO) (*dto.CreateDeviceOutputDTO, error) {
	device := entity.NewDevice(uuid.New().String(), input.Owner, input.Latitude, input.Longitude, input.Params)
	err := c.DeviceRepository.CreateDevice(device)
	if err != nil {
		return nil, err
	}
	return &dto.CreateDeviceOutputDTO{
		Device_ID: 	device.Device_ID,
		Owner:      device.Owner,
		Latitude:   device.Latitude,
		Longitude:  device.Longitude,
		Params:     device.Params,
	}, nil
}

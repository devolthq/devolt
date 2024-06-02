package device_usecase

import (
	"github.com/devolthq/devolt/internal/domain/entity"
	"github.com/ethereum/go-ethereum/common"
	"github.com/google/uuid"
)

type CreateDeviceInputDTO struct {
	Wallet    common.Address         `json:"wallet"`
	Latitude  float64                `json:"latitude"`
	Longitude float64                `json:"longitude"`
	Params    map[string]interface{} `json:"params"`
}

type CreateDeviceOutputDTO struct {
	Id        string                 `json:"id"`
	Wallet    common.Address         `json:"wallet"`
	Latitude  float64                `json:"latitude"`
	Longitude float64                `json:"longitude"`
	Params    map[string]interface{} `json:"params"`
}

type CreateDeviceUseCase struct {
	DeviceRepository entity.DeviceRepository
}

func NewCreateDeviceUseCase(deviceRepository entity.DeviceRepository) *CreateDeviceUseCase {
	return &CreateDeviceUseCase{DeviceRepository: deviceRepository}
}

func (c *CreateDeviceUseCase) Execute(input *CreateDeviceInputDTO) (*CreateDeviceOutputDTO, error) {
	device := entity.NewDevice(uuid.New().String(), input.Wallet, input.Latitude, input.Longitude, input.Params)
	err := c.DeviceRepository.CreateDevice(device)
	if err != nil {
		return nil, err
	}
	return &CreateDeviceOutputDTO{
		Id:        device.Id,
		Wallet:    device.Wallet,
		Latitude:  device.Latitude,
		Longitude: device.Longitude,
		Params:    device.Params,
	}, nil
}

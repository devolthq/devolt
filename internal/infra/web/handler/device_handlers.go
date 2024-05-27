package handler

import (
	"encoding/json"
	"net/http"
	"os"
	"github.com/devolthq/devolt/internal/domain/entity"
	"github.com/devolthq/devolt/internal/infra/kafka"
	"github.com/devolthq/devolt/internal/usecase"
	"github.com/gin-gonic/gin"
)

type DeviceHandlers struct {
	DeviceRepository entity.DeviceRepository
	KafkaClient      *kafka.KafkaProducer
}

func NewDeviceHandlers(deviceRepository entity.DeviceRepository, kafkaClient *kafka.KafkaProducer) *DeviceHandlers {
	return &DeviceHandlers{DeviceRepository: deviceRepository, KafkaClient: kafkaClient}
}

// CreateDevice
//
// @Summary			Create Device
// @Description	Create Device with given latitude, longitude, and params
// @ID						create-device
// @Accept				json
// @Produce			json
// @Param				request	body		usecase.CreateDeviceInputDTO	true	"Device data"
// @Success			200		{string}	string		"Device created successfully"
// @Router				/device [post]
func (s *DeviceHandlers) CreateDeviceHandler(c *gin.Context) {
	var input usecase.CreateDeviceInputDTO
	if err := c.BindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"Error binding request body": err.Error()})
		return
	}
	createDevice := usecase.NewCreateDeviceUseCase(s.DeviceRepository)
	output, err := createDevice.Execute(&input)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"Error creating device": err.Error()})
		return
	}
	outputBytes, err := json.Marshal(output)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"Error marshaling device data": err.Error()})
		return
	}
	err = s.KafkaClient.Produce(outputBytes, []byte("new_device"), os.Getenv("KAFKA_HANDLER_TOPIC_NAME"))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusCreated, gin.H{"message": "Device created successfully"})
}

//		FindAllDevices
//	 @Summary			Find All Devices
//		@Description	GET all devices
//		@ID						find-all-devices
//		@Accept				json
//		@Produce			json
//		@Success			200		{object}	usecase.FindAllDevicesOutputDTO
//		@Router				/device [get]
func (s *DeviceHandlers) FindAllDevicesHandler(c *gin.Context) {
	findAllDevices := usecase.NewFindAllDevicesUseCase(s.DeviceRepository)
	output, err := findAllDevices.Execute()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"Error finding devices": err.Error()})
		return
	}
	c.JSON(http.StatusOK, output)
}

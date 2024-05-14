package handler

import (
	"encoding/json"
	"github.com/devolthq/devolt/internal/domain/dto"
	"github.com/devolthq/devolt/internal/infra/kafka"
	"github.com/devolthq/devolt/internal/usecase"
	"github.com/gin-gonic/gin"
	"net/http"
	"os"
)

type DeviceHandlers struct {
	FindAllDevicesUseCase *usecase.FindAllDevicesUseCase
	CreateDeviceUseCase   *usecase.CreateDeviceUseCase
	KafkaClient           *kafka.KafkaProducer
}

func NewDeviceHandlers(findAllDevicesUseCase *usecase.FindAllDevicesUseCase, createDeviceUseCase *usecase.CreateDeviceUseCase, kafkaClient *kafka.KafkaProducer) *DeviceHandlers {
	return &DeviceHandlers{FindAllDevicesUseCase: findAllDevicesUseCase, CreateDeviceUseCase: createDeviceUseCase, KafkaClient: kafkaClient}
}

// 	CreateDevice
//
//	@Summary			Create Device
//	@Description	Create Device with given latitude, longitude, and params
//	@ID						create-device
//	@Accept				json
//	@Produce			json
//	@Param				request	body		dto.CreateDeviceInputDTO	true	"Device data"
//	@Success			200		{string}	string		"Device created successfully"
//	@Router				/device [post]
func (s *DeviceHandlers) CreateDeviceHandler(c *gin.Context) {
	var input dto.CreateDeviceInputDTO
	if err := c.BindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"Error binding request body": err.Error()})
		return
	}
	output, err := s.CreateDeviceUseCase.Execute(&input)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"Error creating device": err.Error()})
		return
	}
	outputBytes, err := json.Marshal(output)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"Error marshaling device data": err.Error()})
		return
	}
	s.KafkaClient.Produce(outputBytes, []byte("new_device"), os.Getenv("KAFKA_HANDLER_TOPIC_NAME"))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusCreated, gin.H{"message": "Device created successfully"})
}


// 	FindAllDevices
//  @Summary			Find All Devices
//	@Description	GET all devices
//	@ID						find-all-devices
//	@Accept				json
//	@Produce			json
//	@Success			200		{object}	dto.FindAllDevicesOutputDTO
//	@Router				/device [get]
func (s *DeviceHandlers) FindAllDevicesHandler(c *gin.Context) {
	output, err := s.FindAllDevicesUseCase.Execute()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"Error finding devices": err.Error()})
		return
	}
	c.JSON(http.StatusOK, output)
}

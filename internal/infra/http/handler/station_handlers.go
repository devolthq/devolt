package handler

import (
	"github.com/devolthq/devolt/internal/domain/entity"
	"github.com/devolthq/devolt/internal/usecase/station_usecase"
	"github.com/gin-gonic/gin"
	"net/http"
)

type StationHandlers struct {
	StationRepository entity.StationRepository
}

func NewStationHandlers(stationRepository entity.StationRepository) *StationHandlers {
	return &StationHandlers{
		StationRepository: stationRepository,
	}
}

func (h *StationHandlers) CreateStationHandler(c *gin.Context) {
	var input station_usecase.CreateStationInputDTO
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	createStation := station_usecase.NewCreateStationUseCase(h.StationRepository)
	res, err := createStation.Execute(&input)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"Error creating station": err.Error()})
		return
	}
	c.JSON(http.StatusCreated, res)
}

func (h *StationHandlers) FindAllStationsHandler(c *gin.Context) {
	findAllStations := station_usecase.NewFindAllStationsUseCase(h.StationRepository)
	res, err := findAllStations.Execute()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"Error finding stations": err.Error()})
		return
	}
	c.JSON(http.StatusOK, res)
}

func (h *StationHandlers) FindStationByIdHandler(c *gin.Context) {
	var input station_usecase.FindStationByIdInputDTO
	input.Id = c.Param("id")
	findStationById := station_usecase.NewFindStationByIdUseCase(h.StationRepository)
	res, err := findStationById.Execute(&input)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"Error finding station": err.Error()})
		return
	}
	c.JSON(http.StatusOK, res)
}

func (h *StationHandlers) UpdateStationHandler(c *gin.Context) {
	var input station_usecase.UpdateStationInputDTO
	input.Id = c.Param("id")
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"Error binding request body": err.Error()})
		return
	}
	updateStation := station_usecase.NewUpdateStationUseCase(h.StationRepository)
	output, err := updateStation.Execute(&input)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"Error updating station": err.Error()})
		return
	}
	c.JSON(http.StatusOK, output)
}

func (h *StationHandlers) DeleteStationHandler(c *gin.Context) {
	var input station_usecase.DeleteStationInputDTO
	input.Id = c.Param("id")
	deleteStation := station_usecase.NewDeleteStationUseCase(h.StationRepository)
	err := deleteStation.Execute(&input)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"Error deleting station": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "Station deleted successfully"})
}

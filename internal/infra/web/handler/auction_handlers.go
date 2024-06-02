package handler

import (
	"github.com/devolthq/devolt/internal/domain/entity"
	"github.com/devolthq/devolt/internal/usecase/auction_usecase"
	"github.com/gin-gonic/gin"
	"net/http"
	"strconv"
)

type AuctionHandlers struct {
	AuctionRepository entity.AuctionRepository
}

func NewAuctionHandlers(auctionRepository entity.AuctionRepository) *AuctionHandlers {
	return &AuctionHandlers{
		AuctionRepository: auctionRepository,
	}
}

func (h *AuctionHandlers) CreateAuctionHandler(c *gin.Context) {
	var input auction_usecase.CreateAuctionInputDTO
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	createAuction := auction_usecase.NewCreateAuctionUseCase(h.AuctionRepository)
	res, err := createAuction.Execute(&input)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"Error creating auction": err.Error()})
		return
	}
	c.JSON(http.StatusCreated, res)
}

func (h *AuctionHandlers) FindAllAuctionsHandler(c *gin.Context) {
	findAllAuctions := auction_usecase.NewFindAllAuctionsUseCase(h.AuctionRepository)
	res, err := findAllAuctions.Execute()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"Error finding auctions": err.Error()})
		return
	}
	c.JSON(http.StatusOK, res)
}

func (h *AuctionHandlers) FindAuctionByIdHandler(c *gin.Context) {
	var input auction_usecase.FindAuctionByIdInputDTO
	auctionId := c.Param("id")
	id, err := strconv.Atoi(auctionId)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid ID format"})
		return
	}
	input.Id = id
	findAuctionById := auction_usecase.NewFindAuctionByIdUseCase(h.AuctionRepository)
	res, err := findAuctionById.Execute(&input)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"Error finding auction": err.Error()})
		return
	}
	c.JSON(http.StatusOK, res)
}

func (h *AuctionHandlers) UpdateAuctionHandler(c *gin.Context) {
	var input auction_usecase.UpdateAuctionInputDTO
	auctionId := c.Param("id")
	id, err := strconv.Atoi(auctionId)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid ID format"})
		return
	}
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"Error binding request body": err.Error()})
		return
	}
	input.Id = id
	updateAuction := auction_usecase.NewUpdateAuctionUseCase(h.AuctionRepository)
	output, err := updateAuction.Execute(&input)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"Error updating auction": err.Error()})
		return
	}
	c.JSON(http.StatusOK, output)
}

func (h *AuctionHandlers) DeleteAuctionHandler(c *gin.Context) {
	var input auction_usecase.DeleteAuctionInputDTO
	auctionId := c.Param("id")
	id, err := strconv.Atoi(auctionId)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid ID format"})
		return
	}
	input.Id = id
	deleteAuction := auction_usecase.NewDeleteAuctionUseCase(h.AuctionRepository)
	err = deleteAuction.Execute(&input)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"Error deleting auction": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "Auction deleted successfully"})
}

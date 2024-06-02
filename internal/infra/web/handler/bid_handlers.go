package handler

import (
	"net/http"
	"strconv"

	"github.com/devolthq/devolt/internal/domain/entity"
	"github.com/devolthq/devolt/internal/usecase/bid_usecase"
	"github.com/gin-gonic/gin"
)

type BidHandlers struct {
	BidRepository entity.BidRepository
}

func NewBidHandlers(bidRepository entity.BidRepository) *BidHandlers {
	return &BidHandlers{
		BidRepository: bidRepository,
	}
}

func (s *BidHandlers) CreateBidHandler(c *gin.Context) {
	var input bid_usecase.CreateBidInputDTO
	if err := c.BindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"Error binding request body": err.Error()})
		return
	}
	createBid := bid_usecase.NewCreateBidUseCase(s.BidRepository)
	output, err := createBid.Execute(&input)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"Error creating bid": err.Error()})
		return
	}
	c.JSON(http.StatusOK, output)
}

func (s *BidHandlers) FindAllBidsHandler(c *gin.Context) {
	findAllBids := bid_usecase.NewFindAllBidsUseCase(s.BidRepository)
	output, err := findAllBids.Execute()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"Error finding bids": err.Error()})
		return
	}
	c.JSON(http.StatusOK, output)
}

func (s *BidHandlers) FindBidByIdHandler(c *gin.Context) {
	var input bid_usecase.FindBidByIdInputDTO
	bidId := c.Param("id")
	id, err := strconv.Atoi(bidId)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid ID format"})
		return
	}
	input.Id = id
	findBidById := bid_usecase.NewFindBidByIdUseCase(s.BidRepository)
	output, err := findBidById.Execute(&input)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"Error finding bid": err.Error()})
		return
	}
	c.JSON(http.StatusOK, output)
}

func (s *BidHandlers) UpdateBidHandler(c *gin.Context) {
	var input bid_usecase.UpdateBidInputDTO
	bidId := c.Param("id")
	id, err := strconv.Atoi(bidId)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid ID format"})
		return
	}
	if err := c.BindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"Error binding request body": err.Error()})
		return
	}
	input.Id = id
	updateBid := bid_usecase.NewUpdateBidUseCase(s.BidRepository)
	output, err := updateBid.Execute(&input)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"Error updating bid": err.Error()})
		return
	}
	c.JSON(http.StatusOK, output)
}

func (s *BidHandlers) DeleteBidHandler(c *gin.Context) {
	var input bid_usecase.DeleteBidInputDTO
	bidId := c.Param("id")
	id, err := strconv.Atoi(bidId)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid ID format"})
		return
	}
	input.Id = id
	deleteBid := bid_usecase.NewDeleteBidUseCase(s.BidRepository)
	err = deleteBid.Execute(&input)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"Error deleting bid": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "Bid deleted successfully"})
}

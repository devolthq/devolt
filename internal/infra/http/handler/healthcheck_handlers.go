package handler

import (
	"github.com/gin-gonic/gin"
	"net/http"
)

func HealthCheckHandler(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{"status": "ok"})
}
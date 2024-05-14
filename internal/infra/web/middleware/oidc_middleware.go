package middleware

import (
	"log"
	"github.com/gin-gonic/gin"
)

func AuthMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		log.Printf("Authenticated")
		c.Next()
	}
}
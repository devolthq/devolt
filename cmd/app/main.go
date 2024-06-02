package main

import (
	ckafka "github.com/confluentinc/confluent-kafka-go/v2/kafka"
	"os"
	_ "github.com/devolthq/devolt/api"
	"github.com/devolthq/devolt/configs"
	"github.com/devolthq/devolt/internal/infra/kafka"
	"github.com/devolthq/devolt/internal/infra/web/handler"
	"log"
	"github.com/devolthq/devolt/internal/infra/database"
	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	swaggerFiles "github.com/swaggo/files"
	ginSwagger "github.com/swaggo/gin-swagger"
)

//	@title	Devices Api Server
//	@version	1.0
//	@description	This is the devolt api server to manage devices.
//	@termsOfService	http://swagger.io/terms/

//	@contact.name	DeVolt Team
//	@contact.url	https://devolt.xyz
//	@contact.email	henrique@mugen.builders

//	@license.name	Apache 2.0
//	@license.url	http://www.apache.org/licenses/LICENSE-2.0.html

//	@host	localhost:8083
//	@BasePath	/api/v1
// 	@query.collection.format multi

func main() {
	client, err := configs.SetupMongoDB()
	if err != nil {
		log.Fatalf("Failed to connect to MongoDB: %v", err)
	}

	db, err := configs.SetupSQLite()
	if err != nil {
		log.Fatalf("Failed to connect to SQLite: %v", err)
	}
	defer db.Close()

	producerConfigMap := &ckafka.ConfigMap{
		"bootstrap.servers": os.Getenv("KAFKA_BOOTSTRAP_SERVER"),
		"client.id":         os.Getenv("KAFKA_CLIENT_ID"),
	}

	kafkaRepository := kafka.NewKafkaProducer(producerConfigMap)
	deviceRepository := database.NewDeviceRepositoryMongo(client, "mongodb", "devices")
	deviceHandlers := handler.NewDeviceHandlers(deviceRepository, kafkaRepository)

	router := gin.Default()
	router.Use(gin.Logger())
	router.Use(gin.Recovery())
	router.Use(cors.New(cors.Config{
		AllowAllOrigins:  true, // TODO: change to false and make it for production
		AllowMethods:     []string{"PUT", "PATCH, POST, GET, OPTIONS, DELETE"},
		ExposeHeaders:    []string{"Content-Length"},
		AllowCredentials: true,
	}))

	api := router.Group("/api/v1")
	// api.Use(middleware.AuthMiddleware())

	////////////// Healthcheck and Swagger ///////////////

	//TODO: "http://localhost:8083/api/healthz" is the best pattern for healthcheck?

	api.GET("/healthz", handler.HealthCheckHandler)

	///////////////////// Swagger //////////////////////

	api.GET("/docs/*any", ginSwagger.WrapHandler(swaggerFiles.Handler))

	///////////////////// Devices //////////////////////

	{
		deviceGroup := api.Group("/device")
		{
			deviceGroup.GET("", deviceHandlers.FindAllDevicesHandler)
			deviceGroup.POST("", deviceHandlers.CreateDeviceHandler)
		}
	}

	if err != router.Run(":8083") {
		log.Fatalf("Failed to start server: %v", err)
	}
}

package main

import (
	"context"
	"fmt"
	ckafka "github.com/confluentinc/confluent-kafka-go/v2/kafka"
	"github.com/devolthq/devolt/internal/infra/kafka"
	"github.com/devolthq/devolt/internal/infra/repository"
	"github.com/devolthq/devolt/internal/infra/web/handler"
	"github.com/devolthq/devolt/internal/infra/web/middleware"
	"github.com/devolthq/devolt/internal/usecase"
	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	_ "github.com/devolthq/devolt/api"
	"github.com/swaggo/files"
	"github.com/swaggo/gin-swagger"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
	"log"
	"os"
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
	options := options.Client().ApplyURI(
		fmt.Sprintf("mongodb://%s:%s@%s/?retryWrites=true&connectTimeoutMS=10000&authSource=admin&authMechanism=SCRAM-SHA-1&ssl=false",
			os.Getenv("MONGODB_USERNAME"),
			os.Getenv("MONGODB_PASSWORD"),
			os.Getenv("MONGODB_CLUSTER_HOSTNAME")))
	client, err := mongo.Connect(context.TODO(), options)
	if err != nil {
		log.Fatalf("Failed to connect to MongoDB: %v", err)
	}

	err = client.Ping(context.TODO(), nil)
	if err != nil {
		log.Fatal(err)
	}

	producerConfigMap := &ckafka.ConfigMap{
		"bootstrap.servers": os.Getenv("KAFKA_BOOTSTRAP_SERVER"),
		"client.id":         os.Getenv("KAFKA_CLIENT_ID"),
	}

	kafkaRepository := kafka.NewKafkaProducer(producerConfigMap)
	deviceRepository := repository.NewDeviceRepositoryMongo(client, "mongodb", "devices")
	findAllDevicesUseCase := usecase.NewFindAllDevicesUseCase(deviceRepository)
	createDeviceUseCase := usecase.NewCreateDeviceUseCase(deviceRepository)
	deviceHandlers := handler.NewDeviceHandlers(findAllDevicesUseCase, createDeviceUseCase, kafkaRepository)

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
	api.Use(middleware.AuthMiddleware())

	///////////// Healthcheck and Swagger ///////////////

	//TODO: "http://localhost:8083/api/healthz" is the best pattern for healthcheck?

	router.GET("/api/v1/healthz", handler.HealthCheckHandler)
	
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

	router.Run(":8083")
}

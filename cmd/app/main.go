package main

import (
	"context"
	"fmt"
	"log"
	"net/http"
	"os"
	ckafka "github.com/confluentinc/confluent-kafka-go/v2/kafka"
	"github.com/devolthq/devolt/internal/infra/kafka"
	"github.com/devolthq/devolt/internal/infra/repository"
	"github.com/devolthq/devolt/internal/infra/web"
	"github.com/devolthq/devolt/internal/usecase"
	"github.com/rs/cors"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
)

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
		"bootstrap.servers": os.Getenv("CONFLUENT_BOOTSTRAP_SERVER"),
		"client.id":         "devolt",
	}

	kafkaRepository := kafka.NewKafkaProducer(producerConfigMap)
	stationsRepository := repository.NewStationRepositoryMongo(client, "mongodb", "stations")
	findAllStationUseCase := usecase.NewFindAllStationsUseCase(stationsRepository)
	createStationUseCase := usecase.NewCreateStationUseCase(stationsRepository)
	stationHandlers := web.NewStationHandlers(findAllStationUseCase, createStationUseCase, kafkaRepository)

	mux := http.NewServeMux()
	mux.HandleFunc("GET /api/v1/stations", stationHandlers.FindAllStationsHandler)
	mux.HandleFunc("POST /api/v1/stations", stationHandlers.CreateSensorHandler)
	r := cors.Default().Handler(mux)
	log.Printf("Starting server on port 8083")
	http.ListenAndServe(":8083", r)
}

package main

import (
	"context"
	"encoding/json"
	"fmt"
	ckafka "github.com/confluentinc/confluent-kafka-go/v2/kafka"
	"github.com/devolthq/devolt/internal/domain/entity"
	"github.com/devolthq/devolt/internal/infra/kafka"
	"github.com/devolthq/devolt/internal/infra/repository"
	"github.com/devolthq/devolt/internal/usecase"
	MQTT "github.com/eclipse/paho.mqtt.golang"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
	"log"
	"os"
	"sync"
	"time"
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

	consumerConfigMap := &ckafka.ConfigMap{
		"bootstrap.servers":  os.Getenv("CONFLUENT_BOOTSTRAP_SERVER"),
		"session.timeout.ms": 6000,
		"group.id":           "devolt",
		"auto.offset.reset":  "latest",
	}

	msgChan := make(chan *ckafka.Message)
	kafkaRepository := kafka.NewKafkaConsumer([]string{os.Getenv("CONFLUENT_KAFKA_HANDLER_TOPIC_NAME")}, consumerConfigMap)

	stationRepository := repository.NewStationRepositoryMongo(client, "mongodb", "stations")
	findAllStationsUseCase := usecase.NewFindAllStationsUseCase(stationRepository)

	stations, err := findAllStationsUseCase.Execute()
	if err != nil {
		log.Fatalf("Failed to find all stations: %v", err)
	}

	var wg sync.WaitGroup

	wg.Add(1)
	go func(stations []usecase.FindAllStationsOutputDTO) {
		defer wg.Done()
		for _, station := range stations {
			log.Printf("Starting station: %v", station)
			go func(station usecase.FindAllStationsOutputDTO) {
				opts := MQTT.NewClientOptions().AddBroker(fmt.Sprintf("tcp://%s:%s", os.Getenv("BROKER_URL"), os.Getenv("BROKER_PORT"))).SetClientID(station.Station_ID)
				client := MQTT.NewClient(opts)
				if session := client.Connect(); session.Wait() && session.Error() != nil {
					log.Fatalf("Failed to connect to MQTT broker: %v", session.Error())
				}
				for {
					payload, err := entity.NewStationPayload(
						station.Station_ID,
						station.Params,
						station.Latitude,
						station.Longitude,
					)
					if err != nil {
						log.Fatalf("Failed to create payload: %v", err)
					}

					jsonBytesPayload, err := json.Marshal(payload)
					if err != nil {
						log.Println("Error converting to JSON:", err)
					}

					token := client.Publish(os.Getenv("BROKER_TOPIC"), 1, false, string(jsonBytesPayload))
					log.Printf("Published: %s, on topic: %s", string(jsonBytesPayload), os.Getenv("BROKER_TOPIC"))
					token.Wait()
					time.Sleep(120 * time.Second)
				}
			}(station)
		}
	}(stations)
	wg.Wait()

	go func() {
		if err := kafkaRepository.Consume(msgChan); err != nil {
			log.Printf("Error consuming kafka queue: %v", err)
		}
	}()

	for msg := range msgChan {
		dto := usecase.CreateStationOutputDTO{}
		err := json.Unmarshal(msg.Value, &dto)
		if err != nil {
			log.Println("Error unmarshalling JSON into type:", err)
		}
		log.Printf("Starting station: %v", dto)
		go func(dto usecase.CreateStationOutputDTO) {
			opts := MQTT.NewClientOptions().AddBroker(fmt.Sprintf("tcp://%s:%s", os.Getenv("BROKER_URL"), os.Getenv("BROKER_PORT"))).SetClientID(dto.Station_ID)
			client := MQTT.NewClient(opts)
			if session := client.Connect(); session.Wait() && session.Error() != nil {
				log.Fatalf("Failed to connect to MQTT broker: %v", session.Error())
			}
			for {
				payload, err := entity.NewStationPayload(
					dto.Station_ID,
					dto.Params,
					dto.Latitude,
					dto.Longitude,
				)
				if err != nil {
					log.Fatalf("Failed to create payload: %v", err)
				}

				jsonBytesPayload, err := json.Marshal(payload)
				if err != nil {
					log.Println("Error converting to JSON:", err)
				}

				token := client.Publish(os.Getenv("BROKER_TOPIC"), 1, false, string(jsonBytesPayload))
				log.Printf("Published: %s, on topic: %s", string(jsonBytesPayload), os.Getenv("BROKER_TOPIC"))
				token.Wait()
				time.Sleep(120 * time.Second)
			}
		}(dto)
	}
}

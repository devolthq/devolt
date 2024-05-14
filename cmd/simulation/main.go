package main

import (
	"context"
	"encoding/json"
	"fmt"
	"github.com/devolthq/devolt/internal/domain/dto"
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
		"bootstrap.servers":  os.Getenv("KAFKA_BOOTSTRAP_SERVER"),
		"session.timeout.ms": 6000,
		"group.id":           os.Getenv("KAFKA_GROUP_ID"),
		"auto.offset.reset":  "latest",
	}

	msgChan := make(chan *ckafka.Message)
	kafkaRepository := kafka.NewKafkaConsumer([]string{os.Getenv("KAFKA_HANDLER_TOPIC_NAME")}, consumerConfigMap)
	deviceRepository := repository.NewDeviceRepositoryMongo(client, "mongodb", "devices")
	findAllDevicesUseCase := usecase.NewFindAllDevicesUseCase(deviceRepository)

	devices, err := findAllDevicesUseCase.Execute()
	if err != nil {
		log.Fatalf("Failed to find all devices: %v", err)
	}

	var wg sync.WaitGroup

	wg.Add(1)
	go func(devices []*dto.FindAllDevicesOutputDTO) {
		defer wg.Done()
		for _, device := range devices {
			log.Printf("Starting device: %v", device)
			go func(device *dto.FindAllDevicesOutputDTO) {
				opts := MQTT.NewClientOptions().AddBroker(fmt.Sprintf("tcp://%s:%s", os.Getenv("BROKER_URL"), os.Getenv("BROKER_PORT"))).SetClientID(device.Device_ID)
				client := MQTT.NewClient(opts)
				if session := client.Connect(); session.Wait() && session.Error() != nil {
					log.Fatalf("Failed to connect to MQTT broker: %v", session.Error())
				}
				for {
					payload, err := entity.NewPayload(
						device.Device_ID,
						device.Owner,
						device.Params,
						device.Latitude,
						device.Longitude,
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
			}(device)
		}
	}(devices)
	wg.Wait()

	go func() {
		if err := kafkaRepository.Consume(msgChan); err != nil {
			log.Printf("Error consuming kafka queue: %v", err)
		}
	}()

	for msg := range msgChan {
		raw := dto.CreateDeviceOutputDTO{}
		err := json.Unmarshal(msg.Value, &raw)
		if err != nil {
			log.Println("Error unmarshalling JSON into type:", err)
		}
		log.Printf("Starting device: %v", raw)
		go func(raw dto.CreateDeviceOutputDTO) {
			opts := MQTT.NewClientOptions().AddBroker(fmt.Sprintf("tcp://%s:%s", os.Getenv("BROKER_URL"), os.Getenv("BROKER_PORT"))).SetClientID(raw.Device_ID)
			client := MQTT.NewClient(opts)
			if session := client.Connect(); session.Wait() && session.Error() != nil {
				log.Fatalf("Failed to connect to MQTT broker: %v", session.Error())
			}
			for {
				payload, err := entity.NewPayload(
					raw.Device_ID,
					raw.Owner,
					raw.Params,
					raw.Latitude,
					raw.Longitude,
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
		}(raw)
	}
}

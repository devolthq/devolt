package main

import (
	"encoding/json"
	"fmt"
	"log"
	"os"
	"sync"
	"time"

	ckafka "github.com/confluentinc/confluent-kafka-go/v2/kafka"
	"github.com/devolthq/devolt/configs"
	"github.com/devolthq/devolt/internal/domain/entity"
	"github.com/devolthq/devolt/internal/infra/database"
	"github.com/devolthq/devolt/internal/infra/kafka"
	"github.com/devolthq/devolt/internal/usecase/device_usecase"
	"github.com/devolthq/devolt/pkg/router"
	MQTT "github.com/eclipse/paho.mqtt.golang"
)

func main() {
	//////////////////////// Configs //////////////////////////

	client, err := configs.SetupMongoDB()
	if err != nil {
		log.Fatalf("Failed to connect to MongoDB: %v", err)
	}

	////////////////////////// Kafka Consumer //////////////////////////

	consumerConfigMap := &ckafka.ConfigMap{
		"bootstrap.servers":  os.Getenv("KAFKA_BOOTSTRAP_SERVER"),
		"session.timeout.ms": 6000,
		"group.id":           os.Getenv("KAFKA_GROUP_ID"),
		"auto.offset.reset":  "latest",
	}

	msgChan := make(chan *ckafka.Message)
	kafkaRepository := kafka.NewKafkaConsumer([]string{os.Getenv("KAFKA_HANDLER_TOPIC_NAME")}, consumerConfigMap)

	////////////////////// Load .PEM Private Key //////////////////////

	privateKey, err := configs.ECDSAPrivateKey()
	if err != nil {
		log.Fatalf("Failed to load private key: %v", err)
	}

	///////////////////////// Repositiories ///////////////////////////

	deviceRepository := database.NewDeviceRepositoryMongo(client, "mongodb", "devices")
	findAllDevicesUseCase := device_usecase.NewFindAllDevicesUseCase(deviceRepository)

	////////////////////// Devices From MongoDB ////////////////////////

	devices, err := findAllDevicesUseCase.Execute()
	if err != nil {
		log.Fatalf("Failed to find all devices: %v", err)
	}

	var wg sync.WaitGroup

	wg.Add(1)
	go func(devices []*device_usecase.FindAllDevicesOutputDTO) {
		defer wg.Done()
		for _, device := range devices {
			log.Printf("Starting device: %v", device)
			// TODO: create an usecase for this instead duplicate the code
			go func(device *device_usecase.FindAllDevicesOutputDTO) {
				opts := MQTT.NewClientOptions().AddBroker(fmt.Sprintf("tcp://%s:%s", os.Getenv("BROKER_URL"), os.Getenv("BROKER_PORT"))).SetClientID(device.Id)
				client := MQTT.NewClient(opts)
				if session := client.Connect(); session.Wait() && session.Error() != nil {
					log.Fatalf("Failed to connect to MQTT broker: %v", session.Error())
				}
				for {
					payload, err := entity.NewPayload(
						device.Id,
						device.Wallet,
						device.Params,
						device.Latitude,
						device.Longitude,
					)
					if err != nil {
						log.Fatalf("Failed to create payload: %v", err)
					}

					jsonBytesPayload, err := json.Marshal(payload)
					if err != nil {
						log.Fatalf("Error converting payload to JSON: %v", err)
					}

					report, err := entity.NewReport(privateKey, jsonBytesPayload)
					if err != nil {
						log.Fatalf("Failed to create report: %v", err)
					}

					jsonBytesReport, err := json.Marshal(report)
					if err != nil {
						log.Fatalf("Error converting report to JSON: %v", err)
					}

					// TODO: use capnp instead
					deviceInputData := router.AdvanceRequest{
						Path:    "report",
						Payload: jsonBytesReport,
					}

					jsonBytesDeviceInputData, err := json.Marshal(deviceInputData)
					if err != nil {
						log.Fatalf("Error converting device input data to JSON: %v", err)
					}

					token := client.Publish(os.Getenv("BROKER_TOPIC"), 1, false, jsonBytesDeviceInputData)
					log.Printf("Published: %s, on topic: %s", jsonBytesDeviceInputData, os.Getenv("BROKER_TOPIC"))
					token.Wait()
					time.Sleep(120 * time.Second)
				}
			}(device)
		}
	}(devices)
	wg.Wait()

	//////////////////////// Kafka Consumer ////////////////////////

	go func() {
		if err := kafkaRepository.Consume(msgChan); err != nil {
			log.Printf("Error consuming kafka queue: %v", err)
		}
	}()

	//////////////////////// Devices From Kafka ////////////////////////

	for msg := range msgChan {
		raw := device_usecase.CreateDeviceOutputDTO{}
		err := json.Unmarshal(msg.Value, &raw)
		if err != nil {
			log.Println("Error unmarshalling JSON into type:", err)
		}
		log.Printf("Starting device: %v", raw)
		go func(device device_usecase.CreateDeviceOutputDTO) {
			opts := MQTT.NewClientOptions().AddBroker(fmt.Sprintf("tcp://%s:%s", os.Getenv("BROKER_URL"), os.Getenv("BROKER_PORT"))).SetClientID(device.Id)
			client := MQTT.NewClient(opts)
			if session := client.Connect(); session.Wait() && session.Error() != nil {
				log.Fatalf("Failed to connect to MQTT broker: %v", session.Error())
			}
			for {
				payload, err := entity.NewPayload(
					device.Id,
					device.Wallet,
					device.Params,
					device.Latitude,
					device.Longitude,
				)
				if err != nil {
					log.Fatalf("Failed to create payload: %v", err)
				}

				jsonBytesPayload, err := json.Marshal(payload)
				if err != nil {
					log.Fatalf("Error converting payload to JSON: %v", err)
				}

				report, err := entity.NewReport(privateKey, jsonBytesPayload)
				if err != nil {
					log.Fatalf("Failed to create report: %v", err)
				}

				jsonBytesReport, err := json.Marshal(report)
				if err != nil {
					log.Fatalf("Error converting report to JSON: %v", err)
				}

				// TODO: use capnp instead
				deviceInputData := router.AdvanceRequest{
					Path:    "report",
					Payload: jsonBytesReport,
				}

				jsonBytesDeviceInputData, err := json.Marshal(deviceInputData)
				if err != nil {
					log.Fatalf("Error converting device input data to JSON: %v", err)
				}

				token := client.Publish(os.Getenv("BROKER_TOPIC"), 1, false, jsonBytesDeviceInputData)
				log.Printf("Published: %s, on topic: %s", jsonBytesDeviceInputData, os.Getenv("BROKER_TOPIC"))
				token.Wait()
				time.Sleep(120 * time.Second)
			}
		}(raw)
	}
}

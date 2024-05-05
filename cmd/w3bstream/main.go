package main

import (
	"context"
	"google.golang.org/protobuf/proto"
	"fmt"
	"github.com/google/uuid"
	"github.com/devolthq/devolt/internal/infra/repository"
	"github.com/devolthq/devolt/internal/infra/machinefi"
	"github.com/devolthq/devolt/internal/usecase"
	"github.com/machinefi/w3bstream/pkg/depends/base/types"
	MQTT "github.com/machinefi/w3bstream/pkg/depends/conf/mqtt"
	"github.com/machinefi/w3bstream/pkg/depends/protocol/eventpb"
	"github.com/machinefi/w3bstream/pkg/depends/x/misc/retry"
	"github.com/devolthq/devolt/internal/domain/entity"
	"github.com/pkg/errors"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
	"log"
	"os"
	"strconv"
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

	repository := repository.NewStationRepositoryMongo(client, "mongodb", "stations")
	findAllStationsUseCase := usecase.NewFindAllStationsUseCase(repository)

	stations, err := findAllStationsUseCase.Execute()
	if err != nil {
		log.Fatalf("Failed to find all stations: %v", err)
	}

	port, err := strconv.Atoi(os.Getenv("W3BSTREAM_MQTT_PORT"))
	if err != nil {
		log.Fatalf("Failed to parse port: %v", err)
	}

	opts := &MQTT.Broker{
		Server: types.Endpoint{
			Scheme:   "mqtt",
			Hostname: os.Getenv("W3BSTREAM_MQTT_HOST"),
			Port:     uint16(port),
		},
		Retry:     *retry.Default,
		Timeout:   types.Duration(time.Second * time.Duration(10)),
		Keepalive: types.Duration(time.Second * time.Duration(10)),
		QoS:       MQTT.QOS__ONCE,
	}
	opts.SetDefault()
	if err := opts.Init(); err != nil {
		panic(errors.Wrap(err, "init broker"))
	}

	var wg sync.WaitGroup
	for _, station := range stations {
		wg.Add(1)
		log.Printf("Starting station: %v", station)
		go func(station usecase.FindAllStationsOutputDTO) {
			defer wg.Done()
			client, err := machinefi.NewMachineFiMqttClient(station.Station_ID, opts)
			if err != nil {
				log.Fatalf("Failed to create client: %v", err)
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

				jsonPayload := &eventpb.Event{
					Header: &eventpb.Header{
						Token:   os.Getenv("W3BSTREAM_MQTT_TOKEN"),
						PubTime: time.Now().UTC().UnixMicro(),
						EventId: uuid.NewString(),
						PubId:   uuid.NewString(),
					},
					Payload: []byte(fmt.Sprintf("%v", payload)),
				}
				
				jsonBytesPayload, err := proto.Marshal(jsonPayload)
				if err != nil {
					log.Println("Error converting to JSON:", err)
				}

				err = client.Publish(os.Getenv("W3BSTREAM_MQTT_TOPIC"), jsonBytesPayload)
				if err != nil {
					log.Println("Error publishing message:", err)
				}
				time.Sleep(120 * time.Second)
			}
		}(station)
	}
	wg.Wait()
}
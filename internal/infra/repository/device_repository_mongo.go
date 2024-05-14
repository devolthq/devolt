package repository

import (
	"context"
	"encoding/json"
	"fmt"
	"github.com/devolthq/devolt/internal/domain/entity"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/mongo"
	"log"
)

type DeviceRepositoryMongo struct {
	Collection *mongo.Collection
}

func NewDeviceRepositoryMongo(client *mongo.Client, dbName string, collection string) *DeviceRepositoryMongo {
	devicesCollection := client.Database(dbName).Collection(collection)
	return &DeviceRepositoryMongo{
		Collection: devicesCollection,
	}
}

func (s *DeviceRepositoryMongo) CreateDevice(input *entity.Device) (error) {
	insertId, err := s.Collection.InsertOne(context.TODO(), input)
	log.Printf("Inserting device %s into the MongoDB collection: %s", insertId, s.Collection.Name())
	return err
}

func (s *DeviceRepositoryMongo) FindAllDevices() ([]*entity.Device, error) {
	cur, err := s.Collection.Find(context.TODO(), bson.D{})
	log.Printf("Selecting all devices from the MongoDB collection %s", s.Collection.Name())
	if err != nil {
		return nil, err
	}
	defer cur.Close(context.TODO())

	var devices []*entity.Device
	for cur.Next(context.TODO()) {
		var device bson.M
		err := cur.Decode(&device)
		if err == mongo.ErrNoDocuments {
			fmt.Printf("No document was found")
		} else if err != nil {
			return nil, err
		}

		jsonDeviceData, err := json.MarshalIndent(device, "", " ")
		if err != nil {
			return nil, err
		}

		var deviceData entity.Device
		err = json.Unmarshal(jsonDeviceData, &deviceData)
		if err != nil {
			return nil, err
		}
		devices = append(devices, &deviceData)
	}

	if err := cur.Err(); err != nil {
		return nil, err
	}
	return devices, nil
}
package main

import (
	ckafka "github.com/confluentinc/confluent-kafka-go/v2/kafka"
	"github.com/devolthq/devolt/internal/infra/kafka"
	"github.com/devolthq/devolt/pkg/rollups_contracts"
	"github.com/ethereum/go-ethereum/common"
	"github.com/devolthq/devolt/configs"
	"log"
	"os"
)

func main() {

	//////////////////////// Kafka Config //////////////////////////

	msgChan := make(chan *ckafka.Message)
	configMap := &ckafka.ConfigMap{
		"bootstrap.servers":  os.Getenv("KAFKA_BOOTSTRAP_SERVER"),
		"session.timeout.ms": 6000,
		"group.id":           os.Getenv("KAFKA_GROUP_ID"),
		"auto.offset.reset":  "latest",
	}

	///////////////////// Blockchain Config //////////////////////
	
	client, opts, err := configs.SetupTransactor()
	if err != nil {
		log.Fatalf("Failed to create transactor: %v", err)
	}

	instance, err := rollups_contracts.NewInputBox(common.HexToAddress(os.Getenv("INPUT_BOX_CONTRACT_ADDRESS")), client)
	if err != nil {
		log.Fatalf("Failed to create instance: %v", err)
	}

	//////////////////////// Repository //////////////////////////

	kafkaRepository := kafka.NewKafkaConsumer([]string{os.Getenv("KAFKA_SIMULATION_TOPIC_NAME")}, configMap)

	/////////////////////// Kafka Consuemr ///////////////////////

	go func() {
		if err := kafkaRepository.Consume(msgChan); err != nil {
			log.Fatalf("Error consuming kafka queue: %v", err)
		}
	}()

	////////////////////////// Streaming to Input Box Contract //////////////////////////

	for msg := range msgChan {
		if transaction, err := instance.AddInput(opts, common.HexToAddress(os.Getenv("APPLICATION_CONTRACT_ADDRESS")), msg.Value); err != nil {
			log.Fatalf("Failed to add input: %v", err)
		} else {
			log.Printf("Transaction sent with hash: %v, payload: %v and gas: %v", transaction.Hash().Hex(), string(msg.Value), transaction.GasPrice().Uint64())
		}
	}
}

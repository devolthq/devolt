package main

import (
	"context"
	ckafka "github.com/confluentinc/confluent-kafka-go/v2/kafka"
	"github.com/devolthq/devolt/internal/infra/kafka"
	"github.com/devolthq/devolt/pkg/rollups-contracts"
	"github.com/ethereum/go-ethereum/accounts/abi/bind"
	"github.com/ethereum/go-ethereum/common"
	"github.com/ethereum/go-ethereum/crypto"
	"github.com/ethereum/go-ethereum/ethclient"
	"log"
	"os"
)

func main() {
	msgChan := make(chan *ckafka.Message)
	configMap := &ckafka.ConfigMap{
		"bootstrap.servers":  os.Getenv("KAFKA_BOOTSTRAP_SERVER"),
		"session.timeout.ms": 6000,
		"group.id":           os.Getenv("KAFKA_GROUP_ID"),
		"auto.offset.reset":  "latest",
	}

	client, err := ethclient.Dial(os.Getenv("TESTNET_RPC_URL"))
	if err != nil {
		log.Fatalf("Failed to connect to blockchain: %v", err)
	}

	chainId, err := client.NetworkID(context.Background())
	if err != nil {
		log.Fatalf("Failed to get chain ID: %v", err)
	}

	privateKey, err := crypto.HexToECDSA(os.Getenv("TESTNET_PRIVATE_KEY"))
	if err != nil {
		log.Fatalf("Failed to parse private key: %v", err)
	}

	opts, err := bind.NewKeyedTransactorWithChainID(privateKey, chainId)
	if err != nil {
		log.Fatalf("Failed to create transactor: %v", err)
	}

	instance, err := cartesi.NewInputBox(common.HexToAddress(os.Getenv("INPUT_BOX_CONTRACT_ADDRESS")), client)
	if err != nil {
		log.Fatalf("Failed to create instance: %v", err)
	}

	kafkaRepository := kafka.NewKafkaConsumer([]string{os.Getenv("KAFKA_SIMULATION_TOPIC_NAME")}, configMap)

	go func() {
		if err := kafkaRepository.Consume(msgChan); err != nil {
			log.Printf("Error consuming kafka queue: %v", err)
		}
	}()

	for msg := range msgChan {
		if transaction, err := instance.AddInput(opts, common.HexToAddress(os.Getenv("APPLICATION_CONTRACT_ADDRESS")), msg.Value); err != nil {
			log.Fatalf("Failed to add input: %v", err)
		} else {
			log.Printf("Transaction sent with hash: %v, payload: %v and gas: %v", transaction.Hash().Hex(), string(msg.Value), transaction.GasPrice().Uint64())
		}
	}
}

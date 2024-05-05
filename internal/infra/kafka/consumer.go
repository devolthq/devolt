package kafka

import (
	"fmt"
	ckafka "github.com/confluentinc/confluent-kafka-go/v2/kafka"
	"log"
)

type KafkaConsumer struct {
	Topics    []string
	ConfigMap *ckafka.ConfigMap
}

func NewKafkaConsumer(topics []string, configMap *ckafka.ConfigMap) *KafkaConsumer {
	return &KafkaConsumer{
		Topics:    topics,
		ConfigMap: configMap,
	}
}

func (c *KafkaConsumer) Consume(msgChan chan *ckafka.Message) error {
	consumer, err := ckafka.NewConsumer(c.ConfigMap)
	if err != nil {
		return fmt.Errorf("failed to create Kafka consumer: %v", err)
	}

	defer func() {
		if err := consumer.Close(); err != nil {
			log.Printf("Error closing Kafka consumer: %v", err)
		}
	}()

	err = consumer.SubscribeTopics(c.Topics, nil)
	if err != nil {
		return fmt.Errorf("failed to subscribe to topics: %v", err)
	}
	
	for {
		msg, err := consumer.ReadMessage(-1)
		if err == nil {
			msgChan <- msg
			log.Printf("Consuming message on %s: %s", *msg.TopicPartition.Topic, string(msg.Value))
		} else {
			return fmt.Errorf("failed to read message: %v", err)
		}
	}
}

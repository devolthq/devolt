package kafka

import (
	"log"
	ckafka "github.com/confluentinc/confluent-kafka-go/v2/kafka"
)

type KafkaProducer struct {
	ConfigMap *ckafka.ConfigMap
}

func NewKafkaProducer(configMap *ckafka.ConfigMap) *KafkaProducer {
	return &KafkaProducer{
		ConfigMap: configMap,
	}
}

func (p *KafkaProducer) Produce(msg interface{}, key []byte, topic string) error {
	producer, err := ckafka.NewProducer(p.ConfigMap)
	if err != nil {
		return err
	}

	message := &ckafka.Message{
		TopicPartition: ckafka.TopicPartition{Topic: &topic, Partition: ckafka.PartitionAny},
		Key:            key,
		Value:          msg.([]byte),
	}

	err = producer.Produce(message, nil)
	if err != nil {
		return err
	} else {
		log.Printf("Producing message on %s: %s", message.TopicPartition, string(message.Value))
	}
	return nil
}

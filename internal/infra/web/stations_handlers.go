package web

import (
	"encoding/json"
	"github.com/devolthq/devolt/internal/infra/kafka"
	"github.com/devolthq/devolt/internal/usecase"
	"net/http"
	"os"
)

type StationHandlers struct {
	FindAllStationsUseCase *usecase.FindAllStationsUseCase
	CreateStationUseCase   *usecase.CreateStationUseCase
	KafkaClient            *kafka.KafkaProducer
}

func NewStationHandlers(findAllStationsUseCase *usecase.FindAllStationsUseCase, createStationUseCase *usecase.CreateStationUseCase, kafkaClient *kafka.KafkaProducer) *StationHandlers {
	return &StationHandlers{FindAllStationsUseCase: findAllStationsUseCase, CreateStationUseCase: createStationUseCase, KafkaClient: kafkaClient}
}

func (s *StationHandlers) CreateSensorHandler(w http.ResponseWriter, r *http.Request) {
	var input usecase.CreateStationInputDTO
	err := json.NewDecoder(r.Body).Decode(&input)
	if err != nil {
		w.WriteHeader(http.StatusBadRequest)
		return
	}
	output, err := s.CreateStationUseCase.Execute(input)
	if err != nil {
		w.WriteHeader(http.StatusInternalServerError)
		return
	}
	outputBytes, err := json.Marshal(output)
	if err != nil {
		w.WriteHeader(http.StatusInternalServerError)
		return
	}
	s.KafkaClient.Produce(outputBytes, []byte("new_station"), os.Getenv("CONFLUENT_KAFKA_HANDLER_TOPIC_NAME"))
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(output)
}

func (s *StationHandlers) FindAllStationsHandler(w http.ResponseWriter, r *http.Request) {
	output, err := s.FindAllStationsUseCase.Execute()
	if err != nil {
		w.WriteHeader(http.StatusInternalServerError)
		return
	}
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(output)
}

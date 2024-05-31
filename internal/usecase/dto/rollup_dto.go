package dto

type AdvaceInputDTO struct {
	Kind string `json:"kind"`
	Payload []byte `json:"payload"`
}
package dto

type RollupPayloadInputDTO struct {
	Kind string `json:"kind"`
	Payload []byte `json:"payload"`
}
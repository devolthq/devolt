package dto

import (
	"math/big"
)

type DeviceSignedDataDTO struct {
	R       *big.Int `json:"r"`
	S       *big.Int `json:"s"`
	Payload []byte   `json:"payload"`
}



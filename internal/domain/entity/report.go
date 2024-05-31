package entity

import (
	"crypto/ecdsa"
	"crypto/rand"
	"fmt"
	"math/big"
)

type Report struct {
	R       *big.Int `json:"r"`
	S       *big.Int `json:"s"`
	Payload []byte   `json:"payload"`
}

func NewReport(privateKey *ecdsa.PrivateKey, payload []byte) (*Report, error) {
	r, s, err := ecdsa.Sign(rand.Reader, privateKey, payload)
	if err != nil {
		return nil, fmt.Errorf("failed to sign: %v", err)
	}
	return &Report{
		R:       r,
		S:       s,
		Payload: payload,
	}, nil
}
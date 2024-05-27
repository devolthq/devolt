package configs

import (
	"crypto/ecdsa"
	"crypto/x509"
	"encoding/pem"
	"fmt"
	"os"
)

func ECDSAPrivateKey() (*ecdsa.PrivateKey, error) {
	// TODO: remove hardcoded approach and use env variables with LookupEnv()
	privateKeyPemData, err := os.ReadFile("./private_key.pem")
	if err != nil {
		return nil, fmt.Errorf("failed to read private key: %v", err)
	}

	block, _ := pem.Decode(privateKeyPemData)
	if block == nil {
		return nil, fmt.Errorf("failed to parse PEM block containing the private key")
	}

	privateKey, err := x509.ParseECPrivateKey(block.Bytes)
	if err != nil {
		return nil, fmt.Errorf("failed to parse private key: %v", err)
	}
	return privateKey, err
}

func ECDSAPublicKey() (*ecdsa.PublicKey, error) {
	// TODO: remove hardcoded approach and use env variables with LookupEnv()
	publicKeyPemData, err := os.ReadFile("public_key.pem")
	if err != nil {
		return nil, fmt.Errorf("failed to read public key: %v", err)
	}

	block, _ := pem.Decode(publicKeyPemData)
	if block == nil {
		return nil, fmt.Errorf("failed to parse PEM block containing the public key")
	}

	publicKey, err := x509.ParsePKIXPublicKey(block.Bytes)
	if err != nil {
		return nil, fmt.Errorf("failed to parse public key: %v", err)
	}

	return publicKey.(*ecdsa.PublicKey), err
}
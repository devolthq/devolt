package main

import (
	"crypto/ecdsa"
	"crypto/elliptic"
	"crypto/rand"
	"crypto/x509"
	"encoding/pem"
	"log"
	"os"
	"path/filepath"
)

func main() {
	privateKey, err := ecdsa.GenerateKey(elliptic.P256(), rand.Reader)
	if err != nil {
		panic(err)
	}

	publicKeyBytes, err := x509.MarshalPKIXPublicKey(&privateKey.PublicKey)
	if err != nil {
		panic(err)
	}
	publicKeyPEM := &pem.Block{
		Type:  "PUBLIC KEY",
		Bytes: publicKeyBytes,
	}

	dir := "."
	if err := os.MkdirAll(dir, os.ModePerm); err != nil {
		panic(err)
	}

	publicKeyFilePath := filepath.Join(dir, "public_key.pem")
	publicKeyFile, err := os.Create(publicKeyFilePath)
	if err != nil {
		panic(err)
	}
	defer publicKeyFile.Close()
	if err := pem.Encode(publicKeyFile, publicKeyPEM); err != nil {
		panic(err)
	}

	log.Printf("Archive .pem for public key created at: %s", publicKeyFilePath)
}

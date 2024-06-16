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

	privateKeyBytes, err := x509.MarshalECPrivateKey(privateKey)
	if err != nil {
		panic(err)
	}
	privateKeyPEM := &pem.Block{
		Type:  "ECDSA PRIVATE KEY",
		Bytes: privateKeyBytes,
	}

	publicKeyBytes, err := x509.MarshalPKIXPublicKey(&privateKey.PublicKey)
	if err != nil {
		panic(err)
	}
	publicKeyPEM := &pem.Block{
		Type:  "ECDSA PUBLIC KEY",
		Bytes: publicKeyBytes,
	}

	dir := "."
	if err := os.MkdirAll(dir, os.ModePerm); err != nil {
		panic(err)
	}

	privateKeyFilePath := filepath.Join(dir, "private_key.pem")
	privateKeyFile, err := os.Create(privateKeyFilePath)
	if err != nil {
		panic(err)
	}
	defer privateKeyFile.Close()
	if err := pem.Encode(privateKeyFile, privateKeyPEM); err != nil {
		panic(err)
	}
	log.Printf(".pem archive for private key created in: %s", privateKeyFilePath)

	publicKeyFilePath := filepath.Join(dir, "public_key.pem")
	publicKeyFile, err := os.Create(publicKeyFilePath)
	if err != nil {
		panic(err)
	}
	defer publicKeyFile.Close()
	if err := pem.Encode(publicKeyFile, publicKeyPEM); err != nil {
		panic(err)
	}
	log.Printf(".pem archive for public key created in: %s", publicKeyFilePath)
}

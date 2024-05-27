package configs

import (
	"context"
	"fmt"
	"github.com/ethereum/go-ethereum/accounts/abi/bind"
	"github.com/ethereum/go-ethereum/crypto"
	"github.com/ethereum/go-ethereum/ethclient"
	"os"
)

func SetupTransactor() (*ethclient.Client, *bind.TransactOpts, error) {
	// TODO: reduce env variables to only a url with LookupEnv()
	client, err := ethclient.Dial(os.Getenv("TESTNET_RPC_URL"))
	if err != nil {
		return nil, nil, fmt.Errorf("failed to connect to blockchain: %v", err)
	}

	chainId, err := client.NetworkID(context.Background())
	if err != nil {
		return nil, nil, fmt.Errorf("failed to get chain id: %v", err)
	}

	privateKey, err := crypto.HexToECDSA(os.Getenv("TESTNET_PRIVATE_KEY"))
	if err != nil {
		return nil, nil, fmt.Errorf("failed to load private key: %v", err)
	}

	opts, err := bind.NewKeyedTransactorWithChainID(privateKey, chainId)
	if err != nil {
		return nil, nil, fmt.Errorf("failed to create transactor: %v", err)
	}
	return client, opts, err
}

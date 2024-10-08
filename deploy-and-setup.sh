#!/bin/bash

# Start the Solana test validator with Light Protocol
# light test-validator

# Set Solana CLI to use localnet
solana config set --url localhost

# Airdrop SOL to the default keypair
solana airdrop 2

echo "Creating tokens..."

echo "USDC Token"
USDC_MINT=$(spl-token create-token --decimals 6 --mint-authority admDPuh7ALjfpNr7pupdL7KE7ZCwW8iRuExWFrvZZkX | grep -oP '(?<=Creating token ).*')

echo "VOLT Token"
VOLT_MINT=$(spl-token create-token --decimals 6 --mint-authority admDPuh7ALjfpNr7pupdL7KE7ZCwW8iRuExWFrvZZkX | grep -oP '(?<=Creating token ).*')

# Airdrop SOL to specific keypairs
solana airdrop 1 con9L1bjbUHHJiLLBbzBwWXmyerS54Hw5kEhvf4YkQS
solana airdrop 1 prozjgfrKQP59jGSXJkNKNSVFKCZNnS7FRqAt7dnvpA

# Create token accounts for Producer, Consumer, and DeVolt
PRODUCER_ACCOUNT=$(spl-token create-account $USDC_MINT | grep -oP '(?<=Creating account ).*')
CONSUMER_ACCOUNT=$(spl-token create-account $USDC_MINT | grep -oP '(?<=Creating account ).*')
DEVOLT_ACCOUNT=$(spl-token create-account $USDC_MINT | grep -oP '(?<=Creating account ).*')

# Mint USDC tokens
spl-token mint $USDC_MINT 1000 $PRODUCER_ACCOUNT
spl-token mint $USDC_MINT 1000 $CONSUMER_ACCOUNT
spl-token mint $USDC_MINT 1000 $DEVOLT_ACCOUNT

# Deploy the Anchor program
# anchor deploy --provider.cluster localnet
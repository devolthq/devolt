#!/bin/bash

# Start the Solana test validator with Light Protocol
# light test-validator

# Set Solana CLI to use localnet
solana config set --url localhost

# Airdrop SOL to the default keypair
solana airdrop 2

echo "Creating tokens..."

echo "USDC Token"
spl-token create-token --decimals 6 --mint-authority admDPuh7ALjfpNr7pupdL7KE7ZCwW8iRuExWFrvZZkX

echo "VOLT Token"
spl-token create-token --decimals 6 --mint-authority admDPuh7ALjfpNr7pupdL7KE7ZCwW8iRuExWFrvZZkX

# Airdrop SOL to specific keypairs
solana airdrop 5 con9L1bjbUHHJiLLBbzBwWXmyerS54Hw5kEhvf4YkQS
solana airdrop 5 prozjgfrKQP59jGSXJkNKNSVFKCZNnS7FRqAt7dnvpA

# Deploy the Anchor program
# anchor deploy --provider.cluster localnet
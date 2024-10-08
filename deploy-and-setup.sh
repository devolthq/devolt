#!/bin/bash

solana config set --url localhost

solana airdrop 2

echo "Creating tokens..."

echo "USDC Token"
spl-token create-token --decimals 6 --mint-authority admDPuh7ALjfpNr7pupdL7KE7ZCwW8iRuExWFrvZZkX

echo "VOLT Token"
spl-token create-token --decimals 6 --mint-authority admDPuh7ALjfpNr7pupdL7KE7ZCwW8iRuExWFrvZZkX

solana airdrop 5 con9L1bjbUHHJiLLBbzBwWXmyerS54Hw5kEhvf4YkQS
solana airdrop 5 prozjgfrKQP59jGSXJkNKNSVFKCZNnS7FRqAt7dnvpA

# Then:
# light test-validator
# anchor deploy --provider.cluster localnet
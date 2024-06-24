#!/bin/sh

echo "Running e2e tests"

cartesi send generic \
--dapp=0x70ac08179605AF2D9e75782b8DEcDD3c22aA4D0C \
--chain-id=31337 \
--rpc-url=http://127.0.0.1:8545 \
--mnemonic-passphrase='test test test test test test test test test test test junk' \
--input='{"path":"tokenn","payload":"IjB4MTVkMzRhYWY1NDI2N2RiN2Q3YzM2NzgzOWFhZjcxYTAwYTJjNmE2NSI="}'
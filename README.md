# DeVolt Payment Engine

## Overview

The DeVolt Payment Engine is a decentralized application built on the Solana blockchain, facilitating secure and efficient transactions within the electric vehicle (EV) charging network. This platform enables the minting and burning of VOLT tokens in exchange for energy transactions, providing a robust solution for energy producers and EV owners.

## Deploy

This contract is deployed on the Solana Blockchain devnet under `dvtVrC31dR5qRsvne8XucZ24cfvdRPPYDN5cPExfMhE`.

## Features

-   **Energy Transactions**: Facilitates the buying and selling of energy through a decentralized network.
-   **Token Management**: Handles the minting and burning of VOLT tokens to correspond with energy transactions.
-   **Secure Escrow**: Ensures secure transaction flows through an escrow mechanism, ensuring that tokens and funds are only exchanged when agreed-upon conditions are met.

## Components

The project is structured into several components, each responsible for a part of the system's functionality:

-   **Anchor Program (`payment-engine`)**: Contains the core smart contracts written in Rust, managing all blockchain interactions.
<!-- -   **API (`api`)**: A backend service responsible for interfacing with the blockchain and providing a gateway for frontend applications.
-   **Cron Job (`cronjob`)**: Manages scheduled tasks, will be used to confirm producer/EV owners transaction of selling/buying energy. Will check DeVolt balance in USDC and VOLTs, and either confirm, or refuse and send an alert to admins. -->

## Getting Started

To set up the project locally, follow these steps:

1. **Clone the Repository**

    ```bash
    git clone https://github.com/devolthq/devolt-radar
    cd devolt-radar
    ```

2. **Install Dependencies**

    ```bash
    yarn install
    ```

3. **Run the Local Development Environment**
    ```bash
    anchor build
    anchor deploy
    ```

## Testing

To run tests for the payment engine:

```bash
anchor test
```

## Contact

For any inquiries or further information, please contact [Marcelo Feitoza](mailto:marcelo.feitoza@sou.inteli.edu.br).

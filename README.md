# Roadmap

- [ ] Finish the Auction logic;
- [ ] Implement Wire for automatic dependency injection. [reference](https://github.com/google/wire);
- [ ] Implement event dispatcher. [reference for of use kafka/messaging-system](https://github.com/devfullcycle/goexpert/blob/main/20-CleanArch/cmd/ordersystem/main.go#L53);
- [ ] Tests;
- [ ] Define custom errors on each file the requires;
- [ ] Setup air for nonodo;
- [ ] CI;
- [x] Bid Logic;
- [x] Implement router for advance and inspect handlers;
- [x] Create configuration files instead of settings in file to setup mongodb, sqlite, and others;
- [x] Change rollup Dockerfile to build with the repository;
- [x] Sign the simulation payload with ECDSA;
- [x] Migrate to gin from pure net/nttp;
- [x] Generate swagger files with [swaggo](https://github.com/swaggo/swag);
- [X] Implement a multi-stage build with librdkafka and CGO=1;
- [X] Initialize Kafka topic in the docker-compose command instead of hivemq config.xml [reference](https://github.com/epomatti/go-kafka/blob/main/README.md#running-on-docker);
- [x] CI & CD starlight;

## Future plans

- [ ] First hardware impl with raspberry pi pico 2W or raspberry pi pico W or other microcontroller;
- [ ] P&D with ERC4337;
- [ ] Change the IoT flow to mobile experience;

## Mainnet Step

- [ ] Cloud support with pulumi, aws, hivemq-cloud and confluent cloud;
- [ ] Use Confluent Cloud and HiveMQ Cloud;
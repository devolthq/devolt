# Roadmap
- [ ] Tests;
- [ ] Implement router for advance and inspect handlers;
- [ ] Create a submodule for contracts github repo;
- [ ] Migrate from sqlx to gorm or sqlc;
- [ ] Change RBAC middleware to receive a array of roles instead of a single role;
- [ ] Implement Wire for automatic dependency injection. [reference](https://github.com/google/wire);
- [ ] Implement message acknowledgement on kafka topic to create station from handler and don't remove from queue until some logic happen. [reference for of use kafka/messaging-system](https://github.com/devfullcycle/goexpert/blob/main/20-CleanArch/cmd/ordersystem/main.go#L53);
- [ ] Actualize all GetEnvs to LookupEnv;
- [ ] README.md with business part and also all entrypoints;
- [ ] Setup air for development and nonodo;
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
- [ ] Integration with w3bstream/sprout IOTEX;
- [ ] P&D with ERC4337;

## Mainnet Step
- [ ] Cloud support with pulumi, aws, hivemq-cloud and confluent cloud;
- [ ] Use Confluent Cloud and HiveMQ Cloud;

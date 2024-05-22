# Roadmap

- [ ] Rollup with cartesi;
- [ ] Tests;
- [ ] Unify Dockerfiles (monolith); [reference](https://github.com/cartesi/rollups-node/blob/main/build/Dockerfile)
- [ ] Create config files instead of in files configurations;
- [x] Sign the simulation payload with ECDSA;
- [x] Migrate to gin from pure net/nttp;
- [x] Generate swagger files with [swaggo](https://github.com/swaggo/swag);
- [X] Implement a multi-stage build with librdkafka and CGO=1;
- [X] Initialize Kafka topic in the docker-compose command instead of hivemq config.xml; [reference](https://github.com/epomatti/go-kafka/blob/main/README.md#running-on-docker)
- [ ] CLOUD support with pulumi, aws, hivemq-cloud and confluent cloud;
- [x] CI & CD starlight;
- [ ] Docs with starlight;
- [ ] README.md with business part and also all entrypoints;

## Future plans

- [ ] First hardware impl with raspberry pi pico 2W or raspberry pi pico W or other microcontroller;
- [ ] Integration with w3bstream;
- [ ] P&D with risc0 for AA and OIDC ( Google );
- [ ] P&D with ERC4337;

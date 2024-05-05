FROM golang:1.22.1

WORKDIR /src

# TODO: Copy only the necessary files to the image.

COPY .. .

RUN apt-get update && apt-get install -y librdkafka-dev

RUN go mod download -x

CMD ["go", "run", "./cmd/app/"]
# Kafka - Zookeeper

## How to create a topic

First, you will need to connect to the kafka container. To do so, you can run:

```bash
docker exec -it kafka /bin/bash
```

Then, you can specify your topic using:

```bash
kafka-topics --create --topic {topicName} --partitions {partitions} --replication-factor {replicationFactor} --bootstrap-server kafka:19092
```

### Kafka workshop topics

To run the Kafka workshop you will need the following topics:

```bash
kafka-topics --create --if-not-exists --topic approve-payment --partitions 1 --replication-factor 1 --bootstrap-server kafka:19092
```

```bash
kafka-topics --create --if-not-exists --topic payment-rejected --partitions 1 --replication-factor 1 --bootstrap-server kafka:19092
```

```bash
kafka-topics --create --if-not-exists --topic payment-approved --partitions 1 --replication-factor 1 --bootstrap-server kafka:19092
```

```bash
kafka-topics --create --if-not-exists --topic invoice-generated --partitions 1 --replication-factor 1 --bootstrap-server kafka:19092
```

### Add DOCKER_HOST_IP to .env

```bash
echo "HOST_IP=$(ifconfig | grep -E '([0-9]{1,3}\.){3}[0-9]{1,3}' | grep -v 127.0.0.1 | awk '{ print $2 }' | cut -f2 -d: | head -n1)" > .env
```

### Help for troubleshooting

[My Python/Java/Spring/Go/Whatever Client Won’t Connect to My Apache Kafka Cluster in Docker/AWS/My Brother’s Laptop. Please Help!](https://www.confluent.io/blog/kafka-client-cannot-connect-to-broker-on-aws-on-docker-etc/)
# Kafka - Zookeeper

## How to create a topic

First, you will need to connect to the kafka container. To do so, you can run:

```bash
docker exec -it kafka /bin/bash
```

Then, you can specify your topic using:

```bash
kafka-topics --create --topic {topicName} --partitions {partitions} --replication-factor {replicationFactor} --bootstrap-server localhost:9092
```

### Kafka workshop topics

To run the Kafka workshop you will need the following topics:

```bash
kafka-topics --create --if-not-exists --topic approve-payment --partitions 3 --replication-factor 1 --bootstrap-server localhost:9092
```

```bash
kafka-topics --create --if-not-exists --topic payment-rejected --partitions 3 --replication-factor 1 --bootstrap-server localhost:9092
```

```bash
kafka-topics --create --if-not-exists --topic payment-approved --partitions 3 --replication-factor 1 --bootstrap-server localhost:9092
```

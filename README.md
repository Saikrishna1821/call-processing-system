# Message Queue Based Call Processing System

This project implements a scalable outbound call-processing system using RabbitMQ and Node.js.

The system uses a message-driven architecture where call requests are published to RabbitMQ and processed asynchronously by worker services. The design ensures reliability, retry handling, fault isolation, and horizontal scalability.

## Architecture

The system consists of three main components:

1. Producer Service

   - Publishes outbound call requests to RabbitMQ.
   - Each message contains call_id, phone_number, attempt count, and timestamp.

2. RabbitMQ Broker

   - Routes messages using a direct exchange.
   - Manages main queue, retry queue, and dead letter queue.

3. Worker Service (Consumer)
   - Consumes messages from the main queue.
   - Processes calls independently.
   - Handles retries and dead-lettering for failed messages.

## Message Flow

### Successful Flow

Producer → Exchange → Main Queue → Worker → ACK

### Retry Flow

Worker Failure → Retry Queue (TTL) → Exchange → Main Queue

### Dead Letter Flow

Failure beyond retry limit → Dead Letter Queue

## Queue Design & Routing

- Exchange Type: Direct Exchange
- Routing Key: call.process

Queues:

- call_queue: Main processing queue
- call_retry_queue: Temporary retry queue with TTL
- call_dlq_queue: Dead Letter Queue for failed messages

The retry queue uses TTL and dead-letter routing to re-publish messages back to the main exchange after a delay.

## Retry & Dead Letter Strategy

- Each message contains an attempt counter.
- On failure, the worker increments the attempt count.
- If attempt ≤ max retry limit, the message is sent to the retry queue.
- If attempt exceeds the limit, the message is moved to the Dead Letter Queue.

This approach avoids infinite retry loops and allows inspection of failed messages.

## Concurrency & Scaling

- Workers use RabbitMQ prefetch to control load.
- Multiple worker instances can run in parallel.
- RabbitMQ distributes messages fairly across workers.

This allows horizontal scaling without changes to producer logic.

## Logging & Observability

- Each message is logged using call_id for traceability.
- Retry attempts and DLQ movements are logged explicitly.
- RabbitMQ Management UI is used to monitor queue depth and message flow.

## How to Run

### Prerequisites

- Node.js (v16+)
- Docker
- RabbitMQ (via Docker)

### Setup RabbitMQ

```bash
docker run -d --name rabbitmq \
  -p 5672:5672 \
  -p 15672:15672 \
  rabbitmq:3-management

npm run setup:rabbit
npm run start:worker
npm run start:producer
```

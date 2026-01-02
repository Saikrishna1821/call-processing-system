const amqp = require('amqplib');
const {
  RABBITMQ_URL,
  EXCHANGE_NAME,
  QUEUE_NAME,
  RETRY_QUEUE,
  DLQ_QUEUE,
} = require('./rabbitmq');

async function setupRabbitMQ() {
  const connection = await amqp.connect(RABBITMQ_URL);
  const channel = await connection.createChannel();

  // Exchange
  await channel.assertExchange(EXCHANGE_NAME, 'direct', {
    durable: true,
  });

  // Main Queue
  await channel.assertQueue(QUEUE_NAME, {
    durable: true,
  });

  await channel.bindQueue(QUEUE_NAME, EXCHANGE_NAME, 'call.process');

  // Retry Queue (with TTL + DLX)
  await channel.assertQueue(RETRY_QUEUE, {
    durable: true,
    arguments: {
      'x-message-ttl': 5000, // 5 seconds
      'x-dead-letter-exchange': EXCHANGE_NAME,
      'x-dead-letter-routing-key': 'call.process',
    },
  });

  // Dead Letter Queue
  await channel.assertQueue(DLQ_QUEUE, {
    durable: true,
  });

  console.log('RabbitMQ topology set up successfully');

  await channel.close();
  await connection.close();
}

module.exports = { setupRabbitMQ };

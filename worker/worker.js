const amqp = require('amqplib');

const {
  RABBITMQ_URL,
  EXCHANGE_NAME,
  QUEUE_NAME,
  RETRY_QUEUE,
  DLQ_QUEUE,
} = require('../config/rabbitmq');

const MAX_RETRY = 3;

async function startWorker() {
  const connection = await amqp.connect(RABBITMQ_URL);
  const channel = await connection.createChannel();

  // Fair dispatch: one message at a time
  channel.prefetch(1);

  await channel.consume(
    QUEUE_NAME,
    async (msg) => {
      if (!msg) return;

      const content = JSON.parse(msg.content.toString());

      console.log('Processing call:', content);

      try {
        // Simulate outbound call (random failure)
        const success = Math.random() > 0.3;

        if (!success) {
          throw new Error('Call failed');
        }

        console.log('Call successful:', content.call_id);
        channel.ack(msg);
      } catch (err) {
        content.attempt += 1;

        if (content.attempt <= MAX_RETRY) {
          console.log(
            `Retrying call ${content.call_id}, attempt ${content.attempt}`
          );

          channel.sendToQueue(
            RETRY_QUEUE,
            Buffer.from(JSON.stringify(content)),
            { persistent: true }
          );
        } else {
          console.log(`Moving call ${content.call_id} to DLQ`);

          channel.sendToQueue(
            DLQ_QUEUE,
            Buffer.from(JSON.stringify(content)),
            { persistent: true }
          );
        }

        // Remove original message
        channel.ack(msg);
      }
    },
    { noAck: false }
  );

  console.log('👷 Worker started and waiting for messages');
}

startWorker();

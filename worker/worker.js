const amqp = require("amqplib");

const {
  RABBITMQ_URL,
  QUEUE_NAME,
  RETRY_QUEUE,
  DLQ_QUEUE,
} = require("../config/rabbitmq");

const MAX_RETRY = 3;
const WORKER_ID = process.pid;

function shouldFail(phoneNumber) {
  // Deterministic failure rule
  return phoneNumber.startsWith("0");
}

async function startWorker() {
  const connection = await amqp.connect(RABBITMQ_URL);
  const channel = await connection.createChannel();

  channel.prefetch(1);

  await channel.consume(
    QUEUE_NAME,
    async (msg) => {
      if (!msg) return;

      const content = JSON.parse(msg.content.toString());
      console.log(
        `[Worker ${WORKER_ID}] Processing call`,
        content.phone_number,
        `attempt=${content.attempt}`
      );

      try {
        if (shouldFail(content.phone_number)) {
          throw new Error("Invalid phone number");
        }

        console.log(`[Worker ${WORKER_ID}] Call successful`, content.call_id);
        channel.ack(msg);
      } catch (err) {
        content.attempt += 1;

        if (content.attempt <= MAX_RETRY) {
          console.log(
            `[Worker ${WORKER_ID}] Retrying call ${content.call_id}, attempt ${content.attempt}`
          );

          channel.sendToQueue(
            RETRY_QUEUE,
            Buffer.from(JSON.stringify(content)),
            { persistent: true }
          );
        } else {
          console.log(
            `[Worker ${WORKER_ID}] Moving call ${content.call_id} to DLQ`
          );

          channel.sendToQueue(DLQ_QUEUE, Buffer.from(JSON.stringify(content)), {
            persistent: true,
          });
        }

        channel.ack(msg);
      }
    },
    { noAck: false }
  );

  console.log(`👷 Worker ${WORKER_ID} started`);
}

startWorker();

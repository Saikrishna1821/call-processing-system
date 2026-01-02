const amqp = require("amqplib");
const crypto = require("crypto");
const { RABBITMQ_URL, EXCHANGE_NAME } = require("../config/rabbitmq");
const { createMessage } = require("../config/messageScheme");

const publishCall = async (PhoneNumber) => {
  try {
    //connect to rabbitmq
    const connection = await amqp.connect(RABBITMQ_URL);
    const channel = await connection.createChannel();
    const callId = crypto.randomUUID();

    const message = createMessage(callId, PhoneNumber);
    const rountingKey = "call.process";
    await channel.publish(
      EXCHANGE_NAME,
      rountingKey,
      Buffer.from(JSON.stringify(message)),
      {
        persistent: true,
      }
    );
    console.log("Published Call Successfully");
    await channel.close();
    await connection.close();
  } catch (error) {
    console.log("Failed to Publish Call", error);
  }
};

publishCall("8465092209");

module.exports = {
  RABBITMQ_URL: 'amqp://localhost',
  EXCHANGE_NAME: 'call_exchange',
  QUEUE_NAME: 'call_queue',
  RETRY_QUEUE: 'call_retry_queue',
  DLQ_QUEUE: 'call_dlq_queue',
};

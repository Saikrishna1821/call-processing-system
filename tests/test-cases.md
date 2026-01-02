# Test Cases – Call Processing System

This document defines all test cases for validating the RabbitMQ-based outbound call processing system.

---

## 1. Message Publishing

### Steps
1. Start RabbitMQ server  
2. Ensure exchange and queues are created  
3. Start the producer service  
4. Publish an outbound call request  

### Example Input
    {
      "phone_number": "8465092209"
    }

### Expected Result
- Message is published to RabbitMQ exchange  
- Message appears in `call_queue`  
- Message contains:
  - `call_id`
  - `phone_number`
  - `attempt = 1`
  - `created_at`

---

## 2. Successful Message Consumption

### Steps
1. Start the worker service  
2. Publish a call request with a valid phone number  
3. Observe worker logs  

### Example Input
    {
      "phone_number": "9876543210"
    }

### Expected Result
- Worker consumes message from `call_queue`  
- Phone number validation passes  
- Message is acknowledged successfully  
- Message is removed from `call_queue`  
- No message is sent to retry queue  
- No message is sent to DLQ  

---

## 3. Retry Behavior (Deterministic Failure)

### Steps
1. Start the worker service  
2. Publish a call request with an invalid phone number (starts with `0`)  
3. Observe worker logs  
4. Observe retry queue  
5. Wait for retry TTL to expire  

### Example Input
    {
      "phone_number": "0987654321"
    }

### Expected Result
- Worker fails validation using `forceFailure` logic  
- Message is sent to `call_retry_queue`  
- Message remains in retry queue until TTL expires  
- After TTL expiry, message is routed back to `call_queue`  
- Message attempt count is incremented  
- Message is retried until maximum retry limit is reached  

---

## 4. Dead Letter Queue (DLQ) Handling

### Steps
1. Publish a call request with an invalid phone number (starts with `0`)  
2. Allow the message to be retried beyond the maximum retry limit  
3. Observe DLQ  

### Example Input
    {
      "phone_number": "0123456789"
    }

### Expected Result
- Message is moved to `call_dlq_queue`  
- Message remains in DLQ  
- Message is not retried further  
- Message is available for inspection  

---

## 5. Consumer Scaling and Load Distribution

### Steps
1. Start multiple worker instances  
2. Publish multiple outbound call requests  
3. Observe worker logs and RabbitMQ UI  

### Expected Result
- Messages are distributed across available worker instances  
- Each worker processes one message at a time due to `prefetch(1)`  
- No single worker processes all messages  
- Failed messages follow retry and DLQ flow correctly  

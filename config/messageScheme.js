const createMessage = (callId, PhoneNumber) => {
  return {
    call_id: callId,
    phone_number: PhoneNumber,
    attempt: 1,
    created_at: Date.now().toLocaleString()
  };
};
module.exports = { createMessage };

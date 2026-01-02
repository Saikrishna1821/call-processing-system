const createMessage = (callId, PhoneNumber) => {
  return {
    call_id: callId,
    phone_number: PhoneNumber,
    attempt: 1,
    created_at: new Date(Date.now()),
  };
};
module.exports = { createMessage };

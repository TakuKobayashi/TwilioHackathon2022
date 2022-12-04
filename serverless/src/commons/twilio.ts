import twilio from 'twilio';

const tilioClient = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);

export async function twilioCreateCall({
  twimlString,
  toPhoneNumber,
  statusCallbackUrl = null,
}: {
  twimlString: string;
  toPhoneNumber: string;
  statusCallbackUrl?: string;
}): Promise<any> {
  const createCallObj = {
    twiml: twimlString,
    from: process.env.TWILIO_US_PHONE_NUMBER,
    to: toPhoneNumber,
  };
  if (statusCallbackUrl) {
    return tilioClient.calls.create({
      ...createCallObj,
      statusCallback: statusCallbackUrl,
      statusCallbackMethod: 'POST',
    });
  } else {
    return tilioClient.calls.create(createCallObj);
  }
}

export async function twilioSendSMS({ message, toPhoneNumber }: { message: string; toPhoneNumber: string }): Promise<any> {
  return tilioClient.messages.create({
    body: message,
    from: process.env.TWILIO_US_PHONE_NUMBER,
    to: toPhoneNumber,
  });
}

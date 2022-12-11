import { SQSClient, SendMessageCommand, SendMessageCommandInput, SendMessageCommandOutput } from '@aws-sdk/client-sqs';
import axios from 'axios';

const sqsClient = new SQSClient({ region: process.env.AWS_REGION });

export async function sendSQSMessage({
  delaySeconds,
  messageBodyObject,
}: {
  delaySeconds: number;
  messageBodyObject: { [key: string]: any };
}): Promise<SendMessageCommandOutput> {
  const jsonBody = JSON.stringify(messageBodyObject);
  const params: SendMessageCommandInput = {
    QueueUrl: process.env.QUEUE_URL,
    DelaySeconds: delaySeconds,
    MessageBody: jsonBody,
  };
  return sqsClient.send(new SendMessageCommand(params));
}

export async function sendMockSQSMessage({
  delaySeconds,
  messageBodyObject,
}: {
  delaySeconds: number;
  messageBodyObject: { [key: string]: any };
}): Promise<any> {
  const currentBaseUrl = messageBodyObject.currentBaseUrl;
  // handler内の処理
  const sendData = {
    toPhoneNumber: messageBodyObject.toPhoneNumber,
    src_user_id: messageBodyObject.src_user_id,
    src_user_display_name: messageBodyObject.src_user_display_name,
    dst_user_id: messageBodyObject.dst_user_id,
    timestamp: messageBodyObject.timestamp,
    channel: messageBodyObject.channel,
    text: messageBodyObject.text,
  };
  const response = await axios.post(currentBaseUrl + '/create_twilio_call', sendData);
  const data = response.data;
  return data;
}

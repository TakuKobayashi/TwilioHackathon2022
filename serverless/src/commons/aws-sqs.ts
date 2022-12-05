import { SQSClient, SendMessageCommand, SendMessageCommandInput, SendMessageCommandOutput } from '@aws-sdk/client-sqs';

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

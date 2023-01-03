import { SQSHandler, SQSEvent, Context } from 'aws-lambda';
import { callRoutine } from './commons/util';

export const handler: SQSHandler = async (event: SQSEvent, context: Context) => {
  console.log('SQS recieved');
  for (const record of event.Records) {
    /*
    {
      messageId: 'messageId',
      receiptHandle: 'receiptHandle',
      body: 'MessageBodyで送った情報',
      attributes: {
        ApproximateReceiveCount: '1',
        SentTimestamp: '1670264442191', // 送った時刻 new Date('1670264442191') で時刻が取得できる
        SenderId: 'SenderId',
        ApproximateFirstReceiveTimestamp: '1670264502191' // 受け取った時刻 new Date('1670264502191') で時刻が取得できる
      },
      // meesageAttributes を加えて送ったら、ここでその内容を取得できる
      messageAttributes: {
        WeeksOn: {
          stringValue: '6',
          stringListValues: [],
          binaryListValues: [],
          dataType: 'Number'
          },
        },
        Title: {
          stringValue: 'The Whistler',
          stringListValues: [],
          binaryListValues: [],
          dataType: 'String'
        }
      },
      md5OfMessageAttributes: 'md5OfMessageAttributes',
      md5OfBody: 'md5OfBody',
      eventSource: 'aws:sqs',
      eventSourceARN: 'eventSourceARN',
      awsRegion: 'ap-northeast-1'
    }
    */
    const recievedMessageData = JSON.parse(record.body);
    await callRoutine(recievedMessageData);
  }
};

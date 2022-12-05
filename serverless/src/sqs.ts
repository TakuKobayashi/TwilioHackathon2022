import { SQSHandler, SQSEvent, Context } from 'aws-lambda';

export const handler: SQSHandler = async (event: SQSEvent, context: Context) => {
  console.log('RecieveSQSEvent');
  for (const record of event.Records) {
    console.log(record);
  }
};

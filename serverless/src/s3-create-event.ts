import { S3Handler, S3Event, Context } from 'aws-lambda';

export const handler: S3Handler = async (event: S3Event, context: Context) => {
  console.log(event);
};

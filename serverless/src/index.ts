import serverlessExpress from '@vendia/serverless-express';
import express from 'express';
import { lineNotifyRouter } from './routes/platforms/line/notify';
import { slackWebhookRouter } from './routes/webhooks/slack';
import { twilioWebhookRouter } from './routes/webhooks/twilio';

import { sendSQSMessage, sendMockSQSMessage } from './commons/aws-sqs';

const app = express();

app.use('/platforms/line/notify', lineNotifyRouter);
app.use('/webhooks/slack', slackWebhookRouter);
app.use('/webhooks/twilio', twilioWebhookRouter);

app.get('/test', (req, res) => {
  res.json({ hello: 'world' });
});

app.get('/send_sqs_test', async (req, res) => {
  const data = await sendSQSMessage({ delaySeconds: 20, messageBodyObject: { hello: 'world' } });
  res.json(data);
});

// When serverless offline start, access below
// http://localhost:3000/dev/
// add generate new AWS Lambda functions[api]
export const handler = serverlessExpress({ app });

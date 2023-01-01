import serverlessExpress from '@vendia/serverless-express';
import express from 'express';
import bodyParser from 'body-parser';
import path from 'path';
import {
  twilioCreateCall,
  twilioSendSMS,
  gatherTwiml,
  downloadRecordingFileStream,
  uploadToS3RecordingFileStream,
  transcribeRecordFile,
} from './commons/twilio';
import { getCurrentInvoke } from '@vendia/serverless-express';
import { lineNotifyRouter } from './routes/platforms/line/notify';
import { slackWebhookRouter } from './routes/webhooks/slack';
import { twilioWebhookRouter } from './routes/webhooks/twilio';

import { sendSQSMessage, sendMockSQSMessage } from './commons/aws-sqs';
import { getCurrentBaseUrl } from './commons/util';
import { searchRecords, updateRecord } from './commons/kintone';

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

app.post('/notify_immediately', async (req, res) => {
  const currentBaseUrl = getCurrentBaseUrl(req);

  // メンション付きのユーザーにすぐに発信するための仮の関数
  const data = await sendSQSMessage({
    delaySeconds: 20,
    messageBodyObject: {
      toPhoneNumber: req.body.toPhoneNumber,
      src_user_id: req.body.src_user_id,
      src_user_display_name: req.body.src_user_display_name,
      dst_user_id: req.body.dst_user_id,
      timestamp: req.body.timestamp,
      channel: req.body.channel,
      text: req.body.text,
      currentBaseUrl: currentBaseUrl,
    },
  });
  console.log('notify_immediately_data');
  console.log(data);
  res.json(data);
});

app.get('/twilio_sms_test', async (req, res) => {
  await twilioSendSMS({ message: 'オッス!!オラゴクウ!!', toPhoneNumber: '+818055146460' });
  res.json({ hello: 'world' });
});

app.post('/send_twilio_sms', async (req, res) => {
  await twilioSendSMS({ message: req.body.message, toPhoneNumber: req.body.toPhoneNumber });
  res.json({ status: 'OK' });
});

// When serverless offline start, access below
// http://localhost:3000/dev/
// add generate new AWS Lambda functions[api]
export const handler = serverlessExpress({ app });

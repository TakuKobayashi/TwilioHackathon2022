import serverlessExpress from '@vendia/serverless-express';
import express from 'express';
import bodyParser from 'body-parser';
import { twilioCreateCall, twilioSendSMS, gatherTwiml } from './commons/twilio';
import { getCurrentInvoke } from '@vendia/serverless-express';
import { lineNotifyRouter } from './routes/platforms/line/notify';
import { slackWebhookRouter } from './routes/webhooks/slack';
import { twilioWebhookRouter } from './routes/webhooks/twilio';

import { sendSQSMessage, sendMockSQSMessage } from './commons/aws-sqs';
import { getCurrentBaseUrl } from './commons/util';

const app = express();

// json形式のparseに必要
app.use(bodyParser.urlencoded({
  extended: true
}));
app.use(bodyParser.json());

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
  const data = await sendMockSQSMessage({
    delaySeconds: 20,
    messageBodyObject: {
      toPhoneNumber: req.body.toPhoneNumber,
      currentBaseUrl: currentBaseUrl
    }
  });
  console.log('notify_immediately_data');
  console.log(data);
  res.json(data);
});

app.get('/twilio_call_test', async (req, res) => {
  const currentInvoke = getCurrentInvoke();
  const currentBaseUrl = [req.protocol + '://' + req.get('host'), currentInvoke.event.requestContext.stage].join('/');
  const twimlString = gatherTwiml(currentBaseUrl + '/webhooks/twilio/gather_dtmf_handler');
  await twilioCreateCall({
    twimlString: twimlString,
    toPhoneNumber: '+818055146460',
    statusCallbackUrl: currentBaseUrl + '/webhooks/twilio/call_handler',
  });
  res.json({ hello: 'world' });
});

app.post('/create_twilio_call', async (req, res) => {
  const currentBaseUrl = getCurrentBaseUrl(req);

  const twimlString = gatherTwiml(currentBaseUrl + '/webhooks/twilio/gather_dtmf_handler');
  await twilioCreateCall({
    twimlString: twimlString,
    toPhoneNumber: req.body.toPhoneNumber,
    statusCallbackUrl: currentBaseUrl + '/webhooks/twilio/call_handler',
  }).then(() => {
    res.json({
      status: 'OK',
      data: {
        toPhoneNumber: req.body.toPhoneNumber,
      }
    });
  }).catch(e => {
    res.json({ status: 'NG', error: e });
  });
});

app.get('/twilio_sms_test', async (req, res) => {
  await twilioSendSMS({ message: 'オッス!!オラゴクウ!!', toPhoneNumber: '+818055146460' });
  res.json({ hello: 'world' });
});

// When serverless offline start, access below
// http://localhost:3000/dev/
// add generate new AWS Lambda functions[api]
export const handler = serverlessExpress({ app });

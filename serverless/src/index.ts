import serverlessExpress from '@vendia/serverless-express';
import express from 'express';
import twilio from 'twilio';
import { getCurrentInvoke } from '@vendia/serverless-express';
import { slackWebhookRouter } from './routes/webhooks/slack';
import { twilioWebhookRouter } from './routes/webhooks/twilio';

const tilioClient = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
const VoiceResponse = twilio.twiml.VoiceResponse;

const app = express();

app.use('/webhooks/slack', slackWebhookRouter);
app.use('/webhooks/twilio', twilioWebhookRouter);

app.get('/test', (req, res) => {
  res.json({ hello: 'world' });
});

app.get('/twilio_call_test', async (req, res) => {
  const twiml = new VoiceResponse();
  twiml.say(
    {
      language: 'ja-JP',
      voice: 'woman',
    },
    'オッス!!オラゴクウ!!',
  );
  const currentInvoke = getCurrentInvoke();
  const currentBaseUrl = [req.protocol + '://' + req.get('host'), currentInvoke.event.requestContext.stage].join('/');
  await tilioClient.calls.create({
    twiml: twiml.toString(),
    from: process.env.TWILIO_US_PHONE_NUMBER,
    to: "+818055146460",
//    statusCallback: currentBaseUrl + '/webhooks/twilio/call_handler',
//    statusCallbackMethod: 'POST',
  }),
  res.json({ hello: 'world' });
});

// When serverless offline start, access below
// http://localhost:3000/dev/
// add generate new AWS Lambda functions[api]
export const handler = serverlessExpress({ app });

import serverlessExpress from '@vendia/serverless-express';
import express from 'express';
import twilio from 'twilio';
import { twilioCreateCall } from './commons/twilio';
import { getCurrentInvoke } from '@vendia/serverless-express';
import { slackWebhookRouter } from './routes/webhooks/slack';
import { twilioWebhookRouter } from './routes/webhooks/twilio';

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
  await twilioCreateCall({
    twimlString: twiml.toString(),
    toPhoneNumber: '+818055146460',
    //    statusCallbackUrl = currentBaseUrl + '/webhooks/twilio/call_handler',
  });
  res.json({ hello: 'world' });
});

// When serverless offline start, access below
// http://localhost:3000/dev/
// add generate new AWS Lambda functions[api]
export const handler = serverlessExpress({ app });

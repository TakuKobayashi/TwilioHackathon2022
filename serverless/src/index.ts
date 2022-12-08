import serverlessExpress from '@vendia/serverless-express';
import express from 'express';
import twilio from 'twilio';
import { twilioCreateCall, twilioSendSMS } from './commons/twilio';
import { getCurrentInvoke } from '@vendia/serverless-express';
import { lineNotifyRouter } from './routes/platforms/line/notify';
import { slackWebhookRouter } from './routes/webhooks/slack';
import { twilioWebhookRouter } from './routes/webhooks/twilio';

import { sendSQSMessage } from './commons/aws-sqs';

const VoiceResponse = twilio.twiml.VoiceResponse;

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

app.get('/twilio_call_test', async (req, res) => {
  const twiml = new VoiceResponse();
  const currentInvoke = getCurrentInvoke();
  const currentBaseUrl = [req.protocol + '://' + req.get('host'), currentInvoke.event.requestContext.stage].join('/');
  // 番号をプッシュした時の受け取り先を指定
  twiml.gather({
    // 番号を押した時の受け取り先
    action: currentBaseUrl + '/webhooks/twilio/gather',
    input: 'dtmf', // dtmf がいわゆる電話機の番号入植という意味 speech にしたら話している内容を文字に起こして入力される
    finishOnKey: '', // 入力終了のKey defaultは'#' 文字を空を指定したら全ての記号が乳力終了になる
    method: 'POST',
  });
  twiml.say(
    {
      language: 'ja-JP',
      voice: 'woman',
    },
    'メッセージに反応をしてください!! 1を押したら電話をかけます 2を押したら要件の内容をメッセージに残してお伝えします',
  );
  await twilioCreateCall({
    twimlString: twiml.toString(),
    toPhoneNumber: '+818055146460',
    statusCallbackUrl: currentBaseUrl + '/webhooks/twilio/call_handler',
  });
  res.json({ hello: 'world' });
});

app.get('/twilio_sms_test', async (req, res) => {
  await twilioSendSMS({ message: 'オッス!!オラゴクウ!!', toPhoneNumber: '+818055146460' });
  res.json({ hello: 'world' });
});

// When serverless offline start, access below
// http://localhost:3000/dev/
// add generate new AWS Lambda functions[api]
export const handler = serverlessExpress({ app });

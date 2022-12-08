import { NextFunction, Request, Response } from 'express';
import bodyParser from 'body-parser';
import { parse } from 'query-string';
import twilio from 'twilio';

const VoiceResponse = twilio.twiml.VoiceResponse;

const express = require('express');
const twilioWebhookRouter = express.Router();

twilioWebhookRouter.use(bodyParser.text({ type: '*/*' }));
twilioWebhookRouter.use(bodyParser.urlencoded({ extended: false }));

twilioWebhookRouter.get('/', async (req: Request, res: Response, next: NextFunction) => {
  res.json({ message: 'hello twilio webhook' });
});

twilioWebhookRouter.post('/call_handler', async (req, res) => {
  const payload = parse(req.body);
  // payloadには以下のようなデータが送られてくる
  /*
  {
    AccountSid: 'AccountSid',
    ApiVersion: '2010-04-01',
    CallDuration: '1',
    CallSid: 'CallSid',
    CallStatus: 'completed', // completed は電話を取ったということ busy は電話を取らなかったということ
    CallbackSource: 'call-progress-events',
    Called: '電話を受けた方の電話番号',
    CalledCity: '',
    CalledCountry: 'JP',
    CalledState: '',
    CalledZip: '',
    Caller: '電話をかけた方の電話番号',
    CallerCity: 'FILLMORE',
    CallerCountry: 'US',
    CallerState: 'CA',
    CallerZip: '93065',
    Direction: 'outbound-api',
    Duration: '1',
    From: '電話をかけた方の電話番号',
    FromCity: 'FILLMORE',
    FromCountry: 'US',
    FromState: 'CA',
    FromZip: '93065',
    SequenceNumber: '0',
    SipResponseCode: '200',
    Timestamp: 'Sat, 03 Dec 2022 14:46:36 +0000',
    To: '電話を受けた方の電話番号',
    ToCity: '',
    ToCountry: 'JP',
    ToState: '',
    ToZip: ''
  }
  */
  console.log(payload);
  res.send('ok');
});

twilioWebhookRouter.post('/gather', async (req, res) => {
  const payload = parse(req.body);
  // payloadには以下のようなデータが送られてくる
  /*
  {
    AccountSid: 'AccountSid',
    ApiVersion: '2010-04-01',
    CallSid: 'CallSid',
    CallStatus: 'in-progress', // 現在の状態 in-progressは電話中の状態
    Called: '電話を受けた方の電話番号',
    CalledCity: '',
    CalledCountry: 'JP',
    CalledState: '',
    CalledZip: '',
    Caller: '電話をかけた方の電話番号',
    CallerCity: 'FILLMORE',
    CallerCountry: 'US',
    CallerState: 'CA',
    CallerZip: '93065',
    Digits: '2', // 入力された番号
    Direction: 'outbound-api',
    FinishedOnKey: '#', // 入力を終える時に押す番号(記号)
    From: '電話をかけた方の電話番号',
    FromCity: 'FILLMORE',
    FromCountry: 'US',
    FromState: 'CA',
    FromZip: '93065',
    To: '電話をかけた方の電話番号',
    ToCity: '',
    ToCountry: 'JP',
    ToState: '',
    ToZip: '',
    msg: 'Gather End'
  }
  */
  console.log(payload);
  const twiml = new VoiceResponse();
  if (payload.Digits) {
    // 1が押された時の処理
    if (payload.Digits === '1') {
      // dialで電話を転送する
      //twiml.dial(phoneNumber)
    // 2が押された時の処理
    } else if (payload.Digits === '2') {
    }
    twiml.say(
      {
        language: 'ja-JP',
        voice: 'woman',
      },
      payload.Digits + 'が押されました',
    );
  } else {
    // TODO 無限ループにさせた方がよさそう
    twiml.say(
      {
        language: 'ja-JP',
        voice: 'woman',
      },
      'エラーが発生しました',
    );
  }

  // Render the response as XML in reply to the webhook request
  res.type('text/xml');
  res.send(twiml.toString());
});

export { twilioWebhookRouter };

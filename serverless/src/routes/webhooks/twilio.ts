import { NextFunction, Request, Response } from 'express';
import bodyParser from 'body-parser';
import { parse } from 'query-string';
import twilio from 'twilio';
import { recordTwiml, dialTwiml } from '../../commons/twilio';
import { getCurrentInvoke } from '@vendia/serverless-express';

const VoiceResponse = twilio.twiml.VoiceResponse;

const express = require('express');
const twilioWebhookRouter = express.Router();

twilioWebhookRouter.use(bodyParser.text({ type: '*/*' }));
twilioWebhookRouter.use(bodyParser.urlencoded({ extended: false }));

twilioWebhookRouter.get('/', async (req: Request, res: Response, next: NextFunction) => {
  res.json({ message: 'hello twilio webhook' });
});

twilioWebhookRouter.post('/call_handler', async (req, res) => {
  console.log('/call_handler');
  console.log(req.body);
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

  const callStatus = payload.CallStatus;
  console.log('callStatus: ' + callStatus);

  switch(callStatus) {
    case 'completed':
      // 電話を受け取った場合、何もしない
      break;
    case 'busy':
      // 電話を受け取らなかった場合、SMSに通知を送る
      break;
    default:
      console.log(callStatus);
      break;
  }
  res.send('ok');
});

twilioWebhookRouter.post('/gather_dtmf_handler', async (req, res) => {
  console.log('/gather_dtmf_handler');
  console.log(req.body);
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
  let responseString = '';
  const currentInvoke = getCurrentInvoke();
  const currentBaseUrl = [req.protocol + '://' + req.get('host'), currentInvoke.event.requestContext.stage].join('/');
  const twiml = new VoiceResponse();
  if (payload.Digits) {
    // 1が押された時の処理
    if (payload.Digits === '1') {
      responseString = dialTwiml({
        toPhoneNumber: '転送したい転送先の電話番号',
        dialCallbackUrl: currentBaseUrl + '/webhooks/twilio/redirect_dial_handler',
        // referUrl: currentBaseUrl + '/webhooks/twilio/dial_refer_handler',
      });
      // 2が押された時の処理
    } else if (payload.Digits === '2') {
      responseString = recordTwiml({
        recordingStatusCallbackUrl: currentBaseUrl + '/webhooks/twilio/recording_status_handler',
        transcribeCallbackUrl: currentBaseUrl + '/webhooks/twilio/transcribe_handler',
      });
    }
  } else {
    // TODO 無限ループにさせた方がよさそう
    twiml.say(
      {
        language: 'ja-JP',
        voice: 'woman',
      },
      'エラーが発生しました',
    );
    responseString = twiml.toString();
  }

  // Render the response as XML in reply to the webhook request
  res.type('text/xml');
  res.send(responseString);
});

// 電話転送する時に呼ばれるメソッド
twilioWebhookRouter.post('/redirect_dial_handler', async (req, res) => {
  const payload = parse(req.body);
  // payloadには以下のようなデータが送られてくる
  /*
  {
    AccountSid: 'AccountSid',
    ApiVersion: '2010-04-01',
    CallSid: 'CallSid',
    CallStatus: 'completed', // completed は電話を切った時に呼ばれるという状態を表している
    Called: '電話を転送しようと発信した側の電話番号',
    CalledCity: '',
    CalledCountry: 'JP',
    CalledState: '',
    CalledZip: '',
    Caller: '電話を転送したTwilio側の電話番号',
    CallerCity: 'FILLMORE',
    CallerCountry: 'US',
    CallerState: 'CA',
    CallerZip: '93065',
    DialCallDuration: '12',
    DialCallSid: 'DialCallSid',
    DialCallStatus: 'completed',
    Direction: 'outbound-api',
    From: '電話を転送したTwilio側の電話番号',
    FromCity: 'FILLMORE',
    FromCountry: 'US',
    FromState: 'CA',
    FromZip: '93065',
    To: '電話を転送しようと発信した側の電話番号',
    ToCity: '',
    ToCountry: 'JP',
    ToState: '',
    ToZip: ''
  }
  */
  console.log(payload);
  res.send('ok');
});

// 録音した結果の受け取り口(transcribeよりも先の呼ばれる)
twilioWebhookRouter.post('/recording_status_handler', async (req, res) => {
  const payload = parse(req.body);
  // payloadには以下のようなデータが送られてくる
  /*
  {
    AccountSid: 'AccountSid',
    CallSid: 'CallSid',
    ErrorCode: '0',
    RecordingChannels: '1',
    RecordingDuration: '3',
    RecordingSid: 'RecordingSid',
    RecordingSource: 'RecordVerb',
    RecordingStartTime: 'Fri, 09 Dec 2022 11:37:35 +0000',
    RecordingStatus: 'completed', // completed は録音が完了して音声ファイルが作成されたということ
    RecordingUrl: '録音した音声ファイルの格納先のURL'
  }
  */
  console.log(payload);
  res.send('ok');
});

twilioWebhookRouter.post('/transcribe_handler', async (req, res) => {
  const payload = parse(req.body);
  console.log(payload);
  /*
  {
    AccountSid: 'AccountSid',
    ApiVersion: '2010-04-01',
    CallSid: 'CallSid',
    CallStatus: 'completed',
    Called: '電話を受けた方の電話番号',
    Caller: '電話をかけた方の電話番号',
    Direction: 'outbound-api',
    From: '電話をかけた方の電話番号',
    RecordingSid: 'REcad03fc7815572ac54bfd0572bc8d3dc',
    RecordingUrl: '録音した音声ファイルの格納先のURL',
    To: '電話を受けた方の電話番号',
    TranscriptionSid: 'TranscriptionSid',
    TranscriptionStatus: 'completed', // 文字起こし完了
    TranscriptionText: 'Most most, most most.', // 「もしもし」と言ったが英語のみ文字に起こされたので
    TranscriptionType: 'fast',
    TranscriptionUrl: '文字に起こしたデータの格納先URL',
    url: 'このwebhookの情報を送ったURL'
  }
  */
  res.send('ok');
});

export { twilioWebhookRouter };

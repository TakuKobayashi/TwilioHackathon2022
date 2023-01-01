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

// json形式のparseに必要
app.use(
  bodyParser.urlencoded({
    extended: true,
  }),
);
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

  const src_user_id = req.body.src_user_id;
  const src_user_display_name = req.body.src_user_display_name;
  const dst_user_id = req.body.dst_user_id;
  const timestamp = req.body.timestamp;
  const channel = req.body.channel;
  const text = req.body.text;

  const twimlString = gatherTwiml(currentBaseUrl + '/webhooks/twilio/gather_dtmf_handler', src_user_display_name, text);
  await twilioCreateCall({
    twimlString: twimlString,
    toPhoneNumber: req.body.toPhoneNumber,
    statusCallbackUrl: currentBaseUrl + '/webhooks/twilio/call_handler',
  })
    .then(async () => {
      // 電話をかけたらkintoneの該当レコードのステータスをfalse(空の配列)にする
      const query =
        'src_user_id = "' +
        src_user_id +
        '" and dst_user_id = "' +
        dst_user_id +
        '" and timestamp = "' +
        timestamp +
        '" and channel = "' +
        channel +
        '"';
      const searchRecordsResponse = await searchRecords({
        query: query,
        fields: ['id'],
      });

      console.log('searchRecordsResponse');
      console.log(searchRecordsResponse);

      if (!searchRecordsResponse) {
        console.log('レスポンスが返って来ていません');
      } else {
        const totalCount = Number(searchRecordsResponse.totalCount);
        if (totalCount === 1) {
          // 該当のレコードが1つのみ存在すれば、そのレコードのcallのステータスをfalseに更新する
          const recordId = searchRecordsResponse.records[0].id.value;
          console.log('recordId');
          console.log(recordId);
          await updateRecord({
            id: recordId,
            record: {
              status: {
                value: [],
              },
            },
          })
            .then((result) => {
              console.log('update record success');
            })
            .catch((err) => {
              console.log(err);
            });
        } else if (totalCount >= 2) {
          console.log('該当のレコードが複数存在します');
        }
      }

      res.json({
        status: 'OK',
        data: {
          toPhoneNumber: req.body.toPhoneNumber,
        },
      });
    })
    .catch((e) => {
      res.json({ status: 'NG', error: e });
    });
});

app.get('/twilio_sms_test', async (req, res) => {
  await twilioSendSMS({ message: 'オッス!!オラゴクウ!!', toPhoneNumber: '+818055146460' });
  res.json({ hello: 'world' });
});

app.post('/send_twilio_sms', async (req, res) => {
  await twilioSendSMS({ message: req.body.message, toPhoneNumber: req.body.toPhoneNumber });
  res.json({ status: 'OK' });
});

app.get('/file_upload_test', async (req, res) => {
  const downloadResponse = await downloadRecordingFileStream(
    `https://api.twilio.com/2010-04-01/Accounts/ACde9bc01a6d19d0bf03c1ee8a0fd4aff5/Recordings/REb310acd0f58713f9745fa28abc2c7097.wav`,
  );
  await uploadToS3RecordingFileStream(`RecordingFiles/ACde9bc01a6d19d0bf03c1ee8a0fd4aff5.wav`, downloadResponse.data);
  const data = await transcribeRecordFile({
    jobName: `ACde9bc01a6d19d0bf03c1ee8a0fd4aff5`,
    inputKey: 'RecordingFiles/ACde9bc01a6d19d0bf03c1ee8a0fd4aff5.wav',
    outputKey: path.join(process.env.TRANSCRIBE_RESULT_PREFIX_KEY, `ACde9bc01a6d19d0bf03c1ee8a0fd4aff5.json`),
  });
  res.json(data);
});

// When serverless offline start, access below
// http://localhost:3000/dev/
// add generate new AWS Lambda functions[api]
export const handler = serverlessExpress({ app });

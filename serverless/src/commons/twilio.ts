import twilio from 'twilio';
import axios, { AxiosResponse } from 'axios';
import { S3Client, CompleteMultipartUploadCommandOutput, AbortMultipartUploadCommandOutput } from '@aws-sdk/client-s3';
import { Upload } from '@aws-sdk/lib-storage';

const twilioClient = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
const VoiceResponse = twilio.twiml.VoiceResponse;

export async function twilioCreateCall({
  twimlString,
  toPhoneNumber,
  statusCallbackUrl = null,
}: {
  twimlString: string;
  toPhoneNumber: string;
  statusCallbackUrl?: string;
}): Promise<any> {
  const createCallObj = {
    twiml: twimlString,
    from: process.env.TWILIO_US_PHONE_NUMBER,
    to: toPhoneNumber,
  };
  if (statusCallbackUrl) {
    return twilioClient.calls.create({
      ...createCallObj,
      statusCallback: statusCallbackUrl,
      statusCallbackMethod: 'POST',
    });
  } else {
    return twilioClient.calls.create(createCallObj);
  }
}

export async function twilioSendSMS({ message, toPhoneNumber }: { message: string; toPhoneNumber: string }): Promise<any> {
  return twilioClient.messages.create({
    body: message,
    from: process.env.TWILIO_US_PHONE_NUMBER,
    to: toPhoneNumber,
  });
}

export function gatherTwiml(actionUrl: string, src_user_display_name?: string, text?: string): string {
  const twiml = new VoiceResponse();
  // 番号をプッシュした時の受け取り先を指定
  const gather = twiml.gather({
    // 番号を押した時の受け取り先
    action: actionUrl,
    input: 'dtmf', // dtmf がいわゆる電話機の番号入植という意味 speech にしたら話している内容を文字に起こして入力される
    finishOnKey: '#', // 入力終了のKey defaultは'#' 文字を空を指定したら全ての記号が乳力終了になる
    method: 'POST',
    timeout: 30, // 入力をうけつけてくれる秒数
    numDigit: 1, // 相手からプッシュ操作を1桁待つ
  });
  const messageHead = src_user_display_name && text
    ? `${src_user_display_name}さんから緊急のメッセージがきています！メッセージに反応してください！メッセージ内容は「${text}」です。`
    : 'メッセージに反応してください！';
  const message = messageHead + '1を押したら電話をかけます。2を押したら要件の内容をメッセージに残してお伝えします。最後にシャープキーを押してください。';
  gather.say(
    {
      language: 'ja-JP',
      voice: 'woman',
    },
    message
  );
  return twiml.toString();
}

export function dialTwiml({
  toPhoneNumber,
  dialCallbackUrl,
}: //  referUrl,
{
  toPhoneNumber: string;
  dialCallbackUrl: string;
  //  referUrl: string;
}): string {
  const twiml = new VoiceResponse();
  // dialで電話を転送する
  twiml.say(
    {
      language: 'ja-JP',
      voice: 'woman',
    },
    '電話をかけます',
  );
  twiml.dial(
    {
      action: dialCallbackUrl,
      method: 'POST',
      //      referUrl: referUrl,
      //      referMethod: 'POST',
    },
    toPhoneNumber,
  );
  return twiml.toString();
}

export function recordTwiml({
  recordingStatusCallbackUrl,
  transcribeCallbackUrl,
}: {
  recordingStatusCallbackUrl: string;
  transcribeCallbackUrl: string;
}): string {
  const twiml = new VoiceResponse();
  const timeoutSecond = 30;
  // 録音するより前に言わせるにはrecordより前にsayの処理を書くようにする必要がある
  twiml.say(
    {
      language: 'ja-JP',
      voice: 'woman',
    },
    'ピーとなったら' + timeoutSecond.toString() + '秒で要件をお話しください',
  );
  twiml.record({
    timeout: timeoutSecond,
    playBeep: true,
    transcribe: true,
    recordingStatusCallbackMethod: 'POST',
    recordingStatusCallback: recordingStatusCallbackUrl,
    transcribeCallback: transcribeCallbackUrl,
  });
  return twiml.toString();
}

export async function downloadRecordingFileStream(recordingUrl: string): Promise<AxiosResponse<any, any>> {
  return axios.get(recordingUrl, {
    responseType: 'stream',
    auth: {
      username: process.env.TWILIO_ACCOUNT_SID,
      password: process.env.TWILIO_AUTH_TOKEN,
    },
  });
}

export async function uploadToS3RecordingFileStream(
  uploadKey: string,
  streamData: any,
): Promise<CompleteMultipartUploadCommandOutput | AbortMultipartUploadCommandOutput> {
  const s3Client = new S3Client({ region: process.env.AWS_REGION });
  const upload = new Upload({
    client: s3Client,
    params: {
      Bucket: process.env.S3_BUCKERT_NAME,
      Key: uploadKey,
      Body: streamData,
    },
  });
  /*
  upload.on('httpUploadProgress', (progress) => {
    console.log(progress)
  })
  */
  return upload.done();
}

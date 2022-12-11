import { S3Handler, S3Event, Context } from 'aws-lambda';
import { S3Client, GetObjectCommand, GetObjectCommandInput } from '@aws-sdk/client-s3';

export const handler: S3Handler = async (event: S3Event, context: Context) => {
  for (const record of event.Records) {
    // record の中身はこんな感じ
    /*
    {
      "eventVersion": "2.1",
      "eventSource": "aws:s3",
      "awsRegion": "ap-northeast-1",
      "eventTime": "2022-12-11T15:57:49.079Z",
      "eventName": "ObjectCreated:Put",
      "userIdentity": {
        "principalId": "principalId"
      },
      "requestParameters": {
        "sourceIPAddress": "0.0.0.0"
      },
      "responseElements": {
        "x-amz-request-id": "x-amz-request-id",
        "x-amz-id-2": "x-amz-id-2"
      },
      "s3": {
        "s3SchemaVersion": "1.0",
        "configurationId": "configurationId",
        "bucket": {
            "name": "bucketName",
            "ownerIdentity": {
                "principalId": "principalId"
            },
            "arn": "arn:aws:s3:::bucketName"
        },
        "object": {
            "key": "保存されているファイルのkey",
            "size": 802,
            "eTag": "eTag",
            "sequencer": "sequencer"
        }
      }
    }
    */
    if (record.s3) {
      if (record.s3.object.key.includes('.json')) {
        const bodyString = await loadS3JSONFile({
          Bucket: record.s3.bucket.name,
          Key: record.s3.object.key,
        });
        // JSONファイルの中身は以下のような感じ
        /*
        {
            "jobName": "jobName",
            "accountId": "accountId",
            "results": {
                "transcripts": [
                    {
                        "transcript": "ああテストテストああテスト"
                    }
                ],
                "items": [
                    {
                        "start_time": "0.0",
                        "end_time": "0.44",
                        "alternatives": [
                            {
                                "confidence": "0.9893",
                                "content": "ああ"
                            }
                        ],
                        "type": "pronunciation"
                    },
                    {
                        "start_time": "0.45",
                        "end_time": "0.82",
                        "alternatives": [
                            {
                                "confidence": "1.0",
                                "content": "テスト"
                            }
                        ],
                        "type": "pronunciation"
                    },
                    {
                        "start_time": "0.82",
                        "end_time": "1.3",
                        "alternatives": [
                            {
                                "confidence": "1.0",
                                "content": "テスト"
                            }
                        ],
                        "type": "pronunciation"
                    },
                    {
                        "start_time": "1.3",
                        "end_time": "1.47",
                        "alternatives": [
                            {
                                "confidence": "0.8599",
                                "content": "ああ"
                            }
                        ],
                        "type": "pronunciation"
                    },
                    {
                        "start_time": "1.48",
                        "end_time": "2.0",
                        "alternatives": [
                            {
                                "confidence": "1.0",
                                "content": "テスト"
                            }
                        ],
                        "type": "pronunciation"
                    }
                ]
            },
            "status": "COMPLETED"
        }
        */
        const parsedJSON = JSON.parse(bodyString);
        const transcriptStrings = parsedJSON.results.transcripts.map((transcript) => transcript.transcript);
        // 文字起こしした文章全体
        const transcriptString = transcriptStrings.join('');
        console.log(transcriptString);
      }
    }
  }
};

async function loadS3JSONFile(inputParams: GetObjectCommandInput): Promise<string> {
  const s3Client = new S3Client({ region: process.env.AWS_REGION });
  // dataはReadableStreamで返ってくる
  const data = await s3Client.send(new GetObjectCommand(inputParams));
  // Convert the ReadableStream to a string.
  return data.Body.transformToString();
}

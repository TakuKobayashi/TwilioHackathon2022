import type { AWS } from '@serverless/typescript';

import { config } from 'dotenv';
const configedEnv = config();

const regionName = 'ap-northeast-1';
const queueName = 'GentleCallReminderQueue';
const bucketName = 'gentle-call-record';
const localAccountId = 'local-accountid';

const execCommand = JSON.parse(process.env.npm_config_argv || JSON.stringify({}));
const isLocal: boolean = execCommand.original && execCommand.original.includes('offline') && execCommand.original.includes('start');
const queueUrl = isLocal
  ? 'https://sqs.' + regionName + '.amazonaws.com/' + localAccountId + '/' + queueName
  : 'https://sqs.${aws:region}.amazonaws.com/${aws:accountId}/' + queueName;
const arnName = isLocal
  ? 'arn:aws:sqs:' + regionName + ':' + localAccountId + ':' + queueName
  : 'arn:aws:sqs:${aws:region}:${aws:accountId}:' + queueName;

const serverlessConfiguration: AWS = {
  service: 'twilio-hackathon-2022',
  frameworkVersion: '3',
  plugins: ['serverless-esbuild', 'serverless-offline', 'serverless-dotenv-plugin', 'serverless-offline-sqs'],
  provider: {
    name: 'aws',
    runtime: 'nodejs16.x',
    region: regionName,
    timeout: 900,
    memorySize: 256,
    apiGateway: {
      minimumCompressionSize: 1024,
      shouldStartNameWithService: true,
    },
    environment: {
      AWS_NODEJS_CONNECTION_REUSE_ENABLED: '1',
      NODE_OPTIONS: '--enable-source-maps --stack-trace-limit=1000',
      QUEUE_URL: queueUrl,
    },
  },
  resources: {
    Resources: {
      ReminderQueue: {
        Type: 'AWS::SQS::Queue',
        Properties: {
          QueueName: queueName,
        },
      },
      RecordBucket: {
        Type: 'AWS::S3::Bucket',
        Properties: {
          BucketName: bucketName,
        },
      },
    },
  },
  // import the function via paths
  functions: {
    app: {
      handler: 'src/index.handler',
      events: [
        {
          http: {
            method: 'ANY',
            path: '/',
            cors: true,
          },
        },
        {
          http: {
            method: 'ANY',
            path: '/{any+}',
            cors: true,
          },
        },
      ],
    },
    queueevent: {
      handler: 'src/sqs.handler',
      events: [
        {
          sqs: {
            arn: arnName,
            //batchSize: 10000, // max 10000, FIFO queuesの場合はmax 10.
          },
        },
      ],
    },
  },
  package: { individually: true },
  custom: {
    esbuild: {
      bundle: true,
      minify: false,
      sourcemap: true,
      exclude: ['aws-sdk'],
      target: 'node16',
      define: { 'require.resolve': undefined },
      platform: 'node',
      concurrency: 10,
    },
    dotenv: {
      path: './.env',
      include: Object.keys(configedEnv.parsed),
    },
  },
};

module.exports = serverlessConfiguration;

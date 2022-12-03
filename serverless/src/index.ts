import serverlessExpress from '@vendia/serverless-express';
import express from 'express';

const app = express();

app.get('/test', (req, res) => {
  res.json({ hello: 'world' });
});

// When serverless offline start, access below
// http://localhost:3000/dev/
// add generate new AWS Lambda functions[api]
export const handler = serverlessExpress({ app });

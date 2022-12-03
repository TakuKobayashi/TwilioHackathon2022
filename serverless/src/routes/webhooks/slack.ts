import { NextFunction, Request, Response } from 'express';
const { getCurrentInvoke } = require('@vendia/serverless-express');
import bodyParser from 'body-parser';

const express = require('express');
const slackWebhookRouter = express.Router();
slackWebhookRouter.use(bodyParser.text({ type: "application/json" }));
slackWebhookRouter.use(bodyParser.urlencoded({ extended: false }));

slackWebhookRouter.get('/', async (req: Request, res: Response, next: NextFunction) => {
  res.json({ message: 'hello slack webhook' });
});

slackWebhookRouter.post('/recieved_event', async (req: Request, res: Response, next: NextFunction) => {
  console.log(req.query)
  console.log(req.body)
  const webhookBody = JSON.parse(req.body);
  // challengeが行われたときのresponse
  if(webhookBody.type == 'url_verification'){
    // res.json({challenge: webhookBody.challenge});
  }
  console.log(webhookBody)
  res.json({challenge: webhookBody.challenge});
});

export { slackWebhookRouter };
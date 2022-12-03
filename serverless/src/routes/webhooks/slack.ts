import { NextFunction, Request, Response } from 'express';
const { getCurrentInvoke } = require('@vendia/serverless-express');

const express = require('express');
const slackWebhookRouter = express.Router();

slackWebhookRouter.get('/', async (req: Request, res: Response, next: NextFunction) => {
  res.json({ message: 'hello slack webhook' });
});

export { slackWebhookRouter };
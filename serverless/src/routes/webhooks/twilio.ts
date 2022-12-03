import { NextFunction, Request, Response } from 'express';
const { getCurrentInvoke } = require('@vendia/serverless-express');

const express = require('express');
const twilioWebhookRouter = express.Router();

twilioWebhookRouter.get('/', async (req: Request, res: Response, next: NextFunction) => {
  res.json({ message: 'hello twilio webhook' });
});

export { twilioWebhookRouter };
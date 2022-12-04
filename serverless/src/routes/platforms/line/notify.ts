import axios from 'axios';
import { stringifyUrl } from 'query-string';
import { NextFunction, Request, Response } from 'express';
import { getCurrentInvoke } from '@vendia/serverless-express';

import { sendNotify } from '../../../commons/line-notify';
import { LineNotifyOauthTokenResponse } from '../../../interfaces/line';

import { v4 as uuidv4 } from 'uuid';

const LINE_NOTIFY_AUTH_BASE_URL = 'https://notify-bot.line.me';

const express = require('express');
const lineNotifyRouter = express.Router();

lineNotifyRouter.get('/', async (req: Request, res: Response, next: NextFunction) => {
  res.json({ message: 'hello line' });
});

lineNotifyRouter.get('/auth', async (req: Request, res: Response) => {
  const stateString = uuidv4();
  const currentInvoke = getCurrentInvoke();
  const currentBaseUrl = [req.protocol + '://' + req.get('host'), currentInvoke.event.requestContext.stage].join('/');
  const lineOauthParams = {
    response_type: 'code',
    client_id: process.env.LINE_NOTIFY_CLIENT_ID,
    scope: 'notify',
    state: stateString,
    redirect_uri: currentBaseUrl + '/platforms/line/notify/callback',
  };
  res.redirect(stringifyUrl({ url: LINE_NOTIFY_AUTH_BASE_URL + '/oauth/authorize', query: lineOauthParams }));
});
lineNotifyRouter.get('/callback', async (req: Request, res: Response) => {
  const currentInvoke = getCurrentInvoke();
  const currentBaseUrl = [req.protocol + '://' + req.get('host'), currentInvoke.event.requestContext.stage].join('/');
  if (!req.query.code) {
    res.redirect(currentBaseUrl);
  }
  const lineOauthParams = {
    grant_type: 'authorization_code',
    client_id: process.env.LINE_NOTIFY_CLIENT_ID,
    client_secret: process.env.LINE_NOTIFY_CLIENT_SECRET,
    code: req.query.code,
    redirect_uri: currentBaseUrl + '/platforms/line/notify/callback',
  };
  const result = await axios
    .post<LineNotifyOauthTokenResponse>(stringifyUrl({ url: LINE_NOTIFY_AUTH_BASE_URL + '/oauth/token', query: lineOauthParams }))
    .catch((err) => console.log(err));
  if (!result) {
    res.redirect(currentBaseUrl);
  }
  // resultはこんな感じ
  // {"status":200,"message":"access_token is issued","access_token":"..."}
  res.json(result.data);
});
lineNotifyRouter.get('/notify', async (req: Request, res: Response) => {
  await sendNotify({ accessToken: req.query.access_token.toString(), message: 'testtest' });
});

export { lineNotifyRouter };

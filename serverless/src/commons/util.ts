import { getCurrentInvoke } from '@vendia/serverless-express';
import { Request } from 'express';

export function getCurrentBaseUrl(req: Request) {
  const currentInvoke = getCurrentInvoke();
  const currentBaseUrl = [req.protocol + '://' + req.get('host'), currentInvoke.event.requestContext.stage].join('/');
  console.log('currentBaseUrl: ' + currentBaseUrl);
  return currentBaseUrl;
}

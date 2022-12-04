import axios, { AxiosResponse } from 'axios';
import { URLSearchParams } from 'url';

const LINE_NOTIFY_BASE_URL = 'https://notify-api.line.me';

export async function sendNotify({ accessToken, message }: { accessToken: string; message: string }): Promise<AxiosResponse<any>> {
  const messageUrlParams = new URLSearchParams();
  messageUrlParams.append('message', message);
  return axios.post(LINE_NOTIFY_BASE_URL + '/api/notify', messageUrlParams, {
    headers: {
      Authorization: ['Bearer', accessToken].join(' '),
    },
  });
}

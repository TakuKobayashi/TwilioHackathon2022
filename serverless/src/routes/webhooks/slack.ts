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
  // {
  //   "token":"...",
  //   "team_id":"...",
  //   "api_app_id":"...",
  //   "event":{
  //     "client_msg_id":"client_msg_id",
  //     "type":"message",
  //     "text":"<@メンションしたUserのid> test",
  //     "user":"投稿したUserのId",
  //     "ts":"1670059905.724079",
  //     "blocks":[
  //       {
  //         "type":"rich_text",
  //         "block_id":"\/o+",
  //         "elements":[
  //           {
  //             "type":"rich_text_section",
  //             "elements":[
  //               {
  //                 "type":"user",
  //                 "user_id":"メンションしたUserのid"
  //               },← Userに対してメンションをした場合追加される
  //               {
  //                  "type":"broadcast",
  //                  "range":"channel"
  //               },← hereとかchannelとか大人数向けに対してメンションをした場合追加される
  //               {
  //                 "type":"text",
  //                 "text":" test"
  //               }
  //             ]
  //           }
  //         ],
  //       }
  //     ],
  //     "team":"teamId",
  //     "channel":"channelId",
  //     "event_ts":"1670059905.724079",
  //     "channel_type":"channel"
  //   },
  //   "type":"event_callback",
  //   "event_id":"event_id",
  //   "event_time":1670059905,
  //   "authorizations":[
  //     {
  //       "enterprise_id":null,
  //       "team_id":"teamId",
  //       "user_id":"投稿したUserのId",
  //       "is_bot":false,
  //       "is_enterprise_install":false
  //      }
  //   ],
  //   "is_ext_shared_channel":false,
  //   "event_context":"eventCsontext"
  //}
  const webhookBody = JSON.parse(req.body);
  // challengeが行われたときのresponse
  if(webhookBody.type == 'url_verification'){
    console.log("url verifacation")
    // res.json({challenge: webhookBody.challenge});
  // 何かしらのイベント二体するcallback
  }else if(webhookBody.type == 'event_callback'){
    // チャンネルにテキストが投稿された時の処理
    if(webhookBody.event.type == "message"){

    }
  }
  console.log(webhookBody)
  res.json({challenge: webhookBody.challenge});
});

export { slackWebhookRouter };
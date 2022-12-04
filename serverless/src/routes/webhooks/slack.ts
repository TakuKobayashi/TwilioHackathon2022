import { NextFunction, Request, Response } from 'express';
const { getCurrentInvoke } = require('@vendia/serverless-express');
import bodyParser from 'body-parser';
import { getUserIds, trimUserIds } from 'src/commons/slack';
import { addRecords, searchRecords, updateRecord } from 'src/commons/kintone';

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
  // メッセージのwebhookを取得した場合の内容
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
  //リアクションされた時のwebhook
  //{
  //  "token":"...",
  //  "team_id":"...",
  //  "api_app_id":"...",
  //  "event":{
  //    "type":"reaction_added",
  //    "user":"リアクションしたUserのId",
  //    "reaction":"white_check_mark", ← リアクション名
  //    "item":{
  //      "type":"message",
  //      "channel":"...",
  //      "ts":"1670061565.586719"
  //    },
  //    "item_user":"リアクション元の投稿したUserのId",
  //    "event_ts":"1670061874.009200"
  //  },
  //  "type":"event_callback",
  //  "event_id":"eventId",
  //  "event_time":1670061874,
  //  "authorizations":[
  //    {
  //      "enterprise_id":null,
  //      "team_id":"teamId",
  //      "user_id":"リアクションしたUserのId",
  //      "is_bot":false,
  //      "is_enterprise_install":false
  //    }
  //  ],
  //  "is_ext_shared_channel":false,
  //  "event_context":"..."
  //}
  const webhookBody = JSON.parse(req.body);
  // challengeが行われたときのresponse
  if(webhookBody.type == 'url_verification'){
    console.log("url verifacation");
    res.json({challenge: webhookBody.challenge});
  // 何かしらのイベント二体するcallback
  }else if(webhookBody.type == 'event_callback'){
    const event = webhookBody.event;

    // チャンネルにテキストが投稿された時の処理
    if(event.type == "message"){
      console.log('message was posted!');
      const text = event.text;

      const userIds = await getUserIds(text);
      console.log('userIds');
      console.log(userIds);

      // メンションされていた場合、kintoneにそのデータを追加
      if(userIds) {
        console.log('mentioned!');

        const newRecords = [];
        userIds.map(userId => {
          newRecords[newRecords.length] = {
            "src_user_id": {
              "value": event.user
            },
            "dst_user_id": {
              "value": userId
            },
            "text": {
              "value": trimUserIds(text)
            },
            "timestamp": {
              "value": event.ts
            },
            "status": {
              "value": ["true"]
            },
          };
        });

        await addRecords({
          records: newRecords
        }).then(result => {
          console.log('add records success');
        }).catch(err => {
          console.log(err);
        });
      }

      res.json({ status: 'OK' });
    // リアクションが行われた時の処理
    }else if(event.type == "reaction_added"){
      console.log('reaction was added!');
      console.log(event);

      const src_user_id = event.item_user;
      const dst_user_id = event.user;
      const timestamp = event.item.ts;

      const query = 'src_user_id = "' + src_user_id + '" and dst_user_id = "' + dst_user_id + '" and timestamp = "' + timestamp + '"';
      const searchRecordsResponse = await searchRecords({
        query: query,
        fields: ['id']
      });
      console.log('searchRecordsResponse');
      console.log(searchRecordsResponse);

      if(!searchRecordsResponse) {
        console.log('レスポンスが返って来ていません');
      }else {
        const totalCount = Number(searchRecordsResponse.totalCount);
        if(totalCount === 1) {
          // 該当のレコードが1つのみ存在すれば、そのレコードのcallのステータスをfalseに更新する
          const recordId = searchRecordsResponse.records[0].id.value;
          console.log('recordId');
          console.log(recordId);
          await updateRecord({
            id: recordId,
            record: {
              "status": {
                "value": []
              },
            }
          }).then(result => {
            console.log('update record success');
          }).catch(err => {
            console.log(err);
          });
        }else if(totalCount >= 2) {
          console.log('該当のレコードが複数存在します');
        }
      }
      res.json({ status: 'OK' });
    }
  }
  // console.log(webhookBody)
  // res.json({challenge: webhookBody.challenge});
});

export { slackWebhookRouter };
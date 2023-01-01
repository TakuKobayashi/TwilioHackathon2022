import { NextFunction, Request, Response } from 'express';
const { getCurrentInvoke } = require('@vendia/serverless-express');
import axios, { AxiosResponse } from 'axios';
import bodyParser from 'body-parser';
import { getUserIds, trimUserIds, trimPrefixWord } from 'src/commons/slack';
import { addRecords, searchRecords, updateRecord, getUserInfo } from 'src/commons/kintone';
import { getCurrentBaseUrl } from 'src/commons/util';
import { sendSQSMessage } from '../../commons/aws-sqs';

const express = require('express');
const slackWebhookRouter = express.Router();
slackWebhookRouter.use(bodyParser.text({ type: "application/json" }));
slackWebhookRouter.use(bodyParser.urlencoded({ extended: false }));

slackWebhookRouter.get('/', async (req: Request, res: Response, next: NextFunction) => {
  res.json({ message: 'hello slack webhook' });
});

slackWebhookRouter.post('/recieved_event', async (req: Request, res: Response, next: NextFunction) => {
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
  const webhookBody = req.body;
  // challengeが行われたときのresponse
  if (webhookBody.type == 'url_verification') {
    res.json({ challenge: webhookBody.challenge });
    return;
    // 何かしらのイベントに対するcallback
  } else if (webhookBody.type == 'event_callback') {
    const event = webhookBody.event;

    // チャンネルに"!gentlecall"から始まるテキストが投稿された時の処理
    if (event.type == 'message' && event.text && event.text.startsWith('!gentlecall')) {
      const text = event.text;

      const userIds = await getUserIds(text);
      // メンションされていた場合、kintoneにそのデータを追加
      if (userIds) {
        const [srcUserDisplayName, srcUserPhoneNumber] = await getUserInfo(event.user);

        const newRecords = await Promise.all(
          userIds.map(async (userId) => {
            const [dstUserDisplayName, dstUserPhoneNumber] = await getUserInfo(userId);
            console.log('dstUserDisplayName');
            console.log(dstUserDisplayName);
            return {
              src_user_id: {
                value: event.user,
              },
              src_user_display_name: {
                value: srcUserDisplayName,
              },
              src_user_phone_number: {
                value: srcUserPhoneNumber,
              },
              dst_user_id: {
                value: userId,
              },
              dst_user_display_name: {
                value: dstUserDisplayName,
              },
              dst_user_phone_number: {
                value: dstUserPhoneNumber,
              },
              text: {
                value: trimPrefixWord(trimUserIds(text)),
              },
              timestamp: {
                value: event.ts,
              },
              status: {
                value: ['true'],
              },
              channel: {
                value: event.channel,
              },
            };
          }),
        );
        await addRecords({
          records: newRecords,
        });

        await Promise.all(
          newRecords.map(async (newRecord) => {
            const sendData = {
              toPhoneNumber: newRecord.dst_user_phone_number.value,
              src_user_id: newRecord.src_user_id.value,
              src_user_display_name: newRecord.src_user_display_name.value,
              dst_user_id: newRecord.dst_user_id.value,
              timestamp: newRecord.timestamp.value,
              channel: newRecord.channel.value,
              text: newRecord.text.value,
            };
            // メンション付きのユーザーにすぐに発信するための仮の関数
            return sendSQSMessage({
              delaySeconds: 20,
              messageBodyObject: sendData,
            });
          }),
        );
      }

      res.json({ status: 'OK' });
      return;
      // リアクションが行われた時の処理
    } else if (event.type == 'reaction_added') {
      const src_user_id = event.item_user;
      const dst_user_id = event.user;
      const timestamp = event.item.ts;
      const channel = event.item.channel;

      const query =
        'src_user_id = "' +
        src_user_id +
        '" and dst_user_id = "' +
        dst_user_id +
        '" and timestamp = "' +
        timestamp +
        '" and channel = "' +
        channel +
        '"';
      const searchRecordsResponse = await searchRecords({
        query: query,
        fields: ['id'],
      });

      if (searchRecordsResponse) {
        const totalCount = Number(searchRecordsResponse.totalCount);
        if (totalCount === 1) {
          // 該当のレコードが1つのみ存在すれば、そのレコードのcallのステータスをfalseに更新する
          const recordId = searchRecordsResponse.records[0].id.value;
          await updateRecord({
            id: recordId,
            record: {
              status: {
                value: [],
              },
            },
          });
        }
      }
      res.json({ status: 'OK' });
      return;
    }
  }
  res.json({ status: 'OK' });
  return;
});

export { slackWebhookRouter };

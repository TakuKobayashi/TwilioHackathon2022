'use strict';

require('dotenv').config();
const { KintoneRestAPIClient } = require('@kintone/rest-api-client');

// クライアントの作成
const messagesClient = new KintoneRestAPIClient({
  baseUrl: process.env.KINTONE_BASE_URL,
  auth: {
    apiToken: process.env.KINTONE_MESSAGES_API_TOKEN,
  },
});

const usersClient = new KintoneRestAPIClient({
  baseUrl: process.env.KINTONE_BASE_URL,
  auth: {
    apiToken: process.env.KINTONE_USERS_API_TOKEN,
  },
});

// addRecords({
//   records: [
//     {
//       "src_user_id": {
//         "value": "U04DDFRLWG6"
//       },
//       "dst_user_id": {
//         "value": "U04DL8Z2G1Y"
//       },
//       "text": {
//         "value": "SDKのお試しです"
//       },
//       "timestamp": {
//         "value": "0000000000"
//       },
//       "status": {
//         "value": ["true"]
//       },
//       "channel": {
//         "value": "C000000000"
//       }
//     },
//     {
//       "src_user_id": {
//         "value": "U0000000000"
//       },
//       "dst_user_id": {
//         "value": "U1111111111"
//       },
//       "text": {
//         "value": "SDKのお試し2です"
//       },
//       "timestamp": {
//         "value": "2222222222"
//       },
//       "status": {
//         "value": ["true"]
//       },
//       "channel": {
//         "value": "C000000000"
//       }
//     }
//   ]
// });

// レコードの複数追加
export async function addRecords(params) {
  const { records } = params;
  return await messagesClient.record.addRecords({
    app: Number(process.env.KINTONE_MESSAGES_APP_ID),
    records: records,
  });
}

// レコードの検索
export async function searchRecords(params) {
  const { fields, query } = params;
  return await messagesClient.record.getRecords({
    app: Number(process.env.KINTONE_MESSAGES_APP_ID),
    fields: fields,
    query: query,
    totalCount: true,
  });
}

// レコードの検索
export async function searchUsersRecords(params) {
  const { fields, query } = params;
  return await usersClient.record.getRecords({
    app: Number(process.env.KINTONE_USERS_APP_ID),
    fields: fields,
    query: query,
    totalCount: true,
  });
}

// レコードの更新
export async function updateRecord(params) {
  const { id, record } = params;
  return await messagesClient.record.updateRecord({
    app: Number(process.env.KINTONE_MESSAGES_APP_ID),
    id: id,
    record: record,
  });
}

// booleanへの変換（チェックボックス）
// kintoneではboolean型の変数がないので、チェックボックスのチェックが入っていればtrue, そうでなければfalseとする
export function convertCheckbox2Boolean(checkboxValue: Array<String>): boolean {
  return checkboxValue.length !== 0;
}

export async function getUserInfo(user_id) {
  const query = 'user_id = "' + user_id + '"';
  const response = await searchUsersRecords({
    query: query,
    fields: ['display_name', 'phone_number'],
  });

  if (!response) {
    console.log('レスポンスが返って来ていません');
    return '';
  } else {
    const totalCount = Number(response.totalCount);
    if (totalCount === 1) {
      return [response.records[0].display_name.value, response.records[0].phone_number.value];
    } else if (totalCount >= 2) {
      console.log('該当のレコードが複数存在します');
      return '';
    }
    return '';
  }
}

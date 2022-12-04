'use strict';

require('dotenv').config();
const { KintoneRestAPIClient } = require("@kintone/rest-api-client");

// クライアントの作成
const client = new KintoneRestAPIClient({
  baseUrl: process.env.KINTONE_BASE_URL,
  auth: {
    apiToken: process.env.KINTONE_API_TOKEN
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
  return await client.record.addRecords({
    app: Number(process.env.KINTONE_APP_ID),
    records: records
  });
}

// レコードの検索
export async function searchRecords(params) {
  const { fields, query } = params;
  return await client.record.getRecords({
    app: Number(process.env.KINTONE_APP_ID),
    fields: fields,
    query: query,
    totalCount: true
  });
}

// レコードの更新
export async function updateRecord(params) {
  const { id, record } = params;
  return await client.record.updateRecord({
    app: Number(process.env.KINTONE_APP_ID),
    id: id,
    record: record
  });
}

// booleanへの変換（チェックボックス）
// kintoneではboolean型の変数がないので、チェックボックスのチェックが入っていればtrue, そうでなければfalseとする
export function convertCheckbox2Boolean(checkboxValue: Array<String>): boolean {
  return checkboxValue.length !== 0;
}

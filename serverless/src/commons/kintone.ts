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
//       "post_date": {
//         "value": new Date()
//       },
//       "dst_user_id": {
//         "value": "U04DL8Z2G1Y"
//       },
//       "text": {
//         "value": "SDKのお試しです"
//       },
//       "call": {
//         "value": ["true"]
//       },
//       "timestamp": {
//         "value": "0000000000"
//       },
//     },
//     {
//       "src_user_id": {
//         "value": "U0000000000"
//       },
//       "post_date": {
//         "value": new Date()
//       },
//       "dst_user_id": {
//         "value": "U1111111111"
//       },
//       "text": {
//         "value": "SDKのお試し2です"
//       },
//       "call": {
//         "value": ["true"]
//       },
//       "timestamp": {
//         "value": "2222222222"
//       },
//     },
//   ]
// })

// レコードの複数追加
export function addRecords(params) {
  const { records } = params;
  return client.record.addRecords({
    app: Number(process.env.KINTONE_APP_ID),
    records: records
  });
}

// レコードの検索
export function searchRecords(params) {
  const { fields, query } = params;
  return client.record.getRecords({
    app: Number(process.env.KINTONE_APP_ID),
    fields: fields,
    query: query,
    totalCount: true
  });
}

// レコードの更新
export function updateRecord(params) {
  const { id, record } = params;
  return client.record.updateRecord({
    app: Number(process.env.KINTONE_APP_ID),
    id: id,
    record: record
  });
}

import { gatherTwiml, twilioCreateCall } from './twilio';
import { searchRecords, updateRecord } from './kintone';

export async function callRoutine({
  currentBaseUrl,
  src_user_display_name,
  src_user_id,
  dst_user_id,
  toPhoneNumber,
  timestamp,
  channel,
  text,
}: {
  currentBaseUrl: string;
  src_user_display_name: string;
  src_user_id: string;
  dst_user_id: string;
  toPhoneNumber: string;
  timestamp: string;
  channel: string;
  text: string;
}) {
  const twimlString = gatherTwiml(currentBaseUrl + '/webhooks/twilio/gather_dtmf_handler', src_user_display_name, text);
  await twilioCreateCall({
    twimlString: twimlString,
    toPhoneNumber: toPhoneNumber,
    statusCallbackUrl: currentBaseUrl + '/webhooks/twilio/call_handler',
  });
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
}

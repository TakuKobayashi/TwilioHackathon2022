'use strict';
import axios from 'axios';

export function getMentionsUserIds(text: string): RegExpMatchArray {
  const regIdPattern = /<@[A-Z0-9]{11}>/g;
  return text.match(regIdPattern);
}

export function getUserId(mentionsUserId) {
  const reg = /<@|>/g;
  return mentionsUserId.replace(reg, '');
}

export async function getUserIds(text) {
  if(!text) return null;
  const mentionsUserIds = await getMentionsUserIds(text);
  const userIds = mentionsUserIds ? mentionsUserIds.map(mentionsUserId => {
    return getUserId(mentionsUserId);
  }) : null;
  return userIds;
}

export function trimUserIds(text) {
  const regIdPattern = /<@[A-Z0-9]{11}>/g;
  return text.replace(regIdPattern, '');
}

export function trimPrefixWord(text) {
  const regIdPattern = /!gentlecall/g;
  return text.replace(regIdPattern, '');
}

export async function sendSlackMessage(message) {
  const payload = {
    text: message,
  };
  try {
    await axios.post(process.env.SLACK_INCOMING_WEBHOOK_URL, payload);
  } catch (error) {
    console.log(error);
  }
};
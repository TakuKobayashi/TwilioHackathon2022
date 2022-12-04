'use strict';

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

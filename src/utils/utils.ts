import {KnownEventFromType} from '@slack/bolt';
import {WebClient} from '@slack/web-api';

// check if a message is a recovery message
const isRecoveredMsg = (message: KnownEventFromType<'message'>): boolean => {
  if ('attachments' in message && message.attachments) {
    if (
      message.attachments[0].title &&
      message.attachments[0].color === '2eb886' &&
      message.attachments[0].title.includes('Recovered') &&
      !('actions' in message.attachments[0])
    ) {
      return true;
    }
  }
  return false;
};

// get all triggered messages
const isTriggeredMsg = (message: KnownEventFromType<'message'>): boolean => {
  if ('attachments' in message && message.attachments) {
    for (const attachment of message.attachments) {
      if (
        attachment.title &&
        attachment.color === 'a30200' &&
        attachment.title.includes('Triggered') &&
        'actions' in message.attachments
      ) {
        return true;
      }
    }
  }
  return false;
};

// get all messages from channel
const getAllMessagesInChannel = async (
  client: WebClient,
  channelId: string,
  oldest?: string
) => {
  return await client.conversations.history({
    channel: channelId,
    oldest: oldest,
    limit: 100, // Maximum limit allowed by Slack API
  });
};

export {isRecoveredMsg, isTriggeredMsg, getAllMessagesInChannel};

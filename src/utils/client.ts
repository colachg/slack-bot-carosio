import './env';
import {MessageAttachment, WebClient} from '@slack/web-api';

/** slack web api client */
export class Client {
  web: WebClient;

  constructor(token?: string) {
    this.web = new WebClient(token);
  }

  /** post a message to channel */
  public async postMessage(channel: string, attachments: MessageAttachment) {
    return await this.web.chat.postMessage({
      channel: channel, // Replace with your desired channel ID or channel name
      attachments: [attachments],
    });
  }

  /** delete a message from channel */
  public async deleteMessage(timestamp: string, channelId: string) {
    return await this.web.chat.delete({
      channel: channelId,
      ts: timestamp,
    });
  }

  /** get all messages from channel */
  public async getAllMessagesInChannel(channelId: string, oldest?: string) {
    return await this.web.conversations.history({
      channel: channelId,
      oldest: oldest,
      limit: 100, // Maximum limit allowed by Slack API
    });
  }

  /** get all replies from a message, include the message self */
  public async getAllRepliesInMessage(channelId: string, ts: string) {
    return await this.web.conversations.replies({
      channel: channelId,
      ts: ts,
      limit: 100, // Maximum limit allowed by Slack API
    });
  }

  /** delete all messages from channel include replies */
  public async deleteAllMessagesInChannel(channelId: string) {
    let hasMore: boolean | undefined = true;
    let cursor: string | undefined;

    while (hasMore) {
      // Fetch messages from the channel
      const result = await this.web.conversations.history({
        channel: channelId,
        cursor: cursor,
        limit: 100,
      });

      // If there are no messages, break the loop
      if (!result.messages || result.messages.length === 0) {
        break;
      }

      // Delete each message
      for (const message of result.messages) {
        try {
          const replies = await this.getAllRepliesInMessage(
            channelId,
            message.ts as string
          );
          if (replies.messages) {
            for (const reply of replies.messages) {
              await this.web.chat.delete({
                channel: channelId,
                ts: reply.ts as string,
              });
              // Respect Slack's rate limit
              await new Promise(resolve => setTimeout(resolve, 1200));
            }
          }
        } catch (err) {
          console.error(
            `Failed to delete message with timestamp ${message.ts}:`,
            err
          );
        }
      }
      // Check if there are more messages to fetch
      hasMore = result.has_more;
      cursor = result.response_metadata?.next_cursor;
    }
  }
}

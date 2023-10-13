import './utils/env';
import {Client} from './utils/client';
import {Context, APIGatewayEvent} from 'aws-lambda';
import {App, LogLevel, AwsLambdaReceiver} from '@slack/bolt';
import {AwsCallback} from '@slack/bolt/dist/receivers/AwsLambdaReceiver';

const awsLambdaReceiver = new AwsLambdaReceiver({
  signingSecret: process.env.SLACK_SIGNING_SECRET || '',
});

const app = new App({
  token: process.env.SLACK_BOT_TOKEN,
  receiver: awsLambdaReceiver,
  logLevel: LogLevel.INFO,
});

const webClient = new Client(process.env.SLACK_USER_TOKEN);
const DATADOG_ID = 'B019YHW9W06'; // bot_dogdata

// parse url to get mapping
const parseURL = (url: string) => {
  const link = new URL(url);
  if (link.pathname.includes('synthetics')) {
    link.searchParams.delete('resultId');
  }
  link.searchParams.delete('from_ts');
  link.searchParams.delete('to_ts');
  link.searchParams.delete('eval_ts');
  link.searchParams.delete('source');
  return link.href;
};

app.message('hello', async ({message, say}) => {
  if ('user' in message) {
    await say(`Hey there <@${message.user}>!`);
  }
});

/**  Listen for messages that has attachments*/
app.message(async ({message, say, client}) => {
  // ignore messages from other bots
  if (!('bot_id' in message)) {
    return;
  }
  if ('bot_id' in message && message.bot_id !== DATADOG_ID) {
    return;
  }

  if ('bot_id' in message && message.bot_id === DATADOG_ID) {
    // Check if is a recovery message
    if ('attachments' in message && message.attachments) {
      if (
        message.attachments[0].title &&
        message.attachments[0].title_link &&
        message.attachments[0].color === '2eb886' &&
        message.attachments[0].title.includes('Recovered')
      ) {
        const recoveredURL = parseURL(message.attachments[0].title_link);
        // get all messages in a channel
        const history = await client.conversations.history({
          channel: message.channel,
          limit: 100, // Maximum limit allowed by Slack API
        });
        if (history.messages) {
          // loop through all messages
          for (const msg of history.messages) {
            if ('attachments' in msg && msg.attachments) {
              for (const attachment of msg.attachments) {
                if (
                  attachment.title &&
                  attachment.title_link &&
                  (attachment.color === 'a30200' ||
                    attachment.color === 'daa038') // warn or trigger message
                ) {
                  // get the message that has been warned or triggered
                  if (recoveredURL === parseURL(attachment.title_link)) {
                    console.log('get trigger message url --------->');
                    // set the reaction to the message
                    await client.reactions.add({
                      name: 'white_check_mark',
                      channel: message.channel,
                      timestamp: msg.ts,
                    });

                    // reply to the message with recovered message
                    if ('attachments' in message) {
                      await say({
                        attachments: message.attachments,
                        thread_ts: msg.ts,
                      });
                    }
                    // delete the recovered message with user token
                    await webClient.deleteMessage(message.ts, message.channel);
                    // jump out of the loop, reply to the latest-warned or triggered message.
                    return;
                  }
                }
              }
            }
          }
        }
      }
    }
  }
});

// Handle the Lambda function event
module.exports.handler = async (
  event: APIGatewayEvent,
  context: Context,
  callback: AwsCallback
) => {
  const handler = await awsLambdaReceiver.start();
  return handler(event, context, callback);
};

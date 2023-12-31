import './env';
import {Client} from './client';
import {MessageAttachment} from '@slack/web-api';
// import { getParameter } from '@aws-lambda-powertools/parameters/ssm'

// const CHANNEL_ID = 'C05VCLK7CSC'; //general
// const CHANNEL_ID = 'C05UPLQT5LJ'; //random
const CHANNEL_ID = 'C060N2Q1VQA'; //bot_dogdata

const client = new Client(process.env.SLACK_USER_TOKEN);

const WARN_ATTACHMENT: MessageAttachment = {
  color: 'daa038',
  fallback:
    'Warn: :rotating_light: `notifications.push.queue.error` has high error count.',
  text: '[last 5m] notifications.push.queue.error count: 10.0 (threshold: 10.0)\n\nerrortype: \n\n@pagerduty-Datadog_Service\n@slack-bot_ops_critical\n\n`sum(last_5m):default_zero(sum:meetsmore.notifications.push.queue.error{env:production}.as_count()) &gt; 10`\n\nMetric value: 10.0',
  title:
    'Warn: :rotating_light: `notifications.push.queue.error` has high error count.',
  title_link:
    'https://app.datadoghq.com/monitors/36937286?from_ts=1696377806000&to_ts=1696379006000&source=monitor_notif',
  callback_id: 'datadog-event-message',
  fields: [
    {
      value: '@pagerduty-Datadog_Service, @slack-bot_ops_critical',
      title: 'Notified',
      short: true,
    },
  ],
  mrkdwn_in: ['fields', 'text'],
  actions: [
    {
      id: '1',
      name: 'mute-monitor',
      text: 'Mute Monitor',
      type: 'button',
      value:
        '{"event_id": 7249701806883103227, "monitor_id": 36937286, "org_id": 120591}',
    },
    {
      id: '2',
      name: 'declare-incident',
      text: 'Declare Incident',
      type: 'button',
      value:
        '{"event_id": 7249701806883103227, "monitor_id": 36937286, "org_id": 120591}',
    },
  ],
};
const TRIGGERED_ATTACHMENT: MessageAttachment = {
  color: 'a30200',
  fallback:
    'Triggered: :rotating_light: `notifications.push.queue.error` has high error count.',
  text: '[last 5m] notifications.push.queue.error count: 83.0 (threshold: 10.0)\n\nerrortype: \n\n@pagerduty-Datadog_Service\n@slack-bot_ops_critical\n\n`sum(last_5m):default_zero(sum:meetsmore.notifications.push.queue.error{env:production}.as_count()) &gt; 10`\n\nMetric value: 83.0',
  title:
    'Triggered: :rotating_light: `notifications.push.queue.error` has high error count.',
  title_link:
    'https://app.datadoghq.com/monitors/36937286?from_ts=1697013686000&to_ts=1697014886000&source=monitor_notif',
  mrkdwn_in: ['fields', 'text'],
};
const RECOVERED_ATTACHMENT: MessageAttachment = {
  color: '2eb886',
  fallback:
    'Recovered: :rotating_light: `notifications.push.queue.error` has high error count.',
  text: '[last 5m] notifications.push.queue.error count: 2.0 (threshold: 10.0)\n\nerrortype: \n\n@pagerduty-Datadog_Service\n@slack-bot_ops_critical\n\n`sum(last_5m):default_zero(sum:meetsmore.notifications.push.queue.error{env:production}.as_count()) &gt; 10`\n\nMetric value: 2.0',
  title:
    'Recovered: :rotating_light: `notifications.push.queue.error` has high error count.',
  title_link:
    'https://app.datadoghq.com/monitors/36937286?from_ts=1696988246000&to_ts=1696989446000&source=monitor_notif',
  mrkdwn_in: ['fields', 'text'],
};

// send messages to channel
async function sendMessages(client: Client) {
  await client.deleteAllMessagesInChannel(CHANNEL_ID);
  await client.postMessage(CHANNEL_ID, WARN_ATTACHMENT);
  await client.postMessage(CHANNEL_ID, TRIGGERED_ATTACHMENT);
  await client.postMessage(CHANNEL_ID, RECOVERED_ATTACHMENT);
  // set one-second delay to wait for lambda function to finish
  await new Promise(resolve => setTimeout(resolve, 1000));
  await client.postMessage(CHANNEL_ID, WARN_ATTACHMENT);
  await client.postMessage(CHANNEL_ID, RECOVERED_ATTACHMENT);
}

sendMessages(client).then(() => {
  console.log('Done');
});

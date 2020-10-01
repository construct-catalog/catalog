import { extractPackageStream, toDynamoItem, toDynamoItemKey, fromDynamoItem } from './lambda-util';
import { env } from './lambda-util';
import ids = require('./ids');
import aws = require('aws-sdk');
import Twitter = require('twitter');
import atomicCounterClient = require('./client');


interface TwitterCredentials {
  consumer_key: string;
  consumer_secret: string;
  access_token_key: string;
  access_token_secret: string;
}

interface PostTweetResponse {
  id_str: string;

}

const TABLE_NAME = env(ids.Environment.TABLE_NAME);
const TWITTER_SECRET_ARN = env(ids.Environment.TWITTER_SECRET_ARN, '');
const TOPIC_ARN = env(ids.Environment.TOPIC_ARN);

const secrets = new aws.SecretsManager();
const dynamodb = new aws.DynamoDB();
const sns = new aws.SNS();
const lambda = new aws.Lambda();

export async function handler(event: AWSLambda.SQSEvent, context: AWSLambda.Context) {
  console.log(JSON.stringify(event, undefined, 2));

  let twitter;

  if (TWITTER_SECRET_ARN) {
    const getSecretOutput = await secrets.getSecretValue({
      SecretId: TWITTER_SECRET_ARN,
    }).promise();

    if (!getSecretOutput.SecretString) {
      throw new Error(`cannot retrieve twitter credentials from secrets manager`);
    }

    const credentials = JSON.parse(getSecretOutput.SecretString) as TwitterCredentials;
    twitter = new Twitter({
      ...credentials
    });
  }

  for (const pkg of extractPackageStream(event)) {
    console.log(JSON.stringify({ record: pkg }, undefined, 2));

    if (!pkg.url) {
      throw new Error(`"url" field is expected on all records`);
    }

    const exists = await getPackage(pkg.name, pkg.version);
    if (exists) {
      console.log(`package ${pkg.name}@${pkg.version} already has a tweet with id ${exists.tweetid ?? '<unknown>'}`);
      continue;
    }

    // take a request token by decrementing the quota. if we've reached our
    // quota for the time window (300 requests every 3 hours), this will fail
    // and message will be returned to the queue for a retry after 5 minutes.
    if (!await atomicCounterClient.tryDecrement()) {
      // failed to decrement - pause events and throw an exception (so the current message will be sent back to the queue)
      await pauseMyEventSource(context.functionName);
      throw new Error(`Rate limit exceeded, paused event source until next time window`);
    }

    const awscdkio = pkg.json?.awscdkio ?? { };

    const desc = pkg.metadata.description || '';
    const hashtags = (pkg.metadata.keywords || []).map(k => `#${k.replace(/-/g, '_')}`).join(' ');
    const title = `${pkg.name.replace(/@/g, '')} ${pkg.version}`;

    // --------------------------------------------------------------------------
    // DISABLED since unsolicited @mentions violate the twitter policy:
    // https://help.twitter.com/en/rules-and-policies/twitter-automation
    // --------------------------------------------------------------------------
    // // extract twitter handle from package.json/awscdkio.twitter field (if exists)
    // let twitterHandle = awscdkio.twitter;
    // if (twitterHandle && !twitterHandle.startsWith('@')) {
    //   twitterHandle = '@' + twitterHandle;
    // }
    // const author = twitterHandle ? ` by ${twitterHandle}` : '';
    // --------------------------------------------------------------------------
    const author = '';

    const status = [
      title + author,
      pkg.url,
      '',
      desc,
      hashtags,
    ].join('\n');

    console.log(`POST statuses/update ${JSON.stringify({status})}`);

    // publish to a topic, so we can monitor and do other stuffs.
    await sns.publish({ TopicArn: TOPIC_ARN, Message: status }).promise();

    let tweetid;

    // determine if we should announce (tweet) this module (default is true).
    const announce = awscdkio.announce === undefined ? true : awscdkio.announce;
    console.log(JSON.stringify({ announce }));

    if (twitter && announce) {
      const resp = await twitter.post('statuses/update', { status }) as PostTweetResponse;
      console.log(JSON.stringify({ tweet: resp }));
      tweetid = resp.id_str;
    } else {
      console.log('Dry run: skipping POST to Twitter');
      tweetid = 'DUMMY';
    }

    const putItem: aws.DynamoDB.PutItemInput = {
      TableName: TABLE_NAME,
      Item: toDynamoItem({
        ...pkg,
        tweetid: tweetid
      })
    };
    console.log(JSON.stringify({ putItem }, undefined, 2));
    await dynamodb.putItem(putItem).promise();
  }
}

async function getPackage(name: string, version: string) {
  // check if we already have a tweet for this package
  const getItem: aws.DynamoDB.GetItemInput = {
    TableName: TABLE_NAME,
    Key: toDynamoItemKey(name, version)
  };

  console.log(JSON.stringify({ getItem }, undefined, 2));
  const resp = await dynamodb.getItem(getItem).promise();
  if (!resp.Item) {
    return undefined;
  }

  return fromDynamoItem(resp.Item);
}

/**
 * Pauses the SQS event source.
 */
async function pauseMyEventSource(functionName: string) {
  const eventSources = await lambda.listEventSourceMappings({ FunctionName: functionName }).promise();
  console.log(JSON.stringify({ eventSources }));

  if (!eventSources.EventSourceMappings?.length) {
    throw new Error(`Unable to find event source mapping for this function`);
  }

  if (eventSources.EventSourceMappings.length !== 1) {
    throw new Error(`Expecting only a single event source for this function`);
  }

  const eventSource = eventSources.EventSourceMappings[0];

  // break if already disabled
  if (eventSource.State === 'Disabled' || eventSource.State === 'Disabling') {
    return;
  }

  const eventSourceId = eventSource.UUID;
  if (!eventSourceId) {
    throw new Error(`No UUID for event source`);
  }

  const updateEventSourceMapping: aws.Lambda.UpdateEventSourceMappingRequest = {
    UUID: eventSourceId,
    Enabled: false
  };

  console.log(JSON.stringify({ updateEventSourceMapping }));
  await lambda.updateEventSourceMapping(updateEventSourceMapping).promise();
}

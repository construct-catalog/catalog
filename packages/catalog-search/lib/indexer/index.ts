import * as aws from 'aws-sdk';
import * as elastic from '@elastic/elasticsearch';

function readEnv(key: string): string {
  const value = process.env[key]
  if (!value) {
    throw new Error(`'${key}' env variable must be set`)
  }
  return value;

}

const queueUrl = readEnv('QUEUE_URL');
const elasticEndpoint = readEnv('ELASTIC_ENDPOINT');
const elasticPassword = readEnv('ELASTIC_PASSWORD');
const elasticUsername = readEnv('ELASTIC_USERNAME');


const sqs = new aws.SQS();
const client = new elastic.Client({
  node: elasticEndpoint,
  auth: {
    username: elasticUsername,
    password: elasticPassword,
  },
})

async function recieve() {

  console.log(`Receiving messages from ${queueUrl}...`)

  const receiveParams: aws.SQS.ReceiveMessageRequest = {
    QueueUrl: queueUrl!,
    WaitTimeSeconds: 20,
    MaxNumberOfMessages: 10,
  }

  sqs.receiveMessage(receiveParams, async function(err: aws.AWSError, data: aws.SQS.ReceiveMessageResult) {

    try {

      if (err) {
        console.log('Failed recieving messages', err);
        return;
      }

      if (data.Messages && data.Messages.length > 0) {

        for (const message of data.Messages) {

          let document: any;
          try {
            document = parseMessage(message);
          } catch (err) {
            // sometimes the messages have an invalid format, lets just log these for now
            // and continue to the rest.
            console.log('Invalid message format', message, err);
            continue;
          }

          if (document) {
            try {
              await index(document);
            } catch (err) {
              console.log('Failed indexing message', err, message);
              continue;
            }
          }

          var deleteParams: aws.SQS.Types.DeleteMessageRequest = {
            QueueUrl: queueUrl!,
            ReceiptHandle: message.ReceiptHandle!,
          };

          sqs.deleteMessage(deleteParams, function(err, _) {
            if (err) {
              console.log('Failed deleting message', err, message);
            }
          });

        }

      }

    } finally {
      // https://github.com/aws/aws-sdk-js/issues/2793#issuecomment-517996521
      setTimeout(recieve, 10);
    }

  })

}

async function index(document: any) {

  try {
    const doc1: elastic.RequestParams.Index = {
      index: 'constructs',
      id: `${document.name}@${document.version}`,
      body: document,
    }
    await client.index(doc1)
    console.log(`Successfully indexed document ${doc1.id}`)
  } catch (err) {
    if (err.body) {
      throw new Error(`${err.message}: ${err.body.error.reason}: ${JSON.stringify(document)}`)
    }
    throw err;
  }

}

function parseMessage(message: aws.SQS.Message) {

  const image = JSON.parse(JSON.parse(message.Body!).Message).dynamodb.NewImage;

  if (!image.json) {
    // there are old entries that didn't have the 'json' key.
    // lets just skip these for now.
    return undefined;
  }

  const document = JSON.parse(image.json.S);

  // this conflicts with elastic's '_id'.
  delete document._id;

  // these properties can have different types (boolean/dictionary)
  // elastic does not like that.
  // https://github.com/nodejs/help/issues/2303#issuecomment-626828862
  delete document.bundleDependencies
  delete document.bundledDependencies

  return { tweetId: image.tweetid.S, ...document};

}

async function main() {

  await recieve();

}

main().catch((e: Error) => {
  console.error(e.stack);
  process.exit(1);
});


import * as aws from 'aws-sdk';

const ddb = new aws.DynamoDB();
const sqs = new aws.SQS();

async function main() {
  console.log('hello, world');

  const req: aws.DynamoDB.ScanInput = {
    TableName: process.env.TABLE_NAME!,
  };

  while (true) {
    const result = await ddb.scan(req).promise();
    for (const item of result.Items ?? []) {
      console.log(item.name.S, item.version.S);
      await queueItem(renderBody(item));
    }

    if (!result.LastEvaluatedKey) {
      break;
    }

    req.ExclusiveStartKey = result.LastEvaluatedKey;
  }
}

async function queueItem(body: string) {
  const req: aws.SQS.SendMessageRequest = {
    QueueUrl: process.env.QUEUE_URL!,
    MessageBody: body,
  };

  await sqs.sendMessage(req).promise();
}

function renderBody(item: aws.DynamoDB.AttributeMap) {
  return JSON.stringify({
    Message : renderMessage(item),
  }, undefined, 2);
}

function renderMessage(item: aws.DynamoDB.AttributeMap) {
  return JSON.stringify({
    dynamodb: {
      Keys: {
        name: {
          S: item.name.S,
        },
        version: {
          S: item.version.S,
        },
      },
      NewImage: item,
    },
  });
}

main().catch((e: Error) => {
  console.error(e.stack);
  process.exit(1);
});
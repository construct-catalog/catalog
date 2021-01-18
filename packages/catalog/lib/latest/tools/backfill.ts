import { DynamoDB, Lambda } from 'aws-sdk';

const region = 'us-east-1';
const TABLE_NAME = 'construct-catalog-prod-IndexerTable7C969A7E-1XLXG2NZH6LVQ';
const INGEST_LAMBDA_ARN = 'arn:aws:lambda:us-east-1:499430655523:function:construct-catalog-prod-LatestIngestion9DA490DE-SGEHKS04JVZ8';

const ddb = new DynamoDB({ region });
const lambda = new Lambda({ region });

async function main() {
  let ExclusiveStartKey: DynamoDB.Key | undefined = undefined;
  do {
    const scanInput: DynamoDB.ScanInput = {
      TableName: TABLE_NAME, 
      ExclusiveStartKey,
    };

    const result = await ddb.scan(scanInput).promise();
    if (result.Items != null) {
      const records: AWSLambda.DynamoDBRecord[] = result.Items
        .filter(item => !item?.name?.S?.startsWith('@aws-cdk/'))
        .map(item => ({
          dynamodb: {
            NewImage: item as { [key: string]: AWSLambda.AttributeValue },
            StreamViewType: 'NEW_IMAGE'
          },
          eventName: 'INSERT',
        } as AWSLambda.DynamoDBRecord));

      await ingestBatch(records);
    }
    ExclusiveStartKey = result.LastEvaluatedKey;
  } while (ExclusiveStartKey != null);
}

async function ingestBatch(records: readonly AWSLambda.DynamoDBRecord[]) {
  if (records.length === 0) {
    console.error('no records in batch');
    return;
  }

  const payload: AWSLambda.DynamoDBStreamEvent = {
    Records: Array.from(records)
  };

  const result = await lambda.invoke({
    FunctionName: INGEST_LAMBDA_ARN,
    Payload: JSON.stringify(payload),
  }).promise();

  for (const r of payload.Records) {
    console.error(`${r.dynamodb?.NewImage?.name?.S} ${r.dynamodb?.NewImage?.version?.S}`);
  }

  console.error(`RESULT: ${result.StatusCode}`);
}

main().catch((e: Error) => {
  console.error(e.stack);
  process.exit(1);
});

import { DynamoDB } from 'aws-sdk';
import { PackageTableAttributes, fromDynamoItem } from './lambda-util';
import { renderComparableVersion, renderLanguages } from './version-util'

const ddb = new DynamoDB();
const TABLE_NAME = process.env.TABLE_NAME;

export async function handler(event: AWSLambda.DynamoDBStreamEvent): Promise<void> {
  if (!TABLE_NAME) {
    throw new Error('TABLE_NAME is required');
  }

  for (const record of event.Records ?? []) {
    if (!record.dynamodb?.NewImage || !record.dynamodb.NewImage.version?.S) {
      continue;
    }

    const item = fromDynamoItem(record.dynamodb.NewImage);

    const { comparableVersion, majorVersion } = renderComparableVersion(record.dynamodb.NewImage.version.S);

    const languages = renderLanguages(record.dynamodb?.NewImage);

    // delete the "json" key to reduce bloat
    delete record.dynamodb?.NewImage?.json;

    console.log(JSON.stringify({ record }, undefined, 2));
    console.log(JSON.stringify({ item }, undefined, 2));

    const fullname = `${item.name}@${item.version}`;

    const putItem: DynamoDB.PutItemInput = {
      TableName: TABLE_NAME,
      Item: {
        ...record.dynamodb.NewImage,
        [PackageTableAttributes.MAJOR]: { N: majorVersion.toString() },
        [PackageTableAttributes.LANGUAGES]: { S: JSON.stringify(languages) },
        $comparableVersion: { S: comparableVersion },
      },
      ExpressionAttributeNames: {
        '#version': '$comparableVersion'
      },
      ExpressionAttributeValues: {
        ':version': { S: comparableVersion },
      },
      ConditionExpression: 'attribute_not_exists(#version) OR #version <= :version',
    };

    try {
      await ddb.putItem(putItem).promise();
      console.log(`new version: ${fullname} (updated)`);
    } catch (e) {
      if (e.code !== 'ConditionalCheckFailedException') {
        throw e;
      } else {
        console.log(`old version: ${fullname} (skipped)`)
      }
    }
  }
}

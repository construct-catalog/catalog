import type { Package } from "catalog-schema";
import aws = require('aws-sdk');

export const enum PackageTableAttributes {
  NAME = 'name',
  MAJOR = 'major',
  VERSION = 'version',
  METADATA = 'metadata',
  URL = 'url',
  TWEETID = 'tweetid',
  JSON = 'json',
  LANGUAGES = 'languages',
}


export function env(name: string, defaultValue?: string): string {
  const value = process.env[name];
  if (!value) {
    if (defaultValue !== undefined) {
      return defaultValue;
    } else {
      throw new Error(`${name} is required`);
    }
  }

  return value;
}

export function toDynamoItemKey(name: string, version: string): aws.DynamoDB.AttributeMap {
  return {
    [PackageTableAttributes.NAME]: { S: name },
    [PackageTableAttributes.VERSION]: { S: version },
  };
}

export function toDynamoItem(p: Package): aws.DynamoDB.AttributeMap {
  console.log(JSON.stringify({ toDynamoItem: p }, undefined, 2));

  const output: aws.DynamoDB.AttributeMap = {
    ...toDynamoItemKey(p.name, p.version),
    [PackageTableAttributes.METADATA]: { S: JSON.stringify(p.metadata) },
  };

  if (p.url) {
    output[PackageTableAttributes.URL] = { S: p.url };
  }

  if (p.tweetid) {
    output[PackageTableAttributes.TWEETID] = { S: p.tweetid };
  }

  if (p.json) {
    output[PackageTableAttributes.JSON] = { S: JSON.stringify(p.json) };
  }

  return output;
}

export function fromDynamoItem(dynamoItem: aws.DynamoDB.AttributeMap): Package {

  const name = dynamoItem[PackageTableAttributes.NAME]?.S;
  if (!name) { throw new Error(`invalid schema: attribute ${PackageTableAttributes.NAME} is expected`); }

  const version = dynamoItem[PackageTableAttributes.VERSION]?.S;
  if (!version) { throw new Error(`invalid schema: attribute ${PackageTableAttributes.VERSION} is expected`); }

  const metadataText = dynamoItem[PackageTableAttributes.METADATA]?.S;
  if (!metadataText) { throw new Error(`invalid schema: attribute ${PackageTableAttributes.METADATA} is expected`); }

  const majorS = dynamoItem[PackageTableAttributes.MAJOR]?.N;
  const major = majorS ? parseInt(majorS) : undefined;

  const languagesText = dynamoItem[PackageTableAttributes.LANGUAGES]?.S;

  return {
    name: name,
    version: version,
    metadata: JSON.parse(metadataText),
    major,
    languages: languagesText ? JSON.parse(languagesText) : undefined,
    tweetid: dynamoItem[PackageTableAttributes.TWEETID]?.S,
    url: dynamoItem[PackageTableAttributes.URL]?.S,
    json: dynamoItem[PackageTableAttributes.JSON]?.S,
  };
}

export function extractPackageStream(sqsEvent: AWSLambda.SQSEvent): Array<Package> {
  const records = new Array<Package>();

  for (const sqsRecord of sqsEvent.Records) {
    console.log({ sqsRecord });

    if (!sqsRecord.body) {
      console.log('skipping');
      continue;
    }

    const snsEvent = JSON.parse(sqsRecord.body) as AWSLambda.SNSMessage;
    if (!snsEvent.Message) {
      console.log('skipping');
      continue;
    }

    const record = JSON.parse(snsEvent.Message) as AWSLambda.DynamoDBRecord;
    if (!record.dynamodb) {
      console.log('skipping');
      continue;
    }

    console.log({ dynamoRecord: record.dynamodb });

    const jsonText = parseOptionStringValue(record.dynamodb, PackageTableAttributes.JSON);

    records.push({
      name: parseStringValue(record.dynamodb, PackageTableAttributes.NAME),
      version: parseStringValue(record.dynamodb, PackageTableAttributes.VERSION),
      metadata: JSON.parse(parseStringValue(record.dynamodb, PackageTableAttributes.METADATA)),
      url: parseOptionStringValue(record.dynamodb, PackageTableAttributes.URL),
      json: jsonText ? JSON.parse(jsonText) : undefined
    });
  }

  return records;
}

function parseOptionStringValue(record: AWSLambda.StreamRecord, name: string) {
  console.log(`parsing field ${name} from ${JSON.stringify(record)}`);
  if (!record.NewImage) {
    return undefined;
  }

  const v = record.NewImage[name];
  if (!v) {
    return undefined;
  }

  const value = v.S;
  if (!value) {
    throw new Error(`Field ${name} must be a STRING`);
  }

  return value;
}

function parseStringValue(record: AWSLambda.StreamRecord, name: string) {
  const value = parseOptionStringValue(record, name);
  if (!value) {
    throw new Error(`No field ${name} in table record`);
  }
  return value;
}

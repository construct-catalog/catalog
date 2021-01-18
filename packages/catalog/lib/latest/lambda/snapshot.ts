import { DynamoDB, S3 } from 'aws-sdk';
import * as crypto from 'crypto';
import { fromDynamoItem } from './lambda-util';

const ddb = new DynamoDB();
const s3 = new S3();

const BUCKET_NAME = process.env.BUCKET_NAME;
const BUCKET_KEY = process.env.BUCKET_KEY;
const TABLE_NAME = process.env.TABLE_NAME;

export async function handler(): Promise<unknown> {
  if (!BUCKET_NAME) {
    throw new Error('BUCKET_NAME is required!');
  }
  if (!BUCKET_KEY) {
    throw new Error('BUCKET_KEY is required!');
  }
  if (!TABLE_NAME) {
    throw new Error('TABLE_NAME is required!');
  }

  const packages = new Array<any>();

  let ExclusiveStartKey: DynamoDB.Key | undefined = undefined;
  do {
    const scanReq: DynamoDB.ScanInput = { TableName: TABLE_NAME, ExclusiveStartKey };
    const result = await ddb.scan(scanReq).promise();
    packages.push(...result.Items?.map(fromDynamoItem) ?? []);
    ExclusiveStartKey = result.LastEvaluatedKey;
  } while (ExclusiveStartKey != null);

  const updated = new Date().toISOString();
  const payload = Buffer.from(JSON.stringify({ packages, updated }, null, 2));
  const md5 = crypto.createHash('md5').update(payload).digest('base64');
  const putObject: S3.Types.PutObjectRequest = {
    Bucket: BUCKET_NAME,
    Key: BUCKET_KEY,
    Body: payload,
    CacheControl: 'public,must-revalidate,proxy-revalidate,max-age=0',
    ContentDisposition: 'inline',
    ContentLength: payload.length,
    ContentMD5: md5,
    ContentType: 'application/json; charset=utf-8',
  };
  
  return s3.putObject(putObject).promise();
}
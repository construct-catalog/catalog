import { Construct, Duration } from 'monocdk-experiment';
import * as dynamodb from 'monocdk-experiment/aws-dynamodb';
import * as lambda from 'monocdk-experiment/aws-lambda';
import * as s3 from 'monocdk-experiment/aws-s3';
import * as cwe from 'monocdk-experiment/aws-events';
import * as cwet from 'monocdk-experiment/aws-events-targets';
import * as events from 'monocdk-experiment/aws-lambda-event-sources';
import { PackageTableAttributes } from '../lambda-util';

export interface LatestProps {
  readonly inputTables: dynamodb.Table[];
  readonly snapshotBucket: s3.Bucket;
  readonly snapshotKey: string;
}

export class Latest extends Construct {
  constructor(scope: Construct, id: string, props: LatestProps) {
    super(scope, id);

    const latestTable = new dynamodb.Table(this, 'Latest', {
      partitionKey: {
        name: PackageTableAttributes.NAME,
        type: dynamodb.AttributeType.STRING
      },
      sortKey: {
        name: PackageTableAttributes.MAJOR,
        type: dynamodb.AttributeType.NUMBER
      },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      stream: dynamodb.StreamViewType.NEW_IMAGE,
    });

    const ingestion = new lambda.Function(this, 'Ingestion', {
      runtime: lambda.Runtime.NODEJS_12_X,
      handler: 'ingestion.handler',
      code: lambda.Code.fromAsset(`${__dirname}/lambda`),
      timeout: Duration.minutes(15),
      environment: {
        TABLE_NAME: latestTable.tableName,
      }
    });

    for (const inputTable of props.inputTables) {
      ingestion.addEventSource(new events.DynamoEventSource(inputTable, {
        startingPosition: lambda.StartingPosition.LATEST,
      }));
    }

    latestTable.grantReadWriteData(ingestion);

    const snapshot = new lambda.Function(this, 'Snapshot', {
      runtime: lambda.Runtime.NODEJS_12_X,
      handler: 'snapshot.handler',
      timeout: Duration.minutes(15),
      code: lambda.Code.fromAsset(`${__dirname}/lambda`),
      environment: {
        TABLE_NAME: latestTable.tableName,
        BUCKET_NAME: props.snapshotBucket.bucketName,
        BUCKET_KEY: props.snapshotKey,
      }
    });

    props.snapshotBucket.grantWrite(snapshot);
    latestTable.grantReadData(snapshot);

    // take snapshot every 5 minutes
    const refresh = new cwe.Rule(this, 'RefreshSnapshot', {
      schedule: cwe.Schedule.rate(Duration.minutes(5))
    });
    refresh.addTarget(new cwet.LambdaFunction(snapshot));
  }
}

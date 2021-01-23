import { Construct, Duration, RemovalPolicy } from "monocdk-experiment";
import events = require('monocdk-experiment/aws-events');
import targets = require('monocdk-experiment/aws-events-targets');
import cloudwatch = require('monocdk-experiment/aws-cloudwatch');
import { NodeFunction } from "../util/node-function";
import ids = require('./lambda/ids');
import dynamo = require('monocdk-experiment/aws-dynamodb');
import { PackageTableAttributes } from '../lambda-util';
import sns = require('monocdk-experiment/aws-sns');
import { DynamoTopic, EventType } from "../util/dynamo-topic";

export interface IngestionProps {
  /**
   * @default Duration.minutes(1)
   */
  readonly period?: Duration;
}

export class Ingestion extends Construct {
  public readonly topic: sns.Topic;
  public readonly discoveredPerFiveMinutes: cloudwatch.Metric;
  public readonly logGroup: string;

  constructor(scope: Construct, id: string, props: IngestionProps = {}) {
    super(scope, id);

    const table = new dynamo.Table(this, 'Table', {
      partitionKey: { type: dynamo.AttributeType.STRING, name: PackageTableAttributes.NAME, },
      sortKey: { type: dynamo.AttributeType.STRING, name: PackageTableAttributes.VERSION, },
      stream: dynamo.StreamViewType.NEW_AND_OLD_IMAGES,
      removalPolicy: RemovalPolicy.DESTROY
    });

    this.topic = new DynamoTopic(this, 'Topic', {
      source: table,
      events: [ EventType.INSERT ]
    });

    const handler = new NodeFunction(this, 'Function', {
      codeDirectory: __dirname + '/lambda',
      environment: {
        [ids.Environment.TABLE_NAME]: table.tableName
      }
    });

    new events.Rule(this, 'Tick', {
      schedule: events.Schedule.rate(props.period || Duration.minutes(1)),
      targets: [ new targets.LambdaFunction(handler) ]
    });

    table.grantWriteData(handler);

    this.discoveredPerFiveMinutes = this.topic.metricNumberOfMessagesPublished();
    this.logGroup = `/aws/lambda/${handler.functionName}`;
  }
}

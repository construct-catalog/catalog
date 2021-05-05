import { Construct, RemovalPolicy, Duration } from "monocdk-experiment";
import { NodeFunction } from "../util/node-function";
import ids = require('./lambda/ids');
import { SqsEventSource } from "monocdk-experiment/aws-lambda-event-sources";
import { Website } from "../website";
import dynamo = require('monocdk-experiment/aws-dynamodb');
import { PackageTableAttributes } from "../lambda-util";
import sns = require('monocdk-experiment/aws-sns');
import subscriptions = require('monocdk-experiment/aws-sns-subscriptions');
import sqs = require('monocdk-experiment/aws-sqs');
import { DynamoTopic, EventType } from "../util/dynamo-topic";
import cloudwatch = require('monocdk-experiment/aws-cloudwatch');

interface RendererProps {
  readonly input: sns.Topic;
  readonly website: Website;
}

export class Renderer extends Construct {
  /**
   * A topic which receives a notification every time a module is rendered.
   */
  public readonly topic: sns.Topic;

  /**
   * Total number of messages rendered every minute.
   */
  public readonly renderedPerFiveMinutes: cloudwatch.Metric;

  /**
   * The log group which contains logs for the renderer.
   */
  public readonly logGroup: string;

  public readonly table: dynamo.Table;

  constructor(parent: Construct, id: string, props: RendererProps) {
    super(parent, id);

    const timeout = Duration.minutes(15);

    const queue = new sqs.Queue(this, 'Queue', {
      visibilityTimeout: timeout
    });

    props.input.addSubscription(new subscriptions.SqsSubscription(queue));

    this.table = new dynamo.Table(this, 'Table', {
      partitionKey: { type: dynamo.AttributeType.STRING, name: PackageTableAttributes.NAME, },
      sortKey: { type: dynamo.AttributeType.STRING, name: PackageTableAttributes.VERSION, },
      stream: dynamo.StreamViewType.NEW_AND_OLD_IMAGES,
      removalPolicy: RemovalPolicy.DESTROY
    });

    const handler = new NodeFunction(this, 'Function', {
      timeout: timeout,
      codeDirectory: __dirname + '/lambda',
      memorySize: 1024,
      dependencies: [ 'cdk-docgen', 'fs-extra', 's3' ],
      environment: {
        [ids.Environment.BUCKET_NAME]: props.website.bucket.bucketName,
        [ids.Environment.BASE_URL]: props.website.baseUrl,
        [ids.Environment.OBJECT_PREFIX]: props.website.packagesObjectPrefix || '',
        [ids.Environment.METADATA_FILENAME]: props.website.metadataFile,
        [ids.Environment.JSII_ASSEMBLY_FILENAME]: props.website.jsiiAssemblyFile,
        [ids.Environment.TABLE_NAME]: this.table.tableName
      },
      events: [ new SqsEventSource(queue) ]
    });

    props.website.bucket.grantReadWrite(handler);
    this.table.grantReadWriteData(handler);

    this.topic = new DynamoTopic(this, 'Topic', {
      source: this.table,
      events: [ EventType.INSERT ]
    });

    this.renderedPerFiveMinutes = this.topic.metricNumberOfMessagesPublished();
    this.logGroup = `/aws/lambda/${handler.functionName}`;
  }
}

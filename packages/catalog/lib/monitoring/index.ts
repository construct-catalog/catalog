import { Construct, Stack } from "monocdk-experiment";
import cloudwatch = require('monocdk-experiment/aws-cloudwatch');
import s3 = require('monocdk-experiment/aws-s3');
import dynamodb = require('monocdk-experiment/aws-dynamodb');

export interface MonitoringProps {
  readonly discoveredPerFiveMinutes: cloudwatch.Metric;
  readonly renderedPerFiveMinutes: cloudwatch.Metric;
  readonly tweetsPerFiveMinutes: cloudwatch.Metric;
  readonly bucket: s3.Bucket;
  readonly ingestionLogGroup: string;
  readonly rendererLogGroup: string;
  readonly indexerLogGroup: string;
  readonly packagesTable: dynamodb.Table;
  readonly lambdaErrorMetrics: cloudwatch.IMetric[];
}

export class Monitoring extends Construct {
  constructor(scope: Construct, id: string, props: MonitoringProps) {
    super(scope, id);

    const dashboard = new cloudwatch.Dashboard(this, 'Dashboard');

    dashboard.addWidgets(new cloudwatch.TextWidget({
      width: 24,
      height: 1,
      markdown: `# Resources`
    }));

    dashboard.addWidgets(new cloudwatch.TextWidget({
      width: 24,
      height: 2,
      markdown: [
        `[button:Website Bucket](${this.linkToS3Console(props.bucket)})`,
        `[button:Packages Table](${this.linkToDynamoConsole(props.packagesTable)})`,
        `|`,
        `[button:Ingestion Logs](${this.linkToLogGroup(props.ingestionLogGroup)})`,
        `[button:Renderer Logs](${this.linkToLogGroup(props.rendererLogGroup)})`,
        `[button:Indexer Logs](${this.linkToLogGroup(props.indexerLogGroup)})`,
      ].join('\n')
    }));

    dashboard.addWidgets(new cloudwatch.TextWidget({
      width: 24,
      height: 1,
      markdown: `# Ingestion Pipeline`
    }));

    dashboard.addWidgets(
      new cloudwatch.GraphWidget({ title : 'Discovered/5m', left: [ props.discoveredPerFiveMinutes ]}),
      new cloudwatch.GraphWidget({ title: 'Rendered/5m', left: [ props.renderedPerFiveMinutes ] }),
      new cloudwatch.GraphWidget({ title: 'Tweeted/5m', left: [ props.tweetsPerFiveMinutes ] }),
    );

    dashboard.addWidgets(
      new cloudwatch.GraphWidget({
        title: 'Lambda Errors',
        left: props.lambdaErrorMetrics,
        width: 24
      })
    )
  }

  private linkToS3Console(bucket: s3.Bucket) {
    return `https://console.aws.amazon.com/s3/buckets/${bucket.bucketName}/?region=${this.region}`
  }

  private linkToDynamoConsole(table: dynamodb.Table) {
    return `https://console.aws.amazon.com/dynamodb/home?region=${this.region}#tables:selected=${table.tableName};tab=items`;
  }

  private linkToLogGroup(logGroup: string) {
    return `https://console.aws.amazon.com/cloudwatch/home?region=${this.region}#logEventViewer:group=${logGroup};start=PT30S`
  }

  private get region() {
    return Stack.of(this).region;
  }
}


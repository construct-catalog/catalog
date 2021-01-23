import { Construct, Stack } from "monocdk-experiment";
import { Alarm, TreatMissingData } from "monocdk-experiment/aws-cloudwatch";
import { SnsAction } from "monocdk-experiment/aws-cloudwatch-actions";
import { Topic } from "monocdk-experiment/aws-sns";
import { SlackChannelConfiguration } from "monocdk-experiment/aws-chatbot";
import { ManagedPolicy } from "monocdk-experiment/aws-iam";
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
  readonly lambdaErrorMetrics: cloudwatch.Metric[];
  readonly slack?: SlackMonitoringProps;
}

export interface SlackMonitoringProps {
  readonly workspaceId: string;
  readonly channelId: string;
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
    );

    const alarmTopic = new Topic(this, 'alarm-topic', {
      displayName: 'All Construct Catalog alarm notifications'
    });

    if (props.slack) {
      const slackChannelConfiguration = new SlackChannelConfiguration(this, 'slack-notifications', {
        slackChannelConfigurationName: "construct-catalog",
        slackWorkspaceId: props.slack.workspaceId,
        slackChannelId: props.slack.channelId,
        notificationTopics: [ alarmTopic ],
      });
      slackChannelConfiguration.role?.addManagedPolicy(ManagedPolicy.fromAwsManagedPolicyName("CloudWatchReadOnlyAccess"))
    }

    props.lambdaErrorMetrics.forEach((metric, index)=>{
      const alarm = new Alarm(this, `alarm-${metric.label}-${index}`, {
        metric: metric,
        threshold: 1,
        evaluationPeriods: 1,
        treatMissingData: TreatMissingData.NOT_BREACHING,
        actionsEnabled: true
      });
      alarm.addAlarmAction(new SnsAction(alarmTopic));
    });
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


import { Stack, Construct, StackProps } from 'monocdk-experiment';
import { Ingestion } from '../lib/ingestion';
import { Renderer } from "../lib/renderer";
import { Website } from '../lib/website';
import { Tweeter, TweetRate } from '../lib/tweeter';
import secrets = require('monocdk-experiment/aws-secretsmanager');
import { Monitoring } from '../lib/monitoring';
import { HostedZone } from 'monocdk-experiment/aws-route53';
import * as sns from 'monocdk-experiment/aws-sns';
import * as dynamodb from 'monocdk-experiment/aws-dynamodb';
import { AccountPrincipal, PolicyStatement } from "monocdk-experiment/aws-iam";
import { Latest } from '../lib/latest';

export interface CatalogStackProps extends StackProps {

  /**
   * Optional AWS Account ID's that are given subscription rights to the Renderer SQS topic.
   */
  readonly externalAccountSubscribers?: string[];

  /**
   * Domain name.
   */
  readonly domainName?: string;

  /**
   * Twitter credentials.
   */
  readonly twitterSecretArn?: string;

  /**
   * Tweet rate limiting.
   */
  readonly twitterRateLimit: TweetRate;
}

export class CatalogStack extends Stack {

  /**
   * An SNS topic that receives all the updates.
   */
  public readonly updates: sns.Topic;

  /**
   * The modules table.
   */
  public readonly modulesTable: dynamodb.Table;

  constructor(scope: Construct, id: string, props: CatalogStackProps) {
    super(scope, id, { env: props.env });

    const website = new Website(this, 'Website', {
      domainName: props.domainName,
      hostedZone: props.domainName ? HostedZone.fromLookup(this, 'HostedZone', { domainName: props.domainName }) : undefined
    });

    const ingestion = new Ingestion(this, 'Ingestion');

    const renderer = new Renderer(this, 'Renderer', {
      input: ingestion.topic,
      website
    });


    if (props.externalAccountSubscribers) {
      renderer.topic.addToResourcePolicy(new PolicyStatement({
        resources: [renderer.topic.topicArn],
        actions: [
          "sns:Subscribe",
        ],
        principals: props.externalAccountSubscribers.map((account: string) => new AccountPrincipal(account))
      }));
  }

    const twitterCredentials = props.twitterSecretArn
      ? secrets.Secret.fromSecretArn(this, 'twitter', props.twitterSecretArn)
      : undefined;

    const tweeter = new Tweeter(this, 'Indexer', {
      input: renderer.topic,
      twitterCredentials,
      rate: props.twitterRateLimit
    });

    new Latest(this, 'Latest', {
      inputTables: [renderer.table, tweeter.table],
      snapshotBucket: website.bucket,
      snapshotKey: `${website.indexObjectPrefix}packages.json`
    });

    new Monitoring(this, 'Monitoring', {
      renderedPerFiveMinutes: renderer.renderedPerFiveMinutes,
      tweetsPerFiveMinutes: tweeter.tweetsPerFiveMinute,
      discoveredPerFiveMinutes: ingestion.discoveredPerFiveMinutes,
      bucket: website.bucket,
      indexerLogGroup: tweeter.logGroup,
      ingestionLogGroup: ingestion.logGroup,
      rendererLogGroup: renderer.logGroup,
      packagesTable: tweeter.table
    });

    this.updates = tweeter.topic;
    this.modulesTable = tweeter.table;
  }
}

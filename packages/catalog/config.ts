import { CatalogStackProps } from "./stacks/catalog-stack";
import { Duration } from "monocdk-experiment";

/**
 * Configuration for development stacks. Can be used in any account.
 */
export const dev: CatalogStackProps = {
  twitterRateLimit: { quota: 20, window: Duration.minutes(5) },
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION,
  },
};

/**
 * Configuration for the production stack, can only be used in the catalog's
 * production account.
 */
export const prod: CatalogStackProps = {
  // https://developer.twitter.com/en/docs/basics/rate-limits
  twitterRateLimit: { quota: 300, window: Duration.hours(3) },
  twitterSecretArn: 'arn:aws:secretsmanager:us-east-1:499430655523:secret:twitter/catalog/17099604-5EGGKe',
  domainName: 'awscdk.io',
  env: {
    account: '499430655523',
    region: 'us-east-1',
  },
  externalAccountSubscribers: [
    "536309290949"  // so matthew.bonig@gmail.com can auto-build his constructs when new versions of `core` are released.
  ],
  slack: {
    workspaceId: 'T017JQ2SWES', // cdk.dev
    channelId: 'C01K8HS7C1L' // #construct-catalog-alarms
  },
};

import * as sns from 'monocdk-experiment/aws-sns';
import * as subscriptions from 'monocdk-experiment/aws-sns-subscriptions';
import * as sqs from 'monocdk-experiment/aws-sqs';
import * as ec2 from 'monocdk-experiment/aws-ec2';
import * as eks from 'monocdk-experiment/aws-eks';
import * as iam from 'monocdk-experiment/aws-iam';
import * as dynamodb from 'monocdk-experiment/aws-dynamodb';

import { Construct } from 'monocdk-experiment';
import { KubernetesVersion } from "monocdk-experiment/aws-eks";

export interface SearchProps {
  /**
   * The VPC to put the EKS cluster in.
   */
  readonly vpc: ec2.Vpc;

  /**
   * A topic which receives all module updates.
   */
  readonly updates: sns.Topic;

  /**
   * The DynamoDB table which contains all the modules.
   */
  readonly modulesTable: dynamodb.Table;
}

export class Search extends Construct {
  constructor(scope: Construct, id: string, props: SearchProps) {
    super(scope, id);

    const mastersRole = new iam.Role(this, 'ClusterAdmin', {
      assumedBy: new iam.AccountRootPrincipal()
    });

    const cluster = new eks.Cluster(this, 'Kubernetes', {
      vpc: props.vpc,
      mastersRole,
      defaultCapacity: 0,
      version: KubernetesVersion.V1_17
    });

    cluster.addNodegroupCapacity('public', {
      desiredSize: 4,
      subnets: { subnetType: ec2.SubnetType.PUBLIC }
    });

    cluster.role.addToPolicy(new iam.PolicyStatement({
      actions: [ 'iam:ListAttachedRolePolicies' ],
      resources: [ '*' ]
    }));

    const updatesQueue = new sqs.Queue(this, 'UpdatesQueue');
    props.updates.addSubscription(new subscriptions.SqsSubscription(updatesQueue));

    const serviceAccount = cluster.addServiceAccount('search', {
      name: 'search'
    });

    updatesQueue.grantConsumeMessages(serviceAccount);
    updatesQueue.grantSendMessages(serviceAccount);
    props.modulesTable.grantReadData(serviceAccount);

    cluster.addManifest('AwsResources', {
      apiVersion: 'v1',
      kind: 'ConfigMap',
      metadata: {
        name: 'aws-resources'
      },
      data: {
        queueArn: updatesQueue.queueArn,
        queueUrl: updatesQueue.queueUrl,
        tableName: props.modulesTable.tableName
      }
    });
  }
}
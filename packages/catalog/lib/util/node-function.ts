import lambda = require('monocdk-experiment/aws-lambda');
import os = require('os');
import path = require('path');
import fs = require('fs');
import iam = require('monocdk-experiment/aws-iam');
import sqs = require('monocdk-experiment/aws-sqs');
import ec2 = require('monocdk-experiment/aws-ec2');
import logs = require('monocdk-experiment/aws-logs');
import cloudwatch = require('monocdk-experiment/aws-cloudwatch');

import { Construct, Duration, FileSystem, SymlinkFollowMode } from 'monocdk-experiment';
import { AssetOptions } from 'monocdk-experiment/aws-s3-assets';
import { FollowMode } from 'monocdk-experiment/lib/assets';
import { Unit } from "monocdk-experiment/aws-cloudwatch";

export interface NodeFunctionProps {
  /**
   * Handler code directory
   */
  readonly codeDirectory: string;

  /**
   * Options on how to handle the directory asset (for example, how to follow symlinks).
   */
  readonly assetOptions?: AssetOptions;

  /**
   * A description of the function.
   *
   * @default - No description.
   */
  readonly description?: string;

  /**
   * Name of handler's index file (with or without the .js extension)
   * @default index.js
   */
  readonly indexFile?: string;

  /**
   * The name of the function exported by `indexFile`.
   *
   * @default handler
   */
  readonly indexFunction?: string;

  /**
   * Dependencies to bundle.
   */
  readonly dependencies?: string[];

  /**
   * The function execution time (in seconds) after which Lambda terminates
   * the function. Because the execution time affects cost, set this value
   * based on the function's expected execution time.
   *
   * @default Duration.minutes(1)
   */
  readonly timeout?: Duration;

  /**
   * Key-value pairs that Lambda caches and makes available for your Lambda
   * functions. Use environment variables to apply configuration changes, such
   * as test and production environment configurations, without changing your
   * Lambda function source code.
   *
   * @default - No environment variables.
   */
  readonly environment?: {
      [key: string]: string;
  };

  /**
   * A name for the function.
   *
   * @default - AWS CloudFormation generates a unique physical ID and uses that
   * ID for the function's name. For more information, see Name Type.
   */
  readonly functionName?: string;
  /**
   * The amount of memory, in MB, that is allocated to your Lambda function.
   * Lambda uses this value to proportionally allocate the amount of CPU
   * power. For more information, see Resource Model in the AWS Lambda
   * Developer Guide.
   *
   * @default 128
   */
  readonly memorySize?: number;
  /**
   * Initial policy statements to add to the created Lambda Role.
   *
   * You can call `addToRolePolicy` to the created lambda to add statements post creation.
   *
   * @default - No policy statements are added to the created Lambda role.
   */
  readonly initialPolicy?: iam.PolicyStatement[];
  /**
   * Lambda execution role.
   *
   * This is the role that will be assumed by the function upon execution.
   * It controls the permissions that the function will have. The Role must
   * be assumable by the 'lambda.amazonaws.com' service principal.
   *
   * @default - A unique role will be generated for this lambda function.
   * Both supplied and generated roles can always be changed by calling `addToRolePolicy`.
   */
  readonly role?: iam.IRole;
  /**
   * VPC network to place Lambda network interfaces
   *
   * Specify this if the Lambda function needs to access resources in a VPC.
   *
   * @default - Function is not placed within a VPC.
   */
  readonly vpc?: ec2.IVpc;
  /**
   * Where to place the network interfaces within the VPC.
   *
   * Only used if 'vpc' is supplied. Note: internet access for Lambdas
   * requires a NAT gateway, so picking Public subnets is not allowed.
   *
   * @default - Private subnets.
   */
  readonly vpcSubnets?: ec2.SubnetSelection;
  /**
   * What security group to associate with the Lambda's network interfaces.
   *
   * Only used if 'vpc' is supplied.
   *
   * @default - If the function is placed within a VPC and a security group is
   * not specified, a dedicated security group will be created for this
   * function.
   */
  readonly securityGroup?: ec2.ISecurityGroup;
  /**
   * Whether to allow the Lambda to send all network traffic
   *
   * If set to false, you must individually add traffic rules to allow the
   * Lambda to connect to network targets.
   *
   * @default true
   */
  readonly allowAllOutbound?: boolean;
  /**
   * Enabled DLQ. If `deadLetterQueue` is undefined,
   * an SQS queue with default options will be defined for your Function.
   *
   * @default - false unless `deadLetterQueue` is set, which implies DLQ is enabled.
   */
  readonly deadLetterQueueEnabled?: boolean;
  /**
   * The SQS queue to use if DLQ is enabled.
   *
   * @default - SQS queue with 14 day retention period if `deadLetterQueueEnabled` is `true`
   */
  readonly deadLetterQueue?: sqs.IQueue;
  /**
   * Enable AWS X-Ray Tracing for Lambda Function.
   *
   * @default Tracing.Disabled
   */
  readonly tracing?: lambda.Tracing;
  /**
   * A list of layers to add to the function's execution environment. You can configure your Lambda function to pull in
   * additional code during initialization in the form of layers. Layers are packages of libraries or other dependencies
   * that can be used by mulitple functions.
   *
   * @default - No layers.
   */
  readonly layers?: lambda.ILayerVersion[];
  /**
   * The maximum of concurrent executions you want to reserve for the function.
   *
   * @default - No specific limit - account limit.
   * @see https://docs.aws.amazon.com/lambda/latest/dg/concurrent-executions.html
   */
  readonly reservedConcurrentExecutions?: number;
  /**
   * Event sources for this function.
   *
   * You can also add event sources using `addEventSource`.
   *
   * @default - No event sources.
   */
  readonly events?: lambda.IEventSource[];
  /**
   * The number of days log events are kept in CloudWatch Logs. When updating
   * this property, unsetting it doesn't remove the log retention policy. To
   * remove the retention policy, set the value to `Infinity`.
   *
   * @default - Logs never expire.
   */
  readonly logRetention?: logs.RetentionDays;
  /**
   * The IAM role for the Lambda function associated with the custom resource
   * that sets the retention policy.
   *
   * @default - A new role is created.
   */
  readonly logRetentionRole?: iam.IRole;
}

export class NodeFunction extends lambda.Function {
  constructor(scope: Construct, id: string, props: NodeFunctionProps) {
    if (!fs.existsSync(props.codeDirectory)) {
      throw new Error(`Can't find ${props.codeDirectory}`)
    }

    const runtime = discoverNode();
    const timeout = props.timeout || Duration.minutes(1);

    if (runtime.family !== lambda.RuntimeFamily.NODEJS) {
      throw new Error(`Runtime must be a NODEJS runtime`);
    }

    const bundleDir = prepareBundle(props);
    const assetOptions = props.assetOptions || { follow: FollowMode.ALWAYS };

    super(scope, id, {
      ...props,
      handler: renderHandler(props),
      code: lambda.Code.fromAsset(bundleDir, assetOptions),
      runtime,
      timeout,
    });
  }

  public get errorMetric(): cloudwatch.Metric {
    return this.metricErrors({
      unit: Unit.COUNT,
      label: `${this.node.scope?.node.id}-${this.node.id}`, // this needs a stable hash
      period: Duration.minutes(1),
    });
  }
}

function prepareBundle(props: NodeFunctionProps): string {
  if (!props.dependencies || props.dependencies.length === 0) {
    return props.codeDirectory;
  }

  const bundleDir = fs.mkdtempSync(path.join(os.tmpdir(), 'bundle'));

  FileSystem.copyDirectory(props.codeDirectory, bundleDir, {
    follow: SymlinkFollowMode.ALWAYS
  });

  const bundleModules = `${bundleDir}/node_modules`;
  fs.mkdirSync(bundleModules);

  for (const dep of props.dependencies) {
    copyModule(dep, bundleModules);
  }

  return bundleDir;
}

function copyModule(packageName: string, nodeModules: string, source?: string) {

  const packageJson = require.resolve(`${packageName}/package.json`, {
    paths: source ? [ source ] : undefined
  });


  const packageDir = path.dirname(packageJson);
  const metadata = JSON.parse(fs.readFileSync(packageJson, 'utf-8'));

  const targetDir = `${nodeModules}/${packageName}`;

  if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir, { recursive: true });

    FileSystem.copyDirectory(packageDir, targetDir, {
      exclude: [ 'node_modules' ] ,
      follow: SymlinkFollowMode.ALWAYS
    });
  }

  const packageNodeModules = path.join(targetDir, 'node_modules');
  fs.mkdirSync(packageNodeModules);

  const transitive = metadata.dependencies || {};
  for (const dep of Object.keys(transitive)) {
    copyModule(dep, packageNodeModules, packageDir);
  }
}

function renderHandler(props: NodeFunctionProps): string {

  const indexFileName = props.indexFile || 'index.js';
  const indexFile = path.basename(indexFileName, '.js');

  const indexFunction = props.indexFunction || 'handler';
  return `${indexFile}.${indexFunction}`;
}

function discoverNode() {
  return lambda.Runtime.NODEJS_10_X;
}

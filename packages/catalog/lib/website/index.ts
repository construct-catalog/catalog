import { Construct } from "monocdk-experiment";
import s3 = require('monocdk-experiment/aws-s3');
import * as cf from 'monocdk-experiment/aws-cloudfront';
import { StaticWebsite } from "../util/static-website";
import { MaterializeBucketIndex } from "../util/materialize-bucket-index";
import { IHostedZone } from "monocdk-experiment/aws-route53";
import s3deploy = require('monocdk-experiment/aws-s3-deployment');
import * as path from 'path';

export interface WebsiteProps {
  readonly hostedZone?: IHostedZone;
  readonly domainName?: string;
}

const distDir = path.join(path.dirname(require.resolve('catalog-frontend/package.json')), 'build');
console.log({distDir});

export class Website extends Construct {
  public readonly bucket: s3.Bucket;
  public readonly packagesObjectPrefix = 'packages/';
  public readonly indexObjectPrefix = 'index/';
  public readonly metadataFile: string = 'metadata.json';
  public readonly baseUrl: string = 'https://awscdk.io';

  constructor(scope: Construct, id: string, props: WebsiteProps = { }) {
    super(scope, id);

    this.bucket = new s3.Bucket(this, 'Bucket');

    // automatically materializes all index.html files so they can be served
    // without the file name: "foo/bar/index.html" => "foo/bar" (and also "foo/bar/")
    // (cloudfront doesn't support default index files)
    new MaterializeBucketIndex(this, 'MaterializeIndexFiles', {
      bucket: this.bucket
    });

    const websitePrefix = 'website';

    new StaticWebsite(this, 'StaticWebsite', {
      bucket: this.bucket,
      hostedZone: props.hostedZone,
      domainName: props.domainName,
      defaultOriginPath: `/${websitePrefix}`,
      sourceConfigs: [
        {
          behaviors: [
            {
              pathPattern: `${this.packagesObjectPrefix}*`,
              allowedMethods: cf.CloudFrontAllowedMethods.GET_HEAD_OPTIONS,
              compress: true
            },
            {
              pathPattern: `${this.indexObjectPrefix}*`,
              allowedMethods: cf.CloudFrontAllowedMethods.GET_HEAD_OPTIONS,
              compress: true
            }
          ]
        }
      ]
    });

    new s3deploy.BucketDeployment(this, 'DeployWebsite', {
      destinationBucket: this.bucket,
      destinationKeyPrefix: websitePrefix,
      sources: [ s3deploy.Source.asset(distDir) ],
    });
  }
}

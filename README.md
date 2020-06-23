# CDK Construct Catalog

[![Actions Status](https://github.com/construct-catalog/catalog/workflows/Deploy/badge.svg)](https://github.com/construct-catalog/catalog/actions)

The **CDK Construct Catalog** (https://awscdk.io) is an index of multi-language AWS CDK libraries.

> This is a community project and is not officially supported by AWS.

The service watches [npmjs](npmjs.com) and every time it discovers a new npm [jsii module](https://github.com/aws/jsii) with the keyword `cdk`, it will automatically render a reference documentation web page for it and tweet about it through the [@awscdkio](https://twitter.com/awscdkio) handle. For example, see the page for [cdk-secrets@0.4.1](https://awscdk.io/packages/cdk-secrets@0.4.1) and it's corresponding [tweet](https://twitter.com/awscdkio/status/1211268176274694145).

## Searching for modules

At the moment, you can simply use Twitter to search the catalog. Simply include the term "**@awscdkio**" in your Twitter search query. For example, here are the [results](https://twitter.com/search?q=%40awscdkio%20dynamodb) for the query "**@awscdkio dynamodb**".

## Publishing modules

It is recommended to read the post [Writing Constructs](https://www.matthewbonig.com/2020/01/11/creating-constructs) by Matthew Bonig. It includes instructions and an end-to-end sample, and also discuss publishing to @awscdkio.

We also recommend using [projen](https://github.com/eladb/projen) to manage your project configuration. It has built-in jsii support.

The Construct Catalog will automatically discover jsii multi-language modules published to npm with the `cdk` keyword:

1. Follow the instructions in [jsii/README](https://github.com/aws/jsii) on how to create a jsii module.

2. Make sure your `package.json` file includes at least the keyword `cdk`.

3. Additional configuration options can be specified through the `awscdkio` section in your `package.json` file:

    - `twitter` (string): a Twitter handle (with or without the '@'). This handle will be
      "@mentioned" when the catalog tweets about new versions (see this
      [package.json](https://github.com/eladb/cdk-watchful/blob/master/package.json#L5)
      as an example).
    - `announce` (boolean): indicates if a tweet should be posted when new versions of this module are published (default is `true`).

4. Publish your module to all package managers. Here are some recommended tools:
   - [projen](https://github.com/eladb/projen)
   - [jsii publish GitHub Action](https://github.com/marketplace/actions/jsii-publish) by [udondan](https://github.com/udondan)
   - [jsii-release](https://github.com/eladb/jsii-release)
   - [aws-delivlib](https://github.com/awslabs/aws-delivlib) used by the AWS CDK

5. If your module is not picked up by [@awscdkio](https://twitter.com/awscdkio) within ~10 minutes, see the troubleshooting section below.

`package.json` configuration:

```js
{
  "jsii": { ... }          // jsii config (required)
  "keywords": [ "cdk" ],   // required
  "awscdkio": {            // all optional
    "twitter": "@account", // @mention in announcement
    "announce": true       // this is the default
  }
}
```

Here are some examples for modules: [cdk-secrets](https://github.com/udondan/cdk-secrets), [cdk-watchful](https://github.com/eladb/cdk-watchful), [cdk-dynamo-table-viewer](https://github.com/eladb/cdk-dynamo-table-viewer).

**Troubleshooting**

For some reason, my module doesn't get picked up by @awscdkio. Here are some common issues:

- Make sure your module has the `cdk` keyword in `package.json`
- Make sure your npm tarball contains the `.jsii` metadata file (`npm install` and check if `node_modules/MODULE/.jsii` exists).
- Make sure your module's latest version appears in `npm search MODULE`.
- If all else fails, raise an [issue](https://github.com/construct-catalog/catalog/issues/new). It could very well be a bug in the catalog.

## Contributing to this project

This is the source code repository for the Construct Catalog (https://awscdk.io). **Contributions are more than welcome!**

This repo includes multiple packages:

- [cdk-docden](./packages/cdk-docgen/README.md) - generates a static website from an npm/jsii module.
- [catalog](./packages/catalog/README.md) - the construct catalog CDK application.

Check out our [issue list](https://github.com/construct-catalog/catalog/issues) for ideas for contributions.

### Development Environment

#### Getting started

1. Clone the project and `cd` into its root directory.
2. `npx lerna bootstrap`: installs and links dependencies
3. `npx lerna run build`: builds all modules in topological order

#### Building the catalog

1. Follow the **Getting started** instructions.
2. `cd ./packages/catalog`
3. `cdk bootstrap aws://<your-account-number>/<region>`
    - e.g. `aws://012345678910/us-east-1/`
4. `cdk deploy construct-catalog-dev-$USER`
5. Determine the CloudFront Distribution **Domain Name** for your CDK Construct Catalog deployment (e.g. `dxxxxxxxxxxxxx.cloudfront.net`), which can be found in your list of [Cloudfront Distributions](https://console.aws.amazon.com/cloudfront/home). Look for the one with an **Origin** value beginning with `construct-catalog-dev`.
    * If you have the AWS CLI installed, you can find the **Domain Name** by running this command:
      ```bash
      aws cloudfront list-distributions \
          --query "DistributionList.Items[].{DomainName: DomainName, Origin: Origins.Items[].DomainName | [0]}
                   [?starts_with(Origin, 'construct-catalog-dev')].DomainName" \
          --output text
      ```
6. Find the [S3 Bucket](https://s3.console.aws.amazon.com/s3/home) that CDK created for the Construct Catalog (e.g. `construct-catalog-dev-xxxxx-websitebucketxxxxxxxx-xxxxxxxxxxxx`) and append one of the package paths to the **DomainName** from the previous step to test that the catalog deployed correctly (e.g. `http://dxxxxxxxxxxxxx.cloudfront.net/packages/cdk-secrets@0.4.1`).

**NOTE:** At this time, the bare `http://dxxxxxxxxxxxxx.cloudfront.net` URL redirects to the **@awscdkio** Twitter account page.

#### Building the frontend

1. Follow the **Getting started** instructions.
2. `cd ./packages/catalog-frontend`
3. `yarn install`
4. `yarn start`
5. Visit [http://localhost:3000/](http://localhost:3000/) in your browser.
6. To build and preview the site as it would look in Production, do the following:
    * `yarn build`
    * `npx serve build`.
    * Visit [http://localhost:5000](http://localhost:5000/) in your browser (note the different port number).

#### Troubleshooting

**`Unable to determine default account and/or region` when running `cdk` commands**

You don't have default AWS credentials and a default region configured for your AWS CLI. If you're using multiple profiles, you can add `--profile <profile-name>` (e.g. `--profile dev`) to the `cdk` commands for it to take effect. If you're still getting the same error, check to ensure a default region is configured for that profile in your `~/.aws/config` file, or `export` the desired region (e.g. `export AWS_DEFAULT_REGION=us-east-1`) before trying the `cdk` command again.

## License

This project is licensed under [Apache 2.0](./LICENSE)

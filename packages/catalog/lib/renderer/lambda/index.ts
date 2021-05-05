import docgen = require('cdk-docgen');
import path = require('path');
import fs = require('fs-extra');
import cp = require('child_process');
import { SQSEvent } from 'aws-lambda';
import { promisify } from 'util';
import { env, extractPackageStream, toDynamoItem } from './lambda-util';
import ids = require('./ids');
import http = require('http');
import https = require('https');
import aws = require('aws-sdk');

const s3client = require('s3');
const s3 = new aws.S3();
const dynamodb = new aws.DynamoDB();

// improve performance of s3 upload
// from "Tips" under https://www.npmjs.com/package/s3
http.globalAgent.maxSockets = https.globalAgent.maxSockets = 20;

const BUCKET_NAME = env(ids.Environment.BUCKET_NAME);
const BASE_URL = env(ids.Environment.BASE_URL);
const OBJECT_PREFIX = env(ids.Environment.OBJECT_PREFIX);
const METADATA_FILENAME = env(ids.Environment.METADATA_FILENAME);
const JSII_ASSEMBLY_FILENAME = env(ids.Environment.JSII_ASSEMBLY_FILENAME);
const TABLE_NAME = env(ids.Environment.TABLE_NAME);

const exec = promisify(cp.exec);

export async function handler(event: SQSEvent) {
  console.log(JSON.stringify(event, undefined, 2));

  for (const record of extractPackageStream(event)) {
    const { name, version } = record;
    console.log({ name, version });

    await withTempDirectory(async workdir => {

      await npmInstall(`${name}@${version}`, { cwd: workdir });

      // if @aws-cdk/core is not installed, install it manually
      if (!(await fs.pathExists(path.join(workdir, 'node_modules', '@aws-cdk', 'core')))) {
        console.log(`@aws-cdk/core module does not exist, installing manually (e.g. cdk-constants)`);
        await npmInstall(`@aws-cdk/core`, { cwd: workdir });
      }

      const modulesDirectory = path.join(workdir, 'node_modules');
      const files = await fs.readdir(modulesDirectory);
      console.log('node_modules:', files.join(','));

      await withTempDirectory(async outdir => {

        const moduleDir = path.join(modulesDirectory, name);
        const jsiiAssembly = path.join(moduleDir, '.jsii');

        // check if the module is a .jsii module. skip otherwise
        if (!await fs.pathExists(jsiiAssembly)) {
          console.log(`Skipping non-jsii module ${name}@${version}`);
          return;
        }

        // store package.json
        const packageJson = JSON.parse(await fs.readFile(path.join(moduleDir, 'package.json'), 'utf-8'));

        try {
          await docgen.renderDocs({
            modulesDirectory,
            outdir
          });
        } catch (e) {
          console.log(`ERROR: unable to render docs for module ${name}@${version}: ${e.stack}`);
          return;
        }

        // upload to s3
        const sourceDir = path.join(outdir, name);
        const objectKeyPrefix = path.join(OBJECT_PREFIX, `${name}@${version}/`);
        console.log({ upload: { source: sourceDir, dest: `${BUCKET_NAME}/${objectKeyPrefix}` }});
        await uploadDir(sourceDir, BUCKET_NAME, objectKeyPrefix);

        const metadataObjectKey = `${objectKeyPrefix}${METADATA_FILENAME}`;
        const assemblyObjectKey = `${objectKeyPrefix}${JSII_ASSEMBLY_FILENAME}`;
        const putMetadataObject: aws.S3.PutObjectRequest = {
          Bucket: BUCKET_NAME,
          Key: metadataObjectKey,
          Body: JSON.stringify(record.metadata),
        };
        const putAssemblyObject: aws.S3.PutObjectRequest = {
          Bucket: BUCKET_NAME,
          Key: assemblyObjectKey,
          Body: await fs.readFile(jsiiAssembly, { encoding: 'utf8' }),
        };
        await s3.putObject(putMetadataObject).promise();
        await s3.putObject(putAssemblyObject).promise();

        await dynamodb.putItem({
          TableName: TABLE_NAME,
          Item: toDynamoItem({
            ...record,
            json: packageJson,
            url: `${BASE_URL}/${objectKeyPrefix}`
          })
        }).promise();
      });
    });
  }
}

async function withTempDirectory(block: (dir: string) => Promise<void>) {
  const dir = await fs.mkdtemp(path.join('/tmp', 'renderer-'));
  console.log(`temp dir: ${dir}`);
  try {
    await block(dir);
  } finally {
    console.log(`cleaning up: ${dir}`);
    fs.remove(dir);
  }
}

async function uploadDir(local: string, bucketName: string, objectKeyPrefix: string) {
  const client = s3client.createClient();
  const uploader = client.uploadDir({
    localDir: local,
    s3Params: {
      Bucket: bucketName,
      Prefix: objectKeyPrefix
    }
  });

  return new Promise((ok, fail) => {
    uploader.once('end', ok);
    uploader.once('error', fail);
  });
}

async function npmInstall(module: string, options: { cwd: string }) {
  await exec(`npm install --ignore-scripts ${module}`, {
    cwd: options.cwd,
    env: {
      ...process.env,
      HOME: options.cwd
    }
  });
}

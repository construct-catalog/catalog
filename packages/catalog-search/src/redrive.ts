import { Construct } from 'constructs';
import * as kplus from 'cdk8s-plus-17';

/**
 * Enqueues all module notifications (package + version) to the search SQS queue
 * so it can redrive the index.
 */
export class Redrive extends Construct {
  constructor(scope: Construct, id: string) {
    super(scope, id);

    const awsResources = kplus.ConfigMap.fromConfigMapName('aws-resources');

    const entrypointPath = '/var/app';
    const entrypointFile = 'entrypoint.sh';

    const container = new kplus.Container({
      image: 'node',
      command: [ '/bin/sh', `${entrypointPath}/${entrypointFile}` ],
      workingDir: entrypointPath,
      env: {
        AWS_REGION: kplus.EnvValue.fromValue('us-east-1'),
        TABLE_NAME: kplus.EnvValue.fromConfigMap(awsResources, 'tableName'),
        QUEUE_URL: kplus.EnvValue.fromConfigMap(awsResources, 'queueUrl'),
      },
    });

    const app = new kplus.ConfigMap(this, 'app');
    app.addDirectory(`${__dirname}/redrive-app`, {
      exclude: [ '*.ts' ],
    });

    const entrypointVolume = kplus.Volume.fromConfigMap(app);

    container.mount(entrypointPath, entrypointVolume);

    new kplus.Job(this, 'redrive', {
      spec: {
        ttlAfterFinished: kplus.Duration.seconds(5), // delete job after finished
        podSpecTemplate: {
          volumes: [ entrypointVolume ],
          serviceAccount: kplus.ServiceAccount.fromServiceAccountName('search'),
          containers: [ container ],
        },
      },
    });
  }
}
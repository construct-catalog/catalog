import { Construct } from 'constructs';
import * as kplus from 'cdk8s-plus-17';
import { Chart } from 'cdk8s';
import { Dashboard } from '../dashboard';
import { Elasticsearch } from '../elasticsearch';
import { Kibana } from '../kibana';
import { Indexer } from '../indexer';

export class SearchOnKind extends Chart {
  constructor(scope: Construct, name: string) {
    super(scope, name);

    // in dev we need to create the aws-resources config map.
    // in production this config map already exists in the cluster by the deployment of the catalog itself.
    const awsResourcesConfig = new kplus.ConfigMap(this, 'ConfigMap', {
      metadata: {
        name: 'aws-resources',
      },
      data: {
        queueUrl: kplus.EnvValue.fromProcess('QUEUE_URL', {required: true}).value,
      },
    })

    // we also need to create a secret for aws creds.
    // in production this comes automatically from an existing service account which is also created
    // by the deployment of the catalog.
    const awsCredsSecret = new kplus.Secret(this, 'Secret', {})

    awsCredsSecret.addStringData('AWS_ACCESS_KEY_ID', process.env.AWS_ACCESS_KEY_ID!);
    awsCredsSecret.addStringData('AWS_SECRET_ACCESS_KEY', process.env.AWS_SECRET_ACCESS_KEY!);
    awsCredsSecret.addStringData('AWS_SESSION_TOKEN', process.env.AWS_SESSION_TOKEN!);

    // lets add a dashboard to our dev environment.
    new Dashboard(this, 'Dashboard');

    const elasticsearch = new Elasticsearch(this, 'Elasticsearch');

    new Kibana(this, 'Kibana', { elasticsearch: elasticsearch })

    new Indexer(this, 'Indexer', {
      elasticsearch: elasticsearch,
      awsResourcesConfig: awsResourcesConfig,
      awsCredsSecret: awsCredsSecret,
    })

  }
}


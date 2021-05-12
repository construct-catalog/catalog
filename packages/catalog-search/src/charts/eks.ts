import { Construct } from 'constructs';
import * as cdk8s from 'cdk8s';
import { Kibana } from '../kibana';
import { Elasticsearch } from '../elasticsearch';
import { Indexer } from '../indexer';
import * as kplus from 'cdk8s-plus-17';


export class SearchOnEKS extends cdk8s.Chart {
  constructor(scope: Construct, name: string) {
    super(scope, name);

    const elasticsearch = new Elasticsearch(this, 'Elasticsearch');

    new Kibana(this, 'Kibana', { elasticsearch: elasticsearch })

    new Indexer(this, 'Indexer', {
      elasticsearch: elasticsearch,
      awsResourcesConfig: kplus.ConfigMap.fromConfigMapName('aws-resources'),
      awsServiceAccount: kplus.ServiceAccount.fromServiceAccountName('search'),
    });


  }
}

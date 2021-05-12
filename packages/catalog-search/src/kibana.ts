import { Construct } from 'constructs';
import * as eck from './imports/kibana.k8s.elastic.co/kibana';
import { Elasticsearch } from './elasticsearch';

export interface KibanaProps {

  readonly elasticsearch: Elasticsearch;
}

export class Kibana extends Construct {
  constructor(scope: Construct, id: string, props: KibanaProps) {
    super(scope, id);

    new eck.Kibana(this, 'Kibana', {
      metadata: {
        name: 'kibana',
      },
      spec: {
        version: '7.7.1',
        count: 1,
        elasticsearchRef: {
          name: props.elasticsearch.name,
        },
      },
    })

  }
}
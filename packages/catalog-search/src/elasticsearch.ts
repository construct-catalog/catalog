import { Construct, Node } from 'constructs';
import * as cdk8s from 'cdk8s';
import * as eck from './imports/elasticsearch.k8s.elastic.co/elasticsearch';
import * as stdk8s from 'cdk8s-plus-17';


export class Elasticsearch extends Construct {

  private cr: eck.Elasticsearch;
  private readonly secret: stdk8s.ISecret;

  constructor(scope: Construct, id: string) {
    super(scope, id);

    const crd = new cdk8s.Include(this, 'ElasticsearchOperator', {
      url: 'https://download.elastic.co/downloads/eck/1.1.2/all-in-one.yaml',
    })

    this.cr = new eck.Elasticsearch(this, 'Elasticsearch', {
      metadata: {
        name: 'elasticsearch',
      },
      spec: {
        version: '7.7.1',
        http: {
          service: {
            spec: {
              ports: [
                {
                  port: 9200,
                },
              ],
            },
          },
          tls: {
            selfSignedCertificate: {
              disabled: true,
            },
          },
        },
        nodeSets: [
          {
            name: 'default',
            count: 1,
            config: {
              'node.master': true,
              'node.data': true,
              'node.ingest': true,
              'node.store.allow_mmap': false,
              'xpack.security.enabled': true,
              'xpack.security.http.ssl.enabled': false,
            },
          },
        ],
      },
    })

    this.secret = stdk8s.Secret.fromSecretName('elasticsearch-es-elastic-user');

    Node.of(this.cr).addDependency(crd);
  }

  public get name(): string {
    return this.cr.name;
  }

  public get username(): string {
    return 'elastic';
  }

  public get endpoint(): string {
    return 'http://elasticsearch-es-http:9200'
  }

  public get password(): stdk8s.EnvValue {
    return stdk8s.EnvValue.fromSecretValue({
      secret: this.secret,
      key: 'elastic',
    });
  }

}

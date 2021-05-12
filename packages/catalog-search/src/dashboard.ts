import { Construct, IConstruct, Node } from 'constructs';
import * as cdk8s from 'cdk8s';
import { AdminUser } from './admin-user';

export interface DashboardProps {
  readonly url?: string
}

export class Dashboard extends Construct {

  constructor(scope: Construct, name: string, props: DashboardProps = {}) {
    super(scope, name);

    const dashboard = new cdk8s.Include(this, 'Dashboard', {
      url: props.url ?? 'https://raw.githubusercontent.com/kubernetes/dashboard/v2.0.0/aio/deploy/recommended.yaml',
    })

    const namespace: cdk8s.ApiObject = Node.of(dashboard).children.filter((c: IConstruct) => (c as cdk8s.ApiObject).kind === 'Namespace')[0] as cdk8s.ApiObject;

    const adminUser = new AdminUser(this, 'AdminUser', { namespace: namespace.name })

    Node.of(adminUser).addDependency(dashboard);
  }
}

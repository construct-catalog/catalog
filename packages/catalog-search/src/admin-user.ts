import { Construct } from 'constructs';
import * as k8s from './imports/k8s';

export interface AdminUserProps {
  readonly namespace: string
}

export class AdminUser extends Construct {

  constructor(scope: Construct, name: string, props: AdminUserProps) {
    super(scope, name);

    const user = new k8s.ServiceAccount(this, 'AdminUser', {
      metadata: { namespace: props.namespace },
    });

    const role = new k8s.ClusterRole(this, 'ClusterRole', {
      rules: [
        {
          apiGroups: ['*'],
          resources: ['*'],
          verbs: ['*'],
        },
        {
          nonResourceURLs: ['*'],
          verbs: ['*'],
        },
      ],
    });

    new k8s.ClusterRoleBinding(this, 'AdminUserClusterRoleBinding', {
      roleRef: {
        apiGroup: 'rbac.authorization.k8s.io',
        kind: 'ClusterRole',
        name: role.name,
      },
      subjects: [
        {
          kind: 'ServiceAccount',
          name: user.name,
          namespace: props.namespace,
        },
      ],
    });

  }
}

const { TypeScriptProject } = require('projen');

const cdk8sVersion = '1.0.0-beta.11';

const project = new TypeScriptProject({
  name: 'catalog-search',
  description: 'Search application for the construct catalog',

  repository: 'https://github.com/construct-catalog/catalog.git',
  authorName: 'Eli Polonsky',
  authorEmail: 'epolon@amazon.com',

  commitPackageJson: true,

  mergify: false,
  private: true,

  defaultReleaseBranch: 'master',
  buildWorkflow: false,
  releaseWorkflow: false,

  devDeps: [
    '@types/node@^13.9.8',
    `cdk8s-cli@${cdk8sVersion}`,
  ],
  deps: [
    '@elastic/elasticsearch@^7.7.1',
    'aws-sdk@2.696.0',
    'constructs@^10.0.0',
    `cdk8s-plus-17@${cdk8sVersion}`,
    `cdk8s@${cdk8sVersion}`,
  ],
});

// Overrides
// no need to package'
project.addTask('build').exec(
  'yarn compile && yarn test', {
    description: 'Deletes then Creates a Cluster',
  },
);

project.addTask('synth').exec(
  'npm run compile && cdk8s synth', {
    description: 'Compiles & Synthesizes cdk8s.yml',
  },
);

/**
 * Kind
 */
project.addTask('kind:create').exec(
  'scripts/create-kind-cluster.sh', {
    description: 'Creates a Cluster',
  },
);

project.addTask('kind:delete').exec(
  'scripts/delete-kind-cluster.sh', {
    description: 'Deletes a Cluster',
  },
);

project.addTask('kind:recreate').exec(
  'npm run kind:delete && npm run kind:create', {
    description: 'Deletes then Creates a Cluster',
  },
);

project.addTask('kind:redeploy').exec(
  'npm run kind:recreate && npm run kind:connect && npm run kind:apply && npm run kube:wait', {
    description: 'Recreates, Connects, Applies & Waits',
  },
);

project.addTask('kind:connect').exec(
  'kubectl config use-context kind-kind', {
    description: 'Connects using the context kind-kind',
  },
);

project.addTask('kind:apply').exec(
  'npm run synth && npm run kind:connect && kubectl apply -f dist/catalogsearchkind.k8s.yaml', {
    description: 'Synthesizes, Connects and applies catalogsearchkind',
  },
);

/**
 * Eks
 */
project.addTask('eks:connect').exec(
  'kubectl config use-context arn:aws:eks:${AWS_REGION}:${AWS_ACCOUNT}:cluster/SearchKubernetes8BEC1CD3-fb8a111e81ac46d998c4d56666e588ba', {
    description: 'Switches kubectl to arn:::::cluster/SearchKubernetes8BEC1CD3-fb8a111e81ac46d998c4d56666e588ba',
  },
);

project.addTask('eks:apply').exec(
  'npm run synth && npm run eks:connect && kubectl apply -f dist/catalogsearcheks.k8s.yaml', {
    description: 'Synthesizes, switches to eks kubectl and applies',
  },
);

/**
 * Kubernetes-Dashboard
 */
project.addTask('kube:dashboard-token').exec(
  "kubectl -n kubernetes-dashboard describe secret $(kubectl -n kubernetes-dashboard get secret | grep adminuser | awk '{print $1}')", {
    description: 'Gets kubernetes dashboard admin token',
  },
);

project.addTask('kube:dashboard').exec(
  'npm run kube:dashboard-token && npm run kube:proxy', {
    description: 'Gets dashboard-token and runs kube proxy',
  },
);

/**
 * Elastic
 */
project.addTask('elastic:ping').exec(
  "curl -u \"elastic:$(kubectl get secret elasticsearch-es-elastic-user -o go-template='{{.data.elastic | base64decode}}')\" -k http://localhost:9200", {
    description: 'Gets the ES Elastic User Secret from localhost:9200 kubernetes manifest',
  },
);

project.addTask('kube:elastic-password').exec(
  "kubectl get secret elasticsearch-es-elastic-user -o go-template='{{.data.elastic | base64decode}}'", {
    description: 'Gets the ES Elastic User Secret from manifest',
  },
);

project.addTask('kube:elastic-logs').exec(
  "kubectl logs $(kubectl get -A pods | grep elasticsearch | awk '{print $2}')", {
    description: 'Shows the logs for ALL pods with a name *elasticsearch*',
  },
);

project.addTask('kube:elastic-forward').exec(
  'kubectl port-forward service/elasticsearch-es-http 9200', {
    description: 'Forwards 9200 to service/elasticsearch-es-http',
  },
);


/**
 * Kibana
 */
project.addTask('kube:elastic-forward').exec(
  'kubectl port-forward service/kibana-kb-http 5601', {
    description: 'Forwards 5601 to service-kibana-kb-http',
  },
);

/**
 * Kubernetes
 */
project.addTask('kube:wait').exec(
  'kubectl --all-namespaces --all=true wait --for=condition=Ready pod --timeout=5m', {
    description: 'Waits for ALL pods in ALL namespaces to be Ready or timeout at 5minutes ',
  },
);

project.addTask('kube:wait').exec(
  'kube:proxy": "kubectl proxy', {
    description: 'Runs kubectl proxy',
  },
);

project.synth();

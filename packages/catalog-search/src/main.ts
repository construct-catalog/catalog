import * as cdk8s from 'cdk8s';
import { SearchOnKind } from './charts/kind';
import { SearchOnEKS } from './charts/eks';

const app = new cdk8s.App();
new SearchOnEKS(app, 'catalog-search-eks');
new SearchOnKind(app, 'catalog-search-kind');
app.synth();

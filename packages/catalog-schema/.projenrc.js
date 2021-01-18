const { TypeScriptProject } = require('projen');

const project = new TypeScriptProject({
  name: 'catalog-schema',
  buildWorkflow: false,
  releaseWorkflow: false,
  private: true,
  mergify: false,
  dependabot: false,
  jest: false,
  sampleCode: false,
  rebuildBot: false,
  pullRequestTemplate: false,
  eslintOptions: {
    lintProjenRc: false
  }
});

project.synth();

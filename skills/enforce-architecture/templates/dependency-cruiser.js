/** @type {import('dependency-cruiser').IConfiguration} */

const apiLayerPaths = ['api', 'controller', 'resolver'];
const applicationLayerPaths = ['application', 'service'];
const infrastructureLayerPaths = ['infrastructure', 'infra', 'repository', 'database'];
const domainLayerPaths = ['domain', 'entity', 'value-object'];

module.exports = {
  forbidden: [
    {
      name: 'no-domain-to-api',
      comment: 'Domain layer cannot depend on api layer',
      severity: 'error',
      from: { path: domainLayerPaths },
      to: { path: apiLayerPaths },
    },
    {
      name: 'no-domain-to-app',
      comment: 'Domain layer cannot depend on application layer',
      severity: 'error',
      from: { path: domainLayerPaths },
      to: { path: applicationLayerPaths },
    },
    {
      name: 'no-domain-to-infra',
      comment: 'Domain layer cannot depend on infrastructure layer',
      severity: 'error',
      from: { path: domainLayerPaths },
      to: { path: infrastructureLayerPaths },
    },
    {
      name: 'no-infra-to-api',
      comment: 'Infrastructure layer cannot depend on api layer',
      severity: 'error',
      from: { path: infrastructureLayerPaths },
      to: { path: apiLayerPaths },
    },
    {
      name: 'no-command-query-to-api',
      comment: 'Commands and Queries cannot depend on api layer',
      severity: 'error',
      from: { path: ['query', 'command', 'handler'] },
      to: { path: apiLayerPaths },
    }
  ],
  options: {
    doNotFollow: { path: 'node_modules' },
    tsPreCompilationDeps: true,
    tsConfig: { fileName: 'tsconfig.json' }
  }
};

/** @type {import('dependency-cruiser').IConfiguration} */

// Generated from the settled design's enforcement map. Do not hand-edit rule
// intent here; update the design and regenerate instead.
module.exports = {
  forbidden: [
    {
      name: 'no-domain-to-infrastructure',
      comment: 'Domain code must not import concrete infrastructure. Seed: <seededViolation>',
      severity: 'error',
      from: { path: 'src/domain' },
      to: { path: 'src/infrastructure' }
    }
  ],
  options: {
    doNotFollow: { path: 'node_modules' },
    tsPreCompilationDeps: true,
    tsConfig: { fileName: 'tsconfig.json' }
  }
};

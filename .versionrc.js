module.exports = {
  types: [
    { type: 'feat', section: '✨ Features' },
    { type: 'fix', section: '🐛 Bug Fixes' },
    { type: 'perf', section: '⚡ Performance' },
    { type: 'refactor', section: '♻️ Code Refactoring' },
    { type: 'docs', section: '📚 Documentation' },
    { type: 'test', section: '🧪 Tests' },
    { type: 'build', section: '📦 Build System' },
    { type: 'ci', section: '👷 CI/CD' },
    { type: 'chore', section: '🔧 Maintenance' },
    { type: 'style', section: '🎨 Styles' },
    { type: 'revert', section: '⏪ Reverts' }
  ],
  releaseCommitMessageFormat: 'chore(release): {{currentTag}}',
  skip: {
    bump: false,
    changelog: false,
    commit: false,
    tag: false
  },
  bumpFiles: [
    {
      filename: 'package.json',
      type: 'json'
    }
  ],
  packageFiles: [
    {
      filename: 'package.json',
      type: 'json'
    }
  ],
  infile: 'CHANGELOG.md',
  header: '# Changelog\n\nAll notable changes to this project will be documented in this file.\n\nThe format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),\nand this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).\n\n',
  compareUrlFormat: '{{host}}/{{owner}}/{{repository}}/compare/{{previousTag}}...{{currentTag}}',
  commitUrlFormat: '{{host}}/{{owner}}/{{repository}}/commit/{{hash}}',
  issueUrlFormat: '{{host}}/{{owner}}/{{repository}}/issues/{{id}}',
  userUrlFormat: '{{host}}/{{user}}',
  releaseCommitMessageFormat: 'chore(release): {{currentTag}}',
  issuePrefixes: ['#'],
  scripts: {
    prerelease: 'npm test',
    postchangelog: 'npm run docs:update || true'
  }
}
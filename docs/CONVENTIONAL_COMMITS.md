# Conventional Commits & Release Workflow

This document explains how to use conventional commits for automatic version bumping, changelog generation, and npm publishing.

## 🚀 Quick Start

### Making a Commit
```bash
# Feature commit (minor version bump)
git commit -m "feat: add new temperature monitoring dashboard"

# Bug fix commit (patch version bump)  
git commit -m "fix: resolve connection timeout in mysql service"

# Breaking change commit (major version bump)
git commit -m "feat!: redesign API endpoints

BREAKING CHANGE: API endpoints now use v2 format"
```

### Creating a Release
```bash
# Interactive release (recommended)
./scripts/release.sh

# Specific release type
./scripts/release.sh --type minor

# Dry run to see what would happen
./scripts/release.sh --dry-run
```

## 📝 Commit Message Format

We follow the [Conventional Commits](https://conventionalcommits.org/) specification:

```
<type>[optional scope]: <description>

[optional body]

[optional footer(s)]
```

### Commit Types

| Type | Description | Version Bump |
|------|-------------|--------------|
| `feat` | New feature | Minor (1.1.0) |
| `fix` | Bug fix | Patch (1.0.1) |
| `perf` | Performance improvement | Patch (1.0.1) |
| `refactor` | Code refactoring | Patch (1.0.1) |
| `docs` | Documentation changes | None |
| `test` | Test changes | None |
| `build` | Build system changes | None |
| `ci` | CI/CD changes | None |
| `chore` | Maintenance tasks | None |
| `style` | Code style changes | None |
| `revert` | Revert previous commit | Patch (1.0.1) |

### Breaking Changes

To trigger a major version bump, use `!` after the type or add `BREAKING CHANGE:` in the footer:

```bash
# Method 1: Exclamation mark
git commit -m "feat!: remove deprecated API endpoints"

# Method 2: Footer
git commit -m "feat: update authentication system

BREAKING CHANGE: JWT tokens now expire after 1 hour instead of 24 hours"
```

### Examples

```bash
# Features (minor bump)
git commit -m "feat(api): add brewfather recipe import endpoint"
git commit -m "feat(sensors): support for new temperature probe model"

# Bug fixes (patch bump)
git commit -m "fix(mysql): handle connection timeouts gracefully"
git commit -m "fix(tests): resolve flaky timing test in publish.test.js"

# Performance improvements (patch bump)
git commit -m "perf(broker): optimize event subscription lookup"

# Documentation (no bump)
git commit -m "docs: update API documentation with new endpoints"

# Tests (no bump)  
git commit -m "test: add comprehensive unit tests for fan-service"

# Breaking changes (major bump)
git commit -m "feat!: migrate to new database schema"
```

## 🔄 Release Process

### Automatic Releases (GitHub Actions)

When you push to `main` branch:

1. **Tests run** automatically on Node.js 18, 20, and 22
2. **Commits are analyzed** for conventional commit patterns
3. **Version is bumped** automatically based on commit types:
   - `fix:` → Patch version (2.1.0 → 2.1.1)
   - `feat:` → Minor version (2.1.0 → 2.2.0)
   - `feat!:` or `BREAKING CHANGE:` → Major version (2.1.0 → 3.0.0)
4. **CHANGELOG.md is updated** with new entries
5. **Git tag is created** with the new version
6. **Package is published** to npm automatically

### Manual Releases

For more control, use the release script:

```bash
# Interactive mode (recommended)
./scripts/release.sh

# Specific release types
./scripts/release.sh --type patch   # 2.1.0 → 2.1.1
./scripts/release.sh --type minor   # 2.1.0 → 2.2.0  
./scripts/release.sh --type major   # 2.1.0 → 3.0.0

# Pre-release versions
./scripts/release.sh --type prerelease  # 2.1.0 → 2.1.1-0

# See what would happen without making changes
./scripts/release.sh --dry-run
```

### Release Script Features

- ✅ **Git status check** - Ensures clean working directory
- ✅ **Test execution** - Runs full test suite before release
- ✅ **Commit analysis** - Suggests appropriate version bump
- ✅ **Interactive mode** - Prompts for release type selection
- ✅ **Dry run support** - Preview changes without executing
- ✅ **Automatic changelog** - Updates CHANGELOG.md with new entries

## 📊 Changelog Generation

The changelog is automatically generated from conventional commits and includes:

- **Organized sections** by commit type (Features, Bug Fixes, etc.)
- **Emoji categories** for visual organization
- **Git links** to commits and comparisons
- **Breaking change highlights**
- **Contributor information**

Example changelog entry:
```markdown
## [2.3.0] - 2025-11-18

### ✨ Features
- **api**: add brewfather recipe import endpoint ([a1b2c3d](link))
- **sensors**: support for new temperature probe model ([e4f5g6h](link))

### 🐛 Bug Fixes  
- **mysql**: handle connection timeouts gracefully ([i7j8k9l](link))

### ⚠️ BREAKING CHANGES
- **auth**: JWT tokens now expire after 1 hour instead of 24 hours
```

## 🔧 Configuration Files

### `.versionrc.js`
Configures standard-version behavior:
- Commit types and changelog sections
- File bump configuration  
- Changelog format and templates
- Pre/post release scripts

### `commitlint.config.js`
Enforces conventional commit format:
- Allowed commit types
- Message format rules
- Character limits

### `.husky/` 
Git hooks for automation:
- **pre-commit**: Runs tests before commits
- **commit-msg**: Validates commit message format

## 🚨 Git Hooks

### Pre-commit Hook
- Runs `npm test` to ensure all tests pass
- Prevents commits if tests fail
- Can be bypassed with `--no-verify` if needed

### Commit Message Hook  
- Validates commit message against conventional format
- Provides helpful error messages for incorrect format
- Ensures consistency across all commits

## 📦 NPM Publishing

### Automatic Publishing
- Triggered by pushes to `main` branch
- Only publishes if version bump is detected
- Includes comprehensive testing before publish
- Uses GitHub Actions with NPM_TOKEN secret

### Manual Publishing
```bash
# After creating a release
npm run postrelease  # Pushes tags and publishes to npm

# Or step by step
git push --follow-tags origin main
npm publish
```

### Publishing Strategy
- **Patch versions** (bug fixes) → Automatic publish
- **Minor versions** (new features) → Automatic publish  
- **Major versions** (breaking changes) → Automatic publish
- **Pre-releases** → Manual publish only

## 🛠️ Setup for New Contributors

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Initialize husky** (if needed):
   ```bash
   npm run prepare
   ```

3. **Verify setup**:
   ```bash
   # This should fail with format error
   git commit -m "invalid commit message"
   
   # This should work  
   git commit -m "docs: add setup instructions"
   ```

## 🔍 Troubleshooting

### Commit Message Rejected
```
✖   subject may not be empty [subject-empty]
✖   type may not be empty [type-empty]
```
**Solution**: Use proper conventional commit format: `type: description`

### Tests Fail on Commit
```
Pre-commit hook failed
```
**Solution**: Fix failing tests or use `git commit --no-verify` to bypass (not recommended)

### Release Script Issues
```bash
# Check git status
git status

# Ensure you're on main/master branch
git checkout main

# Pull latest changes
git pull origin main
```

### NPM Publish Fails
- Verify NPM_TOKEN is set in GitHub repository secrets
- Check if version already exists on npm
- Ensure package.json version was updated correctly

## 📚 Resources

- [Conventional Commits Specification](https://conventionalcommits.org/)
- [Semantic Versioning](https://semver.org/)
- [Keep a Changelog](https://keepachangelog.com/)
- [standard-version Documentation](https://github.com/conventional-changelog/standard-version)
- [Commitlint Documentation](https://commitlint.js.org/)
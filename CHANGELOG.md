# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [2.2.0] - 2025-11-18

### ✨ Features
- Added comprehensive test suite with 245 passing tests across 22 test suites
- Implemented complete Brewfather controller testing (fermentables, hops, miscs)
- Added publish/subscribe messaging system validation
- Enhanced brewing algorithms and data processing coverage

### 🧪 Tests  
- Increased test coverage from 26.58% to 34.99% statements (+8.41%)
- Achieved 100% coverage on critical controller modules
- Fixed all failing tests and eliminated flaky timing-based tests
- Added comprehensive unit tests for temperature probes configuration
- Implemented reliable async testing with proper promise handling

### 🐛 Bug Fixes
- Fixed syntax error in brewdata.js (stray character removal)
- Fixed const reassignment issue in brewlog.js 
- Fixed missing imports in brewfather controller files
- Resolved timing test reliability issues in publish.test.js

### 📚 Documentation
- Updated README with accurate test statistics and coverage breakdown
- Added detailed testing achievements section
- Updated test structure documentation to reflect current 22 test files
- Added comprehensive coverage table showing module-by-module statistics

### 🔧 Maintenance
- Fixed code quality issues identified during testing
- Improved error handling in controller modules
- Enhanced logging functionality validation
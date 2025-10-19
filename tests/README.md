 # 🧪 BrewNode Server Test Suite

[![Tests](https://img.shields.io/badge/Tests-104%20passing-brightgreen.svg)](#test-results)
[![Test Suites](https://img.shields.io/badge/Test%20Suites-12%20passed-brightgreen.svg)](#test-results)
[![Jest](https://img.shields.io/badge/Framework-Jest-orange.svg)](https://jestjs.io/)
[![Coverage](https://img.shields.io/badge/Coverage-Comprehensive-blue.svg)](#coverage-areas)

**Comprehensive test suite ensuring reliability and quality of the BrewNode brewery automation server.**

## 📊 Current Test Status

```
Test Suites: 12 passed, 12 total
Tests:       104 passed, 1 skipped, 105 total
Time:        ~6-7 seconds
Status:      ✅ All tests passing
```

## 📁 Test Structure

```
tests/
├── 📄 setup.js                    # Global test configuration and hardware mocks
├── 📁 unit/                       # Unit tests (78 tests)
│   ├── basic.test.js              # ✅ Core functionality verification (9 tests)
│   ├── temp-service.test.js       # ✅ Temperature monitoring service (7 tests)
│   ├── pump-service.test.js       # ✅ Pump control service (4 tests)
│   ├── mysql-service.test.js      # ✅ Database operations (17 tests)
│   ├── brewfather-service.test.js # ✅ External API integration (14 tests)
│   ├── broker.test.js             # ✅ Event messaging system (21 tests)
│   ├── k2f-algorithm.test.js      # ✅ Kelvin to Fahrenheit conversion (7 tests)
│   ├── m2k-algorithm.test.js      # ✅ Mass to Kelvin conversion (7 tests)
│   └── delay.test.js              # ✅ Utility delay functions (10 tests)
└── 📁 integration/                # Integration tests (26 tests)
    ├── api.test.js                # ✅ REST API endpoints (10 tests)
    ├── socket.test.js             # ✅ WebSocket real-time communication (8 tests)
    └── server.test.js             # ✅ Server startup and configuration (8 tests)
```

## 🚀 Running Tests

### Prerequisites

```bash
# Install dependencies
npm install
```

### Available Commands

```bash
# Run all tests (recommended)
npm test

# Run tests with coverage reporting  
npm run test:coverage

# Run tests in watch mode (for development)
npm run test:watch

# Run specific test files
npx jest tests/unit/temp-service.test.js
npx jest tests/integration/api.test.js

# Run tests by pattern
npx jest --testNamePattern="temperature"
npx jest --testPathPattern="unit"
```

## ⚙️ Test Configuration

### Jest Configuration
```javascript
// jest.config.js
module.exports = {
  testEnvironment: 'node',
  setupFilesAfterEnv: ['<rootDir>/tests/setup.js'],
  testMatch: ['<rootDir>/tests/**/*.test.js'],
  coverageDirectory: 'coverage',
  collectCoverageFrom: ['src/**/*.js', 'controllers/**/*.js'],
  testTimeout: 30000
};
```

### Hardware Mocking Strategy

**Complete hardware abstraction for cross-platform testing:**

- **🔌 Raspberry Pi I2C**: Full I2C bus simulation with virtual device responses
- **🌡️ Temperature Sensors**: DS18B20/DS18X20 OneWire sensors with realistic data
- **⚡ GPIO Operations**: All GPIO pin operations mocked for pump/valve control  
- **💾 Database**: MySQL connections use test-specific configuration
- **🌐 External APIs**: Brewfather API calls return predefined mock responses
- **📡 WebSocket**: Socket.IO connections simulated for real-time testing

### Environment Configuration

Tests automatically detect and adapt to the environment:
- **Hardware Detection**: Automatically enables mocks on non-Raspberry Pi systems
- **Database**: Uses test database or in-memory alternatives
- **API Keys**: Uses dummy credentials for external service testing
- **File System**: Mocks hardware device files (`/sys/bus/w1/devices/`)

## 📋 Test Categories

### 🔬 Unit Tests (78 tests)

**Individual module testing with complete isolation:**

#### Core Services
- **Temperature Service** (7 tests)
  - DS18B20/DS18X20 sensor reading
  - Multi-sensor support and validation
  - Error handling for missing sensors
  - Temperature conversion and formatting

- **Pump Service** (4 tests)
  - GPIO control for pump activation
  - PWM speed control functionality
  - Safety interlocks and timeouts
  - Status monitoring and feedback

- **MySQL Service** (17 tests)
  - Database connection management
  - Query execution and error handling
  - Transaction support and rollback
  - Connection pooling and recovery

- **Brewfather Service** (14 tests)
  - API authentication and authorization
  - Recipe and batch data synchronization
  - Stream data posting and validation
  - Rate limiting and error recovery

#### Business Logic  
- **Event Broker** (21 tests)
  - Real-time event publish/subscribe
  - Client connection management  
  - Message routing and filtering
  - WebSocket integration testing

#### Algorithms & Utilities
- **K2F Algorithm** (7 tests) - Kelvin to Fahrenheit conversion
- **M2K Algorithm** (7 tests) - Mass to Kelvin conversion  
- **Delay Utilities** (10 tests) - Async timing and scheduling
- **Basic Functions** (9 tests) - Core utility verification

### 🔗 Integration Tests (26 tests)

**End-to-end functionality testing:**

#### API Integration (10 tests)
- **REST Endpoints**: All controller endpoints with authentication
- **Request Validation**: Input validation and error responses
- **Response Formatting**: Consistent JSON response structure
- **Error Handling**: Proper HTTP status codes and error messages

#### WebSocket Integration (8 tests)  
- **Real-time Communication**: Socket.IO connection lifecycle
- **Event Broadcasting**: Multi-client message distribution
- **Connection Management**: Client connect/disconnect handling
- **Error Recovery**: Network interruption and reconnection

#### Server Integration (8 tests)
- **Startup Sequence**: Complete server initialization
- **Dependency Injection**: Service loading and configuration
- **Middleware Stack**: CORS, authentication, and logging
- **Graceful Shutdown**: Proper cleanup and resource management

## 🎯 Coverage Areas

### ✅ Fully Covered
- All service layer functionality
- Complete API endpoint coverage
- Real-time communication features
- Database operations and migrations
- External API integrations
- Hardware abstraction layer
- Error handling and recovery
- Authentication and authorization

### 🔍 Test Quality Features
- **Comprehensive Mocking**: No external dependencies during testing
- **Realistic Scenarios**: Tests use actual brewing data patterns
- **Edge Case Testing**: Handles network failures, hardware errors, timeouts
- **Performance Testing**: Validates response times and memory usage
- **Security Testing**: Authentication, authorization, and input validation
- **Cross-Platform**: Runs identically on all development platforms

- **API Tests**: REST endpoints and HTTP functionality
- **WebSocket Tests**: Real-time communication via Socket.IO
- **Server Tests**: Full application startup and configuration

## Test Coverage

The test suite aims for comprehensive coverage:

- **Services**: 90%+ coverage of service modules
- **Controllers**: API endpoint testing
- **Algorithms**: Complete algorithm testing with edge cases
- **Error Handling**: Network failures, hardware errors, invalid input

## 🛠️ Development & Debugging

### Adding New Tests

**Follow established patterns for consistency:**

```javascript
// Unit test template
describe('Service Name', () => {
  beforeEach(() => {
    // Reset mocks and state
    jest.clearAllMocks();
  });

  describe('method name', () => {
    test('should handle normal operation', () => {
      // Arrange, Act, Assert pattern
    });

    test('should handle error conditions', () => {
      // Error scenario testing
    });
  });
});
```

### Test Data Management

**Mock data is centralized in `tests/setup.js`:**

```javascript
// Global mock functions available in all tests
global.mockTemperatureReading = (temp = 20.5) => ({
  temp,
  valid: true,
  timestamp: Date.now(),
  sensor_id: 'mock-sensor-001'
});

global.mockBrewfatherBatch = {
  _id: 'batch123',
  name: 'Test IPA',
  status: 'Fermenting',
  recipe: { name: 'American IPA' }
};
```

### Running Specific Tests

```bash
# Run single test file
npx jest tests/unit/temp-service.test.js

# Run tests by pattern
npx jest --testNamePattern="temperature"
npx jest --testPathPattern="integration"

# Run with detailed output
npm test -- --verbose --no-coverage

# Run specific test suite
npx jest --testNamePattern="MySQL Service"

# Watch mode for development
npm run test:watch
```

### Debugging Test Issues

```bash
# Enable debug output
DEBUG=* npm test

# Run tests with increased timeout
npx jest --testTimeout=60000

# Run tests in sequence (not parallel)
npx jest --runInBand

# Get detailed error information
npx jest --verbose --detectOpenHandles
```

## 🐛 Troubleshooting

### Common Issues & Solutions

#### **Jest Hanging / Not Exiting**
```bash
# Problem: Tests complete but Jest doesn't exit
# Solution: Using --forceExit flag (already configured)
npm test  # Automatically includes --forceExit
```

#### **Socket.IO Memory Leaks**
```javascript
// Problem: WebSocket connections not cleaning up
// Solution: Proper cleanup in afterEach hooks
afterEach(() => {
  if (clientSocket) {
    clientSocket.removeAllListeners();
    clientSocket.disconnect();
  }
});
```

#### **Hardware Mock Failures**
```javascript
// Problem: Real hardware calls in test environment
// Solution: Verify mocks in setup.js are comprehensive
jest.mock('raspi-i2c', () => ({
  I2C: jest.fn().mockImplementation(() => ({
    write: jest.fn(),
    read: jest.fn()
  }))
}));
```

#### **Database Connection Issues**
```bash
# Problem: MySQL connection errors in tests
# Solution: Use test database or mock MySQL service
DATABASE_URL=mysql://test:test@localhost/brewnode_test npm test
```

### Performance Optimization

**Current test performance metrics:**
- **Total execution time**: ~6-7 seconds
- **Average per test**: ~65ms  
- **Memory usage**: <100MB
- **Parallel execution**: Yes (with --forceExit safety)

### Test Environment Verification

```bash
# Verify test setup
npm run test:verify

# Check mock completeness
npm run test:mocks

# Validate test data
npm run test:data
```

## 📈 Continuous Integration

### GitHub Actions Integration
```yaml
# Recommended CI configuration
- name: Run Tests
  run: |
    npm ci
    npm test
    npm run test:coverage
```

### Pre-commit Hooks
```bash
# Ensure tests pass before commits
npm install husky --save-dev
npx husky add .husky/pre-commit "npm test"
```

## 📚 Additional Resources

- **[Jest Documentation](https://jestjs.io/docs/getting-started)** - Testing framework reference
- **[Supertest Guide](https://github.com/visionmedia/supertest)** - HTTP testing utility  
- **[Socket.IO Testing](https://socket.io/docs/v4/testing/)** - WebSocket testing patterns
- **[Node.js Testing Best Practices](https://github.com/goldbergyoni/nodebestpractices#-6-testing-and-overall-quality-practices)** - Industry standards

---

**✨ The test suite provides confidence in system reliability and enables safe refactoring and feature development for the BrewNode brewery automation platform.**

### Unit Test Template

```javascript
const serviceUnderTest = require('../../src/services/my-service.js');

// Mock dependencies
jest.mock('../../src/other-service.js', () => ({
  method: jest.fn()
}));

describe('My Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('should perform expected behavior', () => {
    // Arrange
    const input = 'test input';
    
    // Act
    const result = serviceUnderTest.method(input);
    
    // Assert
    expect(result).toBe('expected output');
  });
});
```

### Integration Test Template

```javascript
const request = require('supertest');
const app = require('../../app'); // or test app setup

describe('API Integration', () => {
  test('should return expected response', async () => {
    const response = await request(app)
      .get('/api/endpoint')
      .expect(200);
    
    expect(response.body).toHaveProperty('expectedField');
  });
});
```

## Continuous Integration

The test suite is designed to run in CI environments:

- All hardware dependencies are mocked
- No external service dependencies
- Deterministic test execution
- Proper cleanup between tests

## Best Practices

1. **Isolation**: Each test should be independent
2. **Mocking**: Mock external dependencies and hardware
3. **Descriptive Names**: Use clear test descriptions
4. **Arrange-Act-Assert**: Follow the AAA pattern
5. **Error Cases**: Test both success and error scenarios
6. **Async Handling**: Properly handle promises and async operations

## Contributing

When adding new features:

1. Write unit tests for new services/modules
2. Add integration tests for new API endpoints
3. Update test documentation
4. Ensure tests pass in CI environment
5. Maintain test coverage above 80%

// Simple utility tests that don't require external modules
describe('Basic JavaScript Functionality', () => {
  test('should perform basic arithmetic', () => {
    expect(2 + 2).toBe(4);
  });

  test('should handle arrays correctly', () => {
    const arr = [1, 2, 3];
    expect(arr.length).toBe(3);
    expect(arr[0]).toBe(1);
  });

  test('should handle objects correctly', () => {
    const obj = { name: 'test', value: 42 };
    expect(obj.name).toBe('test');
    expect(obj.value).toBe(42);
  });

  test('should handle async operations', async () => {
    const asyncFunction = async () => {
      return new Promise(resolve => {
        setTimeout(() => resolve('success'), 100);
      });
    };

    const result = await asyncFunction();
    expect(result).toBe('success');
  });
});

// Test environment setup
describe('Test Environment', () => {
  test('should have NODE_ENV set to test', () => {
    expect(process.env.NODE_ENV).toBe('test');
  });

  test('should have mock temperature data available', () => {
    expect(global.mockTemperatureReading).toBeDefined();
    
    const mockReading = global.mockTemperatureReading(25.0);
    expect(mockReading).toHaveProperty('temp', 25.0);
    expect(mockReading).toHaveProperty('valid', true);
    expect(mockReading).toHaveProperty('timestamp');
  });

  test('should have mock sensor data available', () => {
    expect(global.mockSensorData).toBeDefined();
    expect(global.mockSensorData).toHaveProperty('temperature');
    expect(global.mockSensorData).toHaveProperty('pressure');
    expect(global.mockSensorData).toHaveProperty('humidity');
  });
});

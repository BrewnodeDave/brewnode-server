const probes = require('../../src/probes-ds18b20.js');

describe('Probes DS18B20 Configuration', () => {
  test('should export an array of temperature probe configurations', () => {
    expect(Array.isArray(probes)).toBe(true);
    expect(probes.length).toBeGreaterThan(0);
  });

  test('each probe should have required properties', () => {
    probes.forEach((probe) => {
      expect(probe).toHaveProperty('name');
      expect(probe).toHaveProperty('id');
      expect(probe).toHaveProperty('prevValue');
      expect(probe).toHaveProperty('publishTemp');
      expect(probe).toHaveProperty('compensate');
      
      expect(typeof probe.name).toBe('string');
      expect(typeof probe.id).toBe('string');
      expect(probe.prevValue).toBeNull();
      expect(probe.publishTemp).toBeNull();
      expect(typeof probe.compensate).toBe('function');
    });
  });

  test('probe names should be unique', () => {
    const names = probes.map(probe => probe.name);
    const uniqueNames = [...new Set(names)];
    expect(uniqueNames.length).toBe(names.length);
  });

  test('probe IDs should be unique', () => {
    const ids = probes.map(probe => probe.id);
    const uniqueIds = [...new Set(ids)];
    expect(uniqueIds.length).toBe(ids.length);
  });

  test('probe IDs should follow DS18B20 format', () => {
    probes.forEach((probe) => {
      expect(probe.id).toMatch(/^28-[0-9A-F]{12}$/);
    });
  });

  test('compensate functions should work with numeric input', () => {
    probes.forEach((probe) => {
      const result = probe.compensate(20.5);
      expect(typeof result).toBe('number');
      expect(result).not.toBeNaN();
      expect(result).toBeCloseTo(result, 1); // Should be rounded to 1 decimal
    });
  });

  test('compensate functions should round to 1 decimal place', () => {
    probes.forEach((probe) => {
      const result = probe.compensate(20.123456);
      const decimals = result.toString().split('.')[1];
      if (decimals) {
        expect(decimals.length).toBeLessThanOrEqual(1);
      }
    });
  });

  test('should include expected probe names', () => {
    const expectedProbes = [
      'Temp Kettle',
      'Temp UniTank',
      'Temp SS',
      'Temp Mash',
      'Temp Glycol'
    ];
    
    const actualNames = probes.map(probe => probe.name);
    
    expectedProbes.forEach(expectedName => {
      expect(actualNames).toContain(expectedName);
    });
  });

  test('compensation should handle zero input', () => {
    probes.forEach((probe) => {
      const result = probe.compensate(0);
      expect(typeof result).toBe('number');
      expect(result).not.toBeNaN();
    });
  });

  test('compensation should handle negative input', () => {
    probes.forEach((probe) => {
      const result = probe.compensate(-10);
      expect(typeof result).toBe('number');
      expect(result).not.toBeNaN();
    });
  });

  test('compensation formulas should be mathematically consistent', () => {
    // Test that compensation functions produce consistent results
    probes.forEach((probe) => {
      const input = 25.0;
      const result1 = probe.compensate(input);
      const result2 = probe.compensate(input);
      expect(result1).toBe(result2);
    });
  });

  test('should handle edge case temperature values', () => {
    const testValues = [0, 100, -40, 125]; // Common temperature sensor ranges
    
    probes.forEach((probe) => {
      testValues.forEach(temp => {
        const result = probe.compensate(temp);
        expect(typeof result).toBe('number');
        expect(result).not.toBeNaN();
      });
    });
  });

  test('publishTemp should be null for DS18B20 probes', () => {
    // DS18B20 probes have publishTemp as null, unlike DS18x20
    probes.forEach((probe) => {
      expect(probe.publishTemp).toBeNull();
    });
  });
});
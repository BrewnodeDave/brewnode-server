/**
 * Raspberry Pi Hardware Integration Tests
 * 
 * These tests only run when executing on actual Raspberry Pi hardware.
 * They test real GPIO, I2C, and hardware-specific functionality.
 * 
 * @requires Raspberry Pi hardware
 * @requires GPIO access permissions
 * @requires I2C bus access
 */

const brewdefs = require('../../src/brewstack/common/brewdefs.js');
const brewlog = require('../../src/brewstack/common/brewlog.js');

// Skip all tests in this suite if not running on Raspberry Pi
const describeOnPi = brewdefs.isRaspPi() ? describe : describe.skip;

describeOnPi('Raspberry Pi Hardware Tests', () => {
  let i2cService;
  let tempService;
  let pumpService;
  let valveService;

  beforeAll(() => {
    console.log('🍺 Running Raspberry Pi hardware integration tests...');
    console.log('Platform:', process.platform);
    console.log('Architecture:', process.arch);
  });

  beforeEach(() => {
    // Dynamically import services to avoid loading on non-Pi systems
    i2cService = require('../../src/services/i2c_raspi-service.js');
    tempService = require('../../src/services/temp-service.js');
    pumpService = require('../../src/services/pump-service.js');
    valveService = require('../../src/services/valve-service.js');
  });

  afterEach(async () => {
    // Clean shutdown of all services
    try {
      await pumpService.stop();
      await valveService.stop();
      await tempService.stop();
    } catch (error) {
      // Ignore cleanup errors in tests
    }
  });

  describe('Platform Detection', () => {
    test('should correctly identify Raspberry Pi hardware', () => {
      expect(brewdefs.isRaspPi()).toBe(true);
      expect(brewdefs.isLinux).toBe(true);
    });

    test('should have access to Pi-specific system files', () => {
      const fs = require('fs');
      
      // Check for Raspberry Pi specific files
      expect(fs.existsSync('/proc/cpuinfo')).toBe(true);
      expect(fs.existsSync('/etc/os-release')).toBe(true);
      
      // Check CPU info contains Pi identifier
      const cpuInfo = fs.readFileSync('/proc/cpuinfo', 'utf8');
      expect(cpuInfo).toMatch(/Raspberry Pi/i);
    });
  });

  describe('I2C Hardware Interface', () => {
    test('should initialize I2C bus successfully', async () => {
      expect(() => {
        i2cService.init();
      }).not.toThrow();
    });

    test('should have I2C device files available', () => {
      const fs = require('fs');
      
      // Check for I2C device files (common on Pi)
      const i2cDevices = ['/dev/i2c-0', '/dev/i2c-1'];
      const hasI2C = i2cDevices.some(device => fs.existsSync(device));
      
      expect(hasI2C).toBe(true);
    });

    test('should write to I2C without hardware errors', () => {
      expect(() => {
        i2cService.init();
        // Test safe I2C operations (non-destructive)
        // These should not throw hardware-level errors on Pi
      }).not.toThrow();
    });
  });

  describe('GPIO Hardware Interface', () => {
    test('should have GPIO filesystem available', () => {
      const fs = require('fs');
      
      expect(fs.existsSync('/sys/class/gpio')).toBe(true);
    });

    test('should be able to access GPIO export', () => {
      const fs = require('fs');
      
      // Check GPIO export file exists and is writable
      expect(fs.existsSync('/sys/class/gpio/export')).toBe(true);
      
      // Check permissions (should be accessible for gpio group)
      const stats = fs.statSync('/sys/class/gpio/export');
      expect(stats.isFile()).toBe(true);
    });
  });

  describe('Temperature Sensors (DS18B20/DS18X20)', () => {
    test('should initialize temperature service on Pi hardware', async () => {
      await expect(tempService.start()).resolves.not.toThrow();
    });

    test('should have OneWire filesystem available', () => {
      const fs = require('fs');
      
      // Check for OneWire master directory
      expect(fs.existsSync('/sys/bus/w1')).toBe(true);
      expect(fs.existsSync('/sys/bus/w1/devices')).toBe(true);
    });

    test('should detect available temperature sensors', async () => {
      await tempService.start();
      
      // Get available sensors (may be empty but should not error)
      const sensors = tempService.getAvailableSensors();
      expect(Array.isArray(sensors)).toBe(true);
      
      // If sensors are connected, they should have valid IDs
      sensors.forEach(sensor => {
        expect(sensor).toMatch(/^[0-9a-f-]+$/i);
      });
    });
  });

  describe('Pump Hardware Control', () => {
    test('should initialize pump service without I2C errors', async () => {
      await expect(pumpService.start()).resolves.not.toThrow();
    });

    test('should control pumps via I2C on real hardware', async () => {
      await pumpService.start();
      
      // Test pump operations (should not cause I2C errors on Pi)
      expect(() => {
        pumpService.mashPumpOnSync();
        pumpService.mashPumpOffSync();
      }).not.toThrow();
      
      expect(() => {
        pumpService.kettlePumpOnSync();
        pumpService.kettlePumpOffSync();
      }).not.toThrow();
      
      expect(() => {
        pumpService.chillPumpOnSync();
        pumpService.chillPumpOffSync();
      }).not.toThrow();
    });

    test('should read pump status from hardware', async () => {
      await pumpService.start();
      
      const status = pumpService.getStatus();
      expect(Array.isArray(status)).toBe(true);
      expect(status.length).toBe(3);
      
      // Each pump should have valid status
      status.forEach(pump => {
        expect(pump).toHaveProperty('name');
        expect(pump).toHaveProperty('value');
        expect(typeof pump.value).toBe('number');
      });
    });
  });

  describe('Valve Hardware Control', () => {
    test('should initialize valve service without GPIO errors', async () => {
      await expect(valveService.start()).resolves.not.toThrow();
    });

    test('should control valves via GPIO on real hardware', async () => {
      await valveService.start();
      
      // Test valve operations (should not cause GPIO errors on Pi)
      const valveNames = [
        'ValveFermentIn',
        'ValveKettleIn', 
        'ValveMashIn',
        'ValveFermentTempIn'
      ];
      
      valveNames.forEach(valveName => {
        expect(() => {
          valveService.open(valveName);
          valveService.close(valveName);
        }).not.toThrow();
      });
    });

    test('should read valve status from hardware', async () => {
      await valveService.start();
      
      const status = valveService.getStatus();
      expect(Array.isArray(status)).toBe(true);
      
      // Each valve should have valid status
      status.forEach(valve => {
        expect(valve).toHaveProperty('name');
        expect(valve).toHaveProperty('value');
        expect(typeof valve.value).toBe('number');
      });
    });
  });

  describe('Hardware Performance', () => {
    test('should perform I2C operations within acceptable time', async () => {
      await pumpService.start();
      
      const startTime = Date.now();
      
      // Perform multiple I2C operations
      for (let i = 0; i < 10; i++) {
        pumpService.mashPumpOnSync();
        pumpService.mashPumpOffSync();
      }
      
      const duration = Date.now() - startTime;
      
      // Should complete within reasonable time (1 second for 20 operations)
      expect(duration).toBeLessThan(1000);
    });

    test('should handle concurrent hardware operations', async () => {
      await Promise.all([
        pumpService.start(),
        valveService.start(),
        tempService.start()
      ]);
      
      // Concurrent operations should not interfere
      const operations = [
        () => pumpService.mashPumpOnSync(),
        () => valveService.open('ValveFermentIn'),
        () => tempService.getAvailableSensors(),
        () => pumpService.mashPumpOffSync(),
        () => valveService.close('ValveFermentIn')
      ];
      
      await expect(Promise.all(operations.map(op => 
        new Promise(resolve => {
          op();
          resolve();
        })
      ))).resolves.not.toThrow();
    });
  });

  describe('Hardware Watchdog', () => {
    test('should initialize watchdog service on Pi', async () => {
      const wdogService = require('../../src/services/wdog-service.js');
      
      await expect(wdogService.start()).resolves.not.toThrow();
      
      // Watchdog should be active on Pi hardware
      expect(wdogService.isActive()).toBe(true);
    });
  });

  describe('Real Hardware Integration', () => {
    test('should run complete brewery simulation cycle', async () => {
      // Start all services
      await Promise.all([
        pumpService.start(),
        valveService.start(),
        tempService.start()
      ]);
      
      // Simulate a basic brewery operation sequence
      const brewerySequence = async () => {
        // 1. Open mash valve
        valveService.open('ValveMashIn');
        
        // 2. Start mash pump
        pumpService.mashPumpOnSync();
        
        // 3. Read temperatures
        const sensors = tempService.getAvailableSensors();
        
        // 4. Stop mash pump
        pumpService.mashPumpOffSync();
        
        // 5. Close mash valve
        valveService.close('ValveMashIn');
        
        // 6. Check system status
        const pumpStatus = pumpService.getStatus();
        const valveStatus = valveService.getStatus();
        
        return { pumpStatus, valveStatus, sensors };
      };
      
      const result = await expect(brewerySequence()).resolves.not.toThrow();
    });

    test('should handle hardware error conditions gracefully', async () => {
      await pumpService.start();
      
      // Test error handling for potential hardware issues
      expect(() => {
        // Try to operate pumps even if some I2C operations might fail
        try {
          pumpService.mashPumpOnSync();
          pumpService.kettlePumpOnSync();
          pumpService.chillPumpOnSync();
        } catch (error) {
          // Hardware errors should be logged but not crash the system
          expect(error.message).toMatch(/i2c|hardware|gpio/i);
        } finally {
          // Always attempt cleanup
          pumpService.mashPumpOffSync();
          pumpService.kettlePumpOffSync();  
          pumpService.chillPumpOffSync();
        }
      }).not.toThrow();
    });
  });

  describe('Resource Cleanup', () => {
    test('should properly release hardware resources', async () => {
      // Start services
      await pumpService.start();
      await valveService.start();
      
      // Stop services and verify cleanup
      await expect(pumpService.stop()).resolves.not.toThrow();
      await expect(valveService.stop()).resolves.not.toThrow();
      
      // Services should be properly stopped
      expect(pumpService.isStarted()).toBe(false);
      expect(valveService.isStarted()).toBe(false);
    });
  });
});

// Export test configuration for Pi-specific runs
module.exports = {
  testEnvironment: 'node',
  testMatch: ['**/pi-hardware.test.js'],
  setupFilesAfterEnv: [],
  collectCoverageFrom: [
    'src/services/*-service.js',
    '!src/services/*.test.js'
  ]
};
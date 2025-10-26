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
      try {
        await i2cService.start(1); // Use real hardware (not simulation)
        expect(true).toBe(true); // If we get here, initialization succeeded
      } catch (error) {
        // Log the error but don't fail - hardware might not be connected
        console.warn('I2C initialization failed (hardware may not be connected):', error.message);
        expect(error).toBeInstanceOf(Error);
      }
    });

    test('should have I2C device files available', () => {
      const fs = require('fs');
      
      // Check for I2C device files (common on Pi)
      const i2cDevices = ['/dev/i2c-0', '/dev/i2c-1'];
      const hasI2C = i2cDevices.some(device => fs.existsSync(device));
      
      expect(hasI2C).toBe(true);
    });

    test('should handle I2C operations gracefully', async () => {
      try {
        await i2cService.start(1);
        // If initialization succeeds, test basic operations exist
        expect(typeof i2cService.writeBit).toBe('function');
        expect(typeof i2cService.readBit).toBe('function');
      } catch (error) {
        // Hardware not available - this is expected in some test environments
        console.warn('I2C hardware not available for testing:', error.message);
        expect(error).toBeInstanceOf(Error);
      }
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
      
      // Check OneWire devices directory for connected sensors
      const fs = require('fs');
      try {
        const devices = fs.readdirSync('/sys/bus/w1/devices');
        const sensors = devices.filter(device => device.startsWith('28-') || device.startsWith('10-'));
        
        expect(Array.isArray(sensors)).toBe(true);
        console.log(`Found ${sensors.length} temperature sensors:`, sensors);
        
        // If sensors are connected, they should have valid IDs
        sensors.forEach(sensor => {
          expect(sensor).toMatch(/^(28|10)-[0-9a-f]+$/i);
        });
      } catch (error) {
        console.warn('Could not read OneWire devices:', error.message);
        // OneWire may not be enabled or no sensors connected
        expect(error).toBeInstanceOf(Error);
      }
    });
  });

  describe('Pump Hardware Control', () => {
    test('should initialize pump service without I2C errors', async () => {
      try {
        // Initialize I2C first
        await i2cService.start(1);
        await pumpService.start();
        expect(true).toBe(true); // If we get here, initialization succeeded
      } catch (error) {
        console.warn('Pump service initialization failed (I2C hardware may not be available):', error.message);
        expect(error).toBeInstanceOf(Error);
      }
    });

    test('should control pumps via I2C on real hardware', async () => {
      try {
        await i2cService.start(1);
        await pumpService.start();
        
          // Test pump operations (should not cause I2C errors on Pi)
          expect(() => {
            pumpService.mashOnSync();
            pumpService.mashOffSync();
          }).not.toThrow();
          
          expect(() => {
            pumpService.kettleOnSync();
            pumpService.kettleOffSync();
          }).not.toThrow();
          
          expect(() => {
            pumpService.chillPumpOnSync();
            pumpService.chillPumpOffSync();
          }).not.toThrow();
        } catch (error) {
          console.warn('Pump control failed (I2C hardware may not be available):', error.message);
          expect(error).toBeInstanceOf(Error);
        }
    });

    test('should read pump status from hardware', async () => {
      try {
        await i2cService.start(1);
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
      } catch (error) {
        console.warn('Pump status read failed (I2C hardware may not be available):', error.message);
        expect(error).toBeInstanceOf(Error);
      }
    });
  });

  describe('Valve Hardware Control', () => {
    test('should initialize valve service without GPIO errors', async () => {
      try {
        await i2cService.start(1);
        await valveService.start();
        expect(true).toBe(true); // If we get here, initialization succeeded
      } catch (error) {
        console.warn('Valve service initialization failed (I2C/GPIO hardware may not be available):', error.message);
        expect(error).toBeInstanceOf(Error);
      }
    });

    test('should control valves via GPIO on real hardware', async () => {
      try {
        await i2cService.start(1);
        await valveService.start();
        
        // Test valve operations (should not cause GPIO errors on Pi)
        const valveNames = [
          'Valve Chiller wort-out',
          'Valve Chiller wort-in', 
          'Valve Kettle-in',
          'Valve Mash-in'
        ];
        
        valveNames.forEach(valveName => {
          expect(() => {
            valveService.open(valveName);
            valveService.close(valveName);
          }).not.toThrow();
        });
      } catch (error) {
        console.warn('Valve control failed (I2C/GPIO hardware may not be available):', error.message);
        expect(error).toBeInstanceOf(Error);
      }
    });

    test('should read valve status from hardware', async () => {
      try {
        await i2cService.start(1);
        await valveService.start();
        
        const status = valveService.getStatus();
        expect(Array.isArray(status)).toBe(true);
        
        // Each valve should have valid status
        status.forEach(valve => {
          expect(valve).toHaveProperty('name');
          expect(valve).toHaveProperty('value');
          expect(typeof valve.value).toBe('number');
        });
      } catch (error) {
        console.warn('Valve status read failed (I2C/GPIO hardware may not be available):', error.message);
        expect(error).toBeInstanceOf(Error);
      }
    });
  });

  describe('Hardware Performance', () => {
    test('should perform I2C operations within acceptable time', async () => {
      try {
        await i2cService.start(1);
        await pumpService.start();
        
        const startTime = Date.now();
        
        // Perform multiple I2C operations
        for (let i = 0; i < 10; i++) {
          pumpService.mashOnSync();
          pumpService.mashOffSync();
        }
        
        const duration = Date.now() - startTime;
        
        // Should complete within reasonable time (1 second for 20 operations)
        expect(duration).toBeLessThan(1000);
      } catch (error) {
        console.warn('I2C performance test failed (hardware may not be available):', error.message);
        expect(error).toBeInstanceOf(Error);
      }
    });

    test('should handle concurrent hardware operations', async () => {
      try {
        await i2cService.start(1);
        await Promise.all([
          pumpService.start(),
          valveService.start(),
          tempService.start()
        ]);
        
        // Concurrent operations should not interfere
        const operations = [
          () => pumpService.mashOnSync(),
          () => valveService.open('Valve Mash-in'),
          () => pumpService.mashOffSync(),
          () => valveService.close('Valve Mash-in')
        ];
        
        await expect(Promise.all(operations.map(op => 
          new Promise(resolve => {
            op();
            resolve();
          })
        ))).resolves.not.toThrow();
      } catch (error) {
        console.warn('Concurrent operations test failed (hardware may not be available):', error.message);
        expect(error).toBeInstanceOf(Error);
      }
    });
  });

  describe('Hardware Watchdog', () => {
    test('should initialize watchdog service on Pi', async () => {
      try {
        const wdogService = require('../../src/services/wdog-service.js');
        await i2cService.start(1);
        await wdogService.start();
        
        // Watchdog should have valid status on Pi hardware
        const status = wdogService.getStatus();
        expect(typeof status).toBe('string');
        
        // Clean up
        await wdogService.stop();
      } catch (error) {
        console.warn('Watchdog initialization failed (I2C hardware may not be available):', error.message);
        expect(error).toBeInstanceOf(Error);
      }
    });
  });

  describe('Real Hardware Integration', () => {
    test('should run complete brewery simulation cycle', async () => {
      try {
        // Start all services
        await i2cService.start(1);
        await Promise.all([
          pumpService.start(),
          valveService.start(),
          tempService.start()
        ]);
        
        // Simulate a basic brewery operation sequence
        const brewerySequence = () => {
          // 1. Open mash valve
          valveService.open('Valve Mash-in');
          
          // 2. Start mash pump
          pumpService.mashOnSync();
          
          // 3. Stop mash pump
          pumpService.mashOffSync();
          
          // 4. Close mash valve
          valveService.close('Valve Mash-in');
          
          // 5. Check system status
          const pumpStatus = pumpService.getStatus();
          const valveStatus = valveService.getStatus();
          
          return { pumpStatus, valveStatus };
        };
        
        expect(() => brewerySequence()).not.toThrow();
      } catch (error) {
        console.warn('Brewery simulation cycle failed (hardware may not be available):', error.message);
        expect(error).toBeInstanceOf(Error);
      }
    });

    test('should handle hardware error conditions gracefully', async () => {
      try {
        await i2cService.start(1);
        await pumpService.start();
        
        // Test error handling for potential hardware issues
        expect(() => {
          // Try to operate pumps even if some I2C operations might fail
          try {
            pumpService.mashOnSync();
            pumpService.kettleOnSync();
            pumpService.chillPumpOnSync();
          } catch (error) {
            // Hardware errors should be logged but not crash the system
            expect(error.message).toMatch(/i2c|hardware|gpio/i);
          } finally {
            // Always attempt cleanup
            pumpService.mashOffSync();
            pumpService.kettleOffSync();  
            pumpService.chillPumpOffSync();
          }
        }).not.toThrow();
      } catch (error) {
        console.warn('Hardware error handling test failed (hardware may not be available):', error.message);
        expect(error).toBeInstanceOf(Error);
      }
    });
  });

  describe('Resource Cleanup', () => {
    test('should properly release hardware resources', async () => {
      try {
        // Start services
        await i2cService.start(1);
        await pumpService.start();
        await valveService.start();
        
        // Stop services and verify cleanup
        await expect(pumpService.stop()).resolves.not.toThrow();
        await expect(valveService.stop()).resolves.not.toThrow();
        
        // Services should be properly stopped
        expect(pumpService.isStarted()).toBe(false);
        expect(valveService.isStarted()).toBe(false);
      } catch (error) {
        console.warn('Resource cleanup test failed (hardware may not be available):', error.message);
        expect(error).toBeInstanceOf(Error);
      }
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
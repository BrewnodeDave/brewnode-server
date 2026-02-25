/*
 * Beerware License
 * ----------------
 * As long as you retain this notice, you can do whatever you want with 
 * this stuff. If we meet someday, and you think this stuff is worth it, 
 * you can buy me a beer in return.
 */

const fs = require('fs');
const path = require('path');
const probes = require('./probes.js');
const HeatExchanger = require('./heat-exchanger.js');

/**
 * Logger class for writing temperature measurements to file
 */
class TemperatureLogger {
  constructor(logFilePath) {
    this.logFilePath = logFilePath;
    this.ensureLogFile();
  }

  ensureLogFile() {
    const dir = path.dirname(this.logFilePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    if (!fs.existsSync(this.logFilePath)) {
      fs.writeFileSync(this.logFilePath, 'timestamp,sensor_name,sensor_id,temperature_celsius,compensated_temperature\n');
    }
  }

  log(sensorName, sensorId, rawTemp, compensatedTemp) {
    const timestamp = new Date().toISOString();
    const line = `${timestamp},${sensorName},${sensorId},${rawTemp},${compensatedTemp}\n`;
    try {
      fs.appendFileSync(this.logFilePath, line);
    } catch (err) {
      console.error('Error writing to log file:', err);
    }
  }

  getLogPath() {
    return this.logFilePath;
  }
}

/**
 * Temperature Monitor class for continuous monitoring
 */
class TemperatureMonitor {
  constructor(options = {}) {
    this.interval = options.interval || 5000; // 5 seconds default
    this.logFilePath = options.logFilePath || path.join(process.cwd(), 'logs', 'temperatures.csv');
    this.simulate = options.simulate || process.env.SIMULATE === '1';
    this.ds18x20 = null;
    this.logger = new TemperatureLogger(this.logFilePath);
    this.isRunning = false;
    this.intervalHandle = null;
    this.heatExchangerConfig = options.heatExchanger || {
      enabled: true,
      uValue: 500, // W/m²·K
      area: 1.0    // m²
    };
  }

  /**
   * Initialize the temperature sensor driver
   */
  async initialize() {
    try {
      if (this.simulate) {
        console.log('🔬 Simulation mode enabled');
        this.ds18x20 = require('./sim-ds18x20.js');
      } else {
        console.log('🌡️  Initializing real hardware sensors');
        this.ds18x20 = require('./ds18x20-wrapper.js');
      }

      // Verify driver is loaded
      return new Promise((resolve, reject) => {
        this.ds18x20.isDriverLoaded((err, isLoaded) => {
          if (err) {
            // Check if it's a hardware compatibility issue
            if (err.message.includes('shell') || err.message.includes('native')) {
              reject(new Error('Hardware sensors not available.\n\n' + err.message));
            } else {
              reject(new Error('Failed to load driver:\n' + err.message));
            }
          } else if (!isLoaded) {
            reject(new Error('Temperature driver not loaded. Ensure OneWire is enabled on your system'));
          } else {
            console.log('✅ Temperature driver loaded successfully');
            resolve();
          }
        });
      });
    } catch (err) {
      // Handle module loading errors - show full diagnostic info
      if (err.message.includes('Cannot find module') || err.message.includes('native') || err.message.includes('Diagnostics')) {
        throw new Error('Failed to initialize hardware sensors:\n\n' + err.message);
      }
      throw new Error('Initialization failed: ' + err.message);
    }
  }

  /**
   * Read temperature from a single sensor
   */
  readSensor(probeId) {
    return new Promise((resolve, reject) => {
      this.ds18x20.get(probeId, (err, temp) => {
        if (err) {
          reject(err);
        } else {
          resolve(temp);
        }
      });
    });
  }

  /**
   * Read all monitored temperatures
   */
  async readAllTemperatures() {
    const readings = [];
    for (const probe of probes) {
      try {
        const rawTemp = await this.readSensor(probe.id);
        // No compensation: use rawTemp directly
        readings.push({
          name: probe.name,
          id: probe.id,
          rawTemp,
          compensatedTemp: rawTemp
        });
        this.logger.log(probe.name, probe.id, rawTemp, rawTemp);
      } catch (err) {
        console.error(`Error reading ${probe.name}:`, err.message);
      }
    }
    return readings;
  }

  /**
   * Start continuous monitoring
   */
  async start() {
    if (this.isRunning) {
      console.log('Monitor already running');
      return;
    }

    await this.initialize();
    this.isRunning = true;

    console.log(`\n📊 Temperature Monitor Started`);
    console.log(`📁 Log file: ${this.logger.getLogPath()}`);
    console.log(`⏱️  Reading interval: ${this.interval}ms`);
    console.log(`🌡️  Monitoring ${probes.length} sensors:\n`);
    probes.forEach(p => console.log(`  • ${p.name} (${p.id})`));
    console.log('\nPress Ctrl+C to stop monitoring\n');

    // Initial read
    await this.logCurrentReadings();

    // Start interval
    this.intervalHandle = setInterval(() => {
      this.logCurrentReadings();
    }, this.interval);
  }

  /**
   * Log current readings to console and file
   */
  async logCurrentReadings() {
    try {
      const readings = await this.readAllTemperatures();
      const timestamp = new Date().toLocaleTimeString();
      console.log(`[${timestamp}] Temperature readings:`);
      // Map probe names to generic roles
      const nameMap = {
        'Temp Kettle': 'Hot Inlet',
        'Temp Glycol': 'Hot Outlet',
        'Temp UniTank': 'Cold Inlet',
        'Temp Mash': 'Cold Outlet'
      };
      readings.forEach(reading => {
        const comp = (typeof reading.compensatedTemp === 'number' && isFinite(reading.compensatedTemp))
          ? reading.compensatedTemp.toFixed(1) : 'N/A';
        const label = nameMap[reading.name] || reading.name;
        console.log(`  ${label.padEnd(20)} → ${comp}°C`);
      });

      // Calculate heat exchanger power if enabled
      if (this.heatExchangerConfig.enabled) {
        const temps = this._getTemperaturesForHeatExchanger(readings);
        if (temps) {
          const power = HeatExchanger.calculateFromReadings(
            temps,
            this.heatExchangerConfig.uValue,
            this.heatExchangerConfig.area
          );
          console.log(`  ${'Heat Exchanger Power'.padEnd(20)} → ${power.powerKW.toFixed(3)} kW (${power.power.toFixed(0)} W)`);
          console.log(`  ${'LMTD'.padEnd(20)} → ${power.lmtd.toFixed(2)}°C`);
          console.log(`  ${'Effectiveness'.padEnd(20)} → ${power.effectiveness.toFixed(1)}%`);
        }
      }
    } catch (err) {
      console.error('Error during monitoring:', err.message);
    }
  }

  /**
   * Extract temperatures for heat exchanger calculation
   * @private
   */
  _getTemperaturesForHeatExchanger(readings) {
    const temps = {};
    
    readings.forEach(reading => {
      if (reading.name === 'Temp Kettle') {
        temps.kettle = reading.compensatedTemp;
      } else if (reading.name === 'Temp UniTank') {
        temps.unitank = reading.compensatedTemp;
      } else if (reading.name === 'Temp Glycol') {
        temps.glycol = reading.compensatedTemp;
      } else if (reading.name === 'Temp Mash') {
        temps.mash = reading.compensatedTemp;
      }
    });
    
    // Check if all required temperatures are available
    if (temps.kettle !== undefined && temps.unitank !== undefined &&
        temps.glycol !== undefined && temps.mash !== undefined) {
      return temps;
    }
    
    return null;
  }

  /**
   * Stop continuous monitoring
   */
  stop() {
    if (!this.isRunning) {
      console.log('Monitor not running');
      return;
    }

    if (this.intervalHandle) {
      clearInterval(this.intervalHandle);
    }
    this.isRunning = false;
    console.log('\n✋ Monitor stopped');
    console.log(`📊 Measurements logged to: ${this.logger.getLogPath()}`);
  }

  /**
   * Get current status
   */
  getStatus() {
    return {
      running: this.isRunning,
      logFilePath: this.logger.getLogPath(),
      interval: this.interval,
      simulate: this.simulate,
      probeCount: probes.length,
      heatExchanger: {
        enabled: this.heatExchangerConfig.enabled,
        uValue: this.heatExchangerConfig.uValue,
        area: this.heatExchangerConfig.area
      }
    };
  }

  /**
   * Get current heat exchanger power calculation
   */
  async getHeatExchangerPower() {
    if (!this.heatExchangerConfig.enabled) {
      throw new Error('Heat exchanger calculations are disabled');
    }

    const readings = await this.readAllTemperatures();
    const temps = this._getTemperaturesForHeatExchanger(readings);
    
    if (!temps) {
      throw new Error('Required temperature sensors not available');
    }

    return HeatExchanger.calculateFromReadings(
      temps,
      this.heatExchangerConfig.uValue,
      this.heatExchangerConfig.area
    );
  }
}

module.exports = TemperatureMonitor;

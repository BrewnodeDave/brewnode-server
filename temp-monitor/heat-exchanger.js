/*
 * Beerware License
 * ----------------
 * As long as you retain this notice, you can do whatever you want with 
 * this stuff. If we meet someday, and you think this stuff is worth it, 
 * you can buy me a beer in return.
 */

/**
 * Heat Exchanger Calculator
 * 
 * Calculates heat transfer power for a counterflow heat exchanger using LMTD method
 * 
 * Configuration:
<<<<<<< HEAD
 *   Hot Side: Temp Kettle (inlet) → Temp Glycol (outlet)
 *   Cold Side: Temp UniTank (inlet) → Temp Mash (outlet)
=======
 *   Hot Side: Temp Kettle (inlet) → Temp Mash (outlet)
 *   Cold Side: Temp UniTank (inlet) → Temp Glycol (outlet)
>>>>>>> 5e1ac86a1b3d7ed44df7945d7dde40aa77a275f2
 */

class HeatExchangerCalculator {
  /**
   * Calculate LMTD (Log Mean Temperature Difference)
   * 
   * For counterflow heat exchanger:
   * ΔT1 = T_hot_in - T_cold_out
   * ΔT2 = T_hot_out - T_cold_in
   * LMTD = (ΔT1 - ΔT2) / ln(ΔT1/ΔT2)
   * 
   * @param {number} hotIn - Hot fluid inlet temperature (Temp Kettle)
<<<<<<< HEAD
   * @param {number} hotOut - Hot fluid outlet temperature (Temp Glycol)
   * @param {number} coldIn - Cold fluid inlet temperature (Temp UniTank)
   * @param {number} coldOut - Cold fluid outlet temperature (Temp Mash)
=======
   * @param {number} hotOut - Hot fluid outlet temperature (Temp Mash)
   * @param {number} coldIn - Cold fluid inlet temperature (Temp UniTank)
   * @param {number} coldOut - Cold fluid outlet temperature (Temp Glycol)
>>>>>>> 5e1ac86a1b3d7ed44df7945d7dde40aa77a275f2
   * @returns {number} LMTD in °C
   */
  static calculateLMTD(hotIn, hotOut, coldIn, coldOut) {
    // ΔT1 = T_hot_in - T_cold_out
    const deltaT1 = hotIn - coldOut;
    
    // ΔT2 = T_hot_out - T_cold_in
    const deltaT2 = hotOut - coldIn;
    
    // Handle edge cases
    if (deltaT1 <= 0 || deltaT2 <= 0) {
      console.warn('Warning: Invalid temperature difference (ΔT ≤ 0). Check sensor values.');
      return 0;
    }
    
    // If temperatures are equal, LMTD equals the temperature difference
    if (Math.abs(deltaT1 - deltaT2) < 0.01) {
      return deltaT1;
    }
    
    // LMTD = (ΔT1 - ΔT2) / ln(ΔT1/ΔT2)
    const lmtd = (deltaT1 - deltaT2) / Math.log(deltaT1 / deltaT2);
    
    return lmtd;
  }

  /**
   * Calculate heat transfer power
   * 
   * Q = U × A × LMTD
   * 
   * Where:
   *   Q = Heat transfer rate (W)
   *   U = Overall heat transfer coefficient (W/m²·K)
   *   A = Heat transfer area (m²)
   *   LMTD = Log mean temperature difference (K or °C)
   * 
   * @param {number} hotIn - Hot fluid inlet temperature (°C)
   * @param {number} hotOut - Hot fluid outlet temperature (°C)
   * @param {number} coldIn - Cold fluid inlet temperature (°C)
   * @param {number} coldOut - Cold fluid outlet temperature (°C)
   * @param {number} uValue - Overall heat transfer coefficient (W/m²·K), default: 500
   * @param {number} area - Heat transfer area (m²), default: 1.0
   * @returns {object} Heat transfer calculations
   */
  static calculatePower(hotIn, hotOut, coldIn, coldOut, uValue = 500, area = 1.0) {
    const lmtd = this.calculateLMTD(hotIn, hotOut, coldIn, coldOut);
    
    // Q = U × A × LMTD
    const power = uValue * area * lmtd; // Watts
    
    // Additional calculations
    const hotSideDelta = hotIn - hotOut;
    const coldSideDelta = coldOut - coldIn;
    
    // Effectiveness (assuming equal flow rates)
    const maxDelta = Math.max(hotIn - coldIn, 0.01);
    const effectiveness = Math.min(hotSideDelta, coldSideDelta) / maxDelta;
    
    return {
      lmtd: lmtd,
      power: power, // Watts
      powerKW: power / 1000, // Kilowatts
      powerBTUhr: power * 3.412142, // BTU/hr
      hotSideDelta: hotSideDelta,
      coldSideDelta: coldSideDelta,
      effectiveness: effectiveness * 100, // Percentage
      uValue: uValue,
      area: area
    };
  }

  /**
   * Calculate power from temperature readings object
   * 
   * @param {Object} temps - Temperature readings
   * @param {number} temps.kettle - Temp Kettle (hot inlet)
<<<<<<< HEAD
   * @param {number} temps.glycol - Temp Glycol (hot outlet)
   * @param {number} temps.unitank - Temp UniTank (cold inlet)
   * @param {number} temps.mash - Temp Mash (cold outlet)
=======
   * @param {number} temps.mash - Temp Mash (hot outlet)
   * @param {number} temps.unitank - Temp UniTank (cold inlet)
   * @param {number} temps.glycol - Temp Glycol (cold outlet)
>>>>>>> 5e1ac86a1b3d7ed44df7945d7dde40aa77a275f2
   * @param {number} uValue - Overall heat transfer coefficient (W/m²·K)
   * @param {number} area - Heat transfer area (m²)
   * @returns {object} Heat transfer calculations
   */
  static calculateFromReadings(temps, uValue = 500, area = 1.0) {
    return this.calculatePower(
      temps.kettle,
<<<<<<< HEAD
      temps.glycol,
      temps.unitank,
      temps.mash,
=======
      temps.mash,
      temps.unitank,
      temps.glycol,
>>>>>>> 5e1ac86a1b3d7ed44df7945d7dde40aa77a275f2
      uValue,
      area
    );
  }

  /**
   * Format power calculation results for display
   * 
   * @param {object} result - Result from calculatePower()
   * @returns {string} Formatted output
   */
  static formatResults(result) {
    let output = '';
    output += '╔════════════════════════════════════════════════════════════════╗\n';
    output += '║        Counterflow Heat Exchanger Performance                  ║\n';
    output += '╚════════════════════════════════════════════════════════════════╝\n\n';
    
    output += '📊 Temperature Differences:\n';
    output += `   Hot Side (Inlet → Outlet):  ${result.hotSideDelta.toFixed(2)}°C\n`;
    output += `   Cold Side (Inlet → Outlet): ${result.coldSideDelta.toFixed(2)}°C\n`;
    
    output += '🌡️  Heat Transfer Analysis:\n';
    output += `   LMTD:                         ${result.lmtd.toFixed(2)}°C\n`;
    output += `   U-Value:                      ${result.uValue} W/m²·K\n`;
    output += `   Area:                         ${result.area.toFixed(2)} m²\n\n`;
    
    output += '⚡ Heat Transfer Power:\n';
    output += `   Power:                        ${result.power.toFixed(0)} W\n`;
    output += `   Power:                        ${result.powerKW.toFixed(3)} kW\n`;
    output += `   Power:                        ${result.powerBTUhr.toFixed(0)} BTU/hr\n\n`;
    
    output += '📈 Performance:\n';
    output += `   Effectiveness:                ${result.effectiveness.toFixed(1)}%\n`;
    
    return output;
  }

  /**
   * Validate temperature readings
   * 
   * @param {object} temps - Temperature readings
   * @returns {object} Validation result
   */
  static validateReadings(temps) {
    const issues = [];
    
    // Check if hot inlet is hotter than hot outlet
<<<<<<< HEAD
    if (temps.kettle <= temps.glycol) {
      issues.push('Hot side: Inlet (Kettle) should be hotter than outlet (Glycol)');
    }
    
    // Check if cold outlet is warmer than cold inlet
    if (temps.mash <= temps.unitank) {
      issues.push('Cold side: Outlet (Mash) should be warmer than inlet (UniTank)');
=======
    if (temps.kettle <= temps.mash) {
      issues.push('Hot side: Inlet should be hotter than outlet');
    }
    
    // Check if cold outlet is warmer than cold inlet
    if (temps.glycol <= temps.unitank) {
      issues.push('Cold side: Outlet should be warmer than inlet');
>>>>>>> 5e1ac86a1b3d7ed44df7945d7dde40aa77a275f2
    }
    
    // Check for reasonable temperature ranges
    if (temps.kettle < -50 || temps.kettle > 150) {
      issues.push('Hot inlet temperature out of reasonable range');
    }
    
<<<<<<< HEAD
    if (temps.glycol < -50 || temps.glycol > 150) {
=======
    if (temps.mash < -50 || temps.mash > 150) {
>>>>>>> 5e1ac86a1b3d7ed44df7945d7dde40aa77a275f2
      issues.push('Hot outlet temperature out of reasonable range');
    }
    
    if (temps.unitank < -50 || temps.unitank > 50) {
      issues.push('Cold inlet temperature out of reasonable range');
    }
    
    if (temps.glycol < -50 || temps.glycol > 50) {
      issues.push('Cold outlet temperature out of reasonable range');
    }
    
    return {
      valid: issues.length === 0,
      issues: issues
    };
  }
}

// CLI usage
if (require.main === module) {
  const args = process.argv.slice(2);
  
  if (args.includes('--help') || args.includes('-h')) {
    console.log(`
Heat Exchanger Power Calculator

Calculates heat transfer power for counterflow heat exchanger using LMTD method.

Configuration:
  Hot Side:  Temp Kettle (inlet) → Temp Glycol (outlet)
  Cold Side: Temp UniTank (inlet) → Temp Mash (outlet)

Usage: node heat-exchanger.js [options]

Options:
  --kettle N      Hot inlet temperature (°C)
<<<<<<< HEAD
  --glycol N      Hot outlet temperature (°C)
  --unitank N     Cold inlet temperature (°C)
  --mash N        Cold outlet temperature (°C)
=======
  --mash N        Hot outlet temperature (°C)
  --unitank N     Cold inlet temperature (°C)
  --glycol N      Cold outlet temperature (°C)
>>>>>>> 5e1ac86a1b3d7ed44df7945d7dde40aa77a275f2
  --uvalue N      Overall heat transfer coefficient (W/m²·K), default: 500
  --area N        Heat transfer area (m²), default: 1.0
  --help, -h      Show this help

Examples:
  # Calculate with specific temperatures
<<<<<<< HEAD
  node heat-exchanger.js --kettle 80 --glycol 30 --unitank 5 --mash 25
  
  # Calculate with custom U-value and area
  node heat-exchanger.js --kettle 80 --glycol 30 --unitank 5 --mash 25 --uvalue 600 --area 1.5
=======
  node heat-exchanger.js --kettle 80 --mash 30 --unitank 5 --glycol 25
  
  # Calculate with custom U-value and area
  node heat-exchanger.js --kettle 80 --mash 30 --unitank 5 --glycol 25 --uvalue 600 --area 1.5
>>>>>>> 5e1ac86a1b3d7ed44df7945d7dde40aa77a275f2
    `);
    process.exit(0);
  }
  
  // Parse arguments
  let temps = { kettle: null, unitank: null, glycol: null, mash: null };
  let uValue = 500;
  let area = 1.0;
  
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--kettle' && args[i + 1]) {
      temps.kettle = parseFloat(args[i + 1]);
      i++;
    } else if (args[i] === '--unitank' && args[i + 1]) {
      temps.unitank = parseFloat(args[i + 1]);
      i++;
    } else if (args[i] === '--glycol' && args[i + 1]) {
      temps.glycol = parseFloat(args[i + 1]);
      i++;
    } else if (args[i] === '--mash' && args[i + 1]) {
      temps.mash = parseFloat(args[i + 1]);
      i++;
    } else if (args[i] === '--uvalue' && args[i + 1]) {
      uValue = parseFloat(args[i + 1]);
      i++;
    } else if (args[i] === '--area' && args[i + 1]) {
      area = parseFloat(args[i + 1]);
      i++;
    }
  }
  
  // Check if all temperatures provided
  if (temps.kettle === null || temps.unitank === null || 
      temps.glycol === null || temps.mash === null) {
    console.error('Error: All temperatures must be provided');
    console.log('Run with --help for usage information');
    process.exit(1);
  }
  
  // Validate readings
  const validation = HeatExchangerCalculator.validateReadings(temps);
  if (!validation.valid) {
    console.log('⚠️  Validation Warnings:');
    validation.issues.forEach(issue => console.log(`  • ${issue}`));
    console.log('');
  }
  
  // Calculate and display
  const result = HeatExchangerCalculator.calculateFromReadings(temps, uValue, area);
  console.log(HeatExchangerCalculator.formatResults(result));
}

module.exports = HeatExchangerCalculator;

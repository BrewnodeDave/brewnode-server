#!/usr/bin/env node

/*
 * Beerware License
 * ----------------
 * As long as you retain this notice, you can do whatever you want with 
 * this stuff. If we meet someday, and you think this stuff is worth it, 
 * you can buy me a beer in return.
 */

const fs = require('fs');
const path = require('path');
const HeatExchanger = require('./heat-exchanger.js');

/**
 * Simple CSV parser helper
 */
function parseCSVLine(line) {
  const result = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current.trim());
  return result;
}

/**
 * Graph Generator - Creates ASCII and HTML graphs of temperature data
 */
class TemperatureGraphGenerator {
  /**
   * Parse CSV file into array of records
   */
  static parseCSV(csvFilePath) {
    const content = fs.readFileSync(csvFilePath, 'utf-8');
    const lines = content.split('\n').filter(line => line.trim());
    
    if (lines.length < 2) return [];

    const headers = parseCSVLine(lines[0]);
    const records = [];
    
    for (let i = 1; i < lines.length; i++) {
      const values = parseCSVLine(lines[i]);
      const record = {};
      headers.forEach((header, idx) => {
        record[header] = values[idx] || '';
      });
      if (record.timestamp) {
        records.push(record);
      }
    }
    
    return records;
  }

  /**
   * Generate ASCII graph for terminal display
   */
  static generateASCIIGraph(csvFilePath, width = 80, height = 20) {
    if (!fs.existsSync(csvFilePath)) {
      throw new Error(`CSV file not found: ${csvFilePath}`);
    }

    const data = this.parseCSV(csvFilePath);
    if (data.length === 0) {
      return 'No data available';
    }

    // Group by sensor
    const sensorData = {};
    data.forEach(row => {
      if (!sensorData[row.sensor_name]) {
        sensorData[row.sensor_name] = [];
      }
      sensorData[row.sensor_name].push(parseFloat(row.compensated_temperature));
    });

    let graph = '';
    const sensors = Object.keys(sensorData);

    sensors.forEach((sensor) => {
      graph += `\n${'='.repeat(width)}\n`;
      graph += `Temperature: ${sensor}\n`;
      graph += `${'='.repeat(width)}\n`;
      graph += this._createSingleASCIIGraph(sensorData[sensor], width, height);
    });

    return graph;
  }

  /**
   * Create single ASCII graph
   */
  static _createSingleASCIIGraph(temps, width, height) {
    if (temps.length === 0) return '';

    const minTemp = Math.floor(Math.min(...temps));
    const maxTemp = Math.ceil(Math.max(...temps));
    const range = maxTemp - minTemp || 1;

    // Sample data if too many points
    let sampledTemps = temps;
    if (temps.length > width - 4) {
      const step = Math.ceil(temps.length / (width - 4));
      sampledTemps = [];
      for (let i = 0; i < temps.length; i += step) {
        sampledTemps.push(temps[i]);
      }
    }

    // Create grid
    const grid = Array(height).fill(null).map(() => Array(width).fill(' '));

    // Plot points
    sampledTemps.forEach((temp, x) => {
      if (x < width - 2) {
        const normalizedTemp = (temp - minTemp) / range;
        const y = Math.round((1 - normalizedTemp) * (height - 2));
        if (y >= 0 && y < height) {
          grid[y][x + 1] = '●';
        }
      }
    });

    // Add border and labels
    let graph = '';
    graph += `${maxTemp.toFixed(1).padStart(7)}°C ┌${'─'.repeat(width)}┐\n`;
    
    for (let y = 1; y < height - 1; y++) {
      graph += `       │${grid[y].join('')}│\n`;
    }
    
    graph += `${minTemp.toFixed(1).padStart(7)}°C └${'─'.repeat(width)}┘\n`;
    graph += `       Reading Progress →\n`;

    return graph;
  }

  /**
   * Generate HTML graph file
   */
  static generateHTMLGraph(csvFilePath, outputPath, options = {}) {
    if (!fs.existsSync(csvFilePath)) {
      throw new Error(`CSV file not found: ${csvFilePath}`);
    }

    const data = this.parseCSV(csvFilePath);
    if (data.length === 0) {
      throw new Error('No data available in CSV file');
    }

    // Default options
    const config = {
      includeHeatExchanger: options.includeHeatExchanger !== false,
      uValue: options.uValue || 500,
      area: options.area || 1.0
    };

    // Group by sensor and collect timestamps
    const sensorData = {};
    const timestamps = [];
    const heatExchangerData = {
      power: [],
      lmtd: [],
      effectiveness: []
    };
    
    data.forEach(row => {
      const temp = parseFloat(row.compensated_temperature);
      const time = new Date(row.timestamp).toLocaleTimeString();
      
      if (!sensorData[row.sensor_name]) {
        sensorData[row.sensor_name] = [];
      }
      sensorData[row.sensor_name].push(temp);
      
      if (!timestamps.includes(time)) {
        timestamps.push(time);
      }
    });

    // Calculate heat exchanger values for each timestamp
    if (config.includeHeatExchanger) {
      const timestampGroups = {};
      
      data.forEach(row => {
        const time = new Date(row.timestamp).toLocaleTimeString();
        if (!timestampGroups[time]) {
          timestampGroups[time] = {};
        }
        timestampGroups[time][row.sensor_name] = parseFloat(row.compensated_temperature);
      });

      timestamps.forEach(time => {
        const temps = timestampGroups[time];
        if (temps['Temp Kettle'] && temps['Temp UniTank'] && 
            temps['Temp Glycol'] && temps['Temp Mash']) {
          try {
            const result = HeatExchanger.calculateFromReadings({
              kettle: temps['Temp Kettle'],
              unitank: temps['Temp UniTank'],
              glycol: temps['Temp Glycol'],
              mash: temps['Temp Mash']
            }, config.uValue, config.area);
            
            heatExchangerData.power.push(result.powerKW);
            heatExchangerData.lmtd.push(result.lmtd);
            heatExchangerData.effectiveness.push(result.effectiveness);
          } catch (err) {
            heatExchangerData.power.push(null);
            heatExchangerData.lmtd.push(null);
            heatExchangerData.effectiveness.push(null);
          }
        } else {
          heatExchangerData.power.push(null);
          heatExchangerData.lmtd.push(null);
          heatExchangerData.effectiveness.push(null);
        }
      });
    }

    // Create HTML
    const html = this._createHTMLChart(sensorData, timestamps, csvFilePath, heatExchangerData, config);
    fs.writeFileSync(outputPath, html);
    return outputPath;
  }

  /**
   * Create HTML chart
   */
  static _createHTMLChart(sensorData, timestamps, csvFile, heatExchangerData, config) {
    const sensors = Object.keys(sensorData);
    // Distinct colors for each sensor and dataset
    const colors = [
      '#FF6B6B', // Wort In
      '#1976D2', // Wort Out
      '#43A047', // Water In
      '#FFD600', // Water Out
      '#FF1744', // Power (Heat Exchanger)
      '#00E676', // LMTD
      '#8E24AA'  // Effectiveness (if added)
    ];

    let datasets = '';
    sensors.forEach((sensor, idx) => {
      // Assign distinct color for each sensor
      let color = colors[idx % colors.length];
      const data = sensorData[sensor].map(v => v === null ? 'null' : v);
      let label = sensor;
      if (sensor === 'Temp Kettle') { label = 'Hot Inlet'; color = colors[0]; }
<<<<<<< HEAD
      else if (sensor === 'Temp Glycol') { label = 'Hot Outlet'; color = colors[1]; }
      else if (sensor === 'Temp UniTank') { label = 'Cold Inlet'; color = colors[2]; }
      else if (sensor === 'Temp Mash') { label = 'Cold Outlet'; color = colors[3]; }
=======
      else if (sensor === 'Temp Mash') { label = 'Hot Outlet'; color = colors[1]; }
      else if (sensor === 'Temp UniTank') { label = 'Cold Inlet'; color = colors[2]; }
      else if (sensor === 'Temp Glycol') { label = 'Cold Outlet'; color = colors[3]; }
>>>>>>> 5e1ac86a1b3d7ed44df7945d7dde40aa77a275f2
      datasets += `
      {
        label: '${label}',
        data: [${data.join(',')}],
        borderColor: '${color}',
        backgroundColor: '${color}33',
        tension: 0.3,
        fill: false,
        pointRadius: 2,
        pointHoverRadius: 4,
        yAxisID: 'y'
      },`;
    });

    // Add heat exchanger datasets if enabled
    let heatExchangerHTML = '';
    let powerDataset = '';
    let lmtdDataset = '';
    let effectivenessDataset = '';
    
    if (config.includeHeatExchanger && heatExchangerData.power.length > 0) {
      const powerData = heatExchangerData.power.map(v => v === null ? 'null' : v.toFixed(3));
      const lmtdData = heatExchangerData.lmtd.map(v => v === null ? 'null' : v.toFixed(2));
      const effectivenessData = heatExchangerData.effectiveness.map(v => v === null ? 'null' : v.toFixed(1));
      
      powerDataset = `
      {
        label: 'Heat Exchanger Power (kW)',
        data: [${powerData.join(',')}],
        borderColor: '${colors[4]}',
        backgroundColor: '${colors[4]}33',
        tension: 0.3,
        fill: false,
        pointRadius: 3,
        pointHoverRadius: 5,
        yAxisID: 'y1',
        borderWidth: 2
      },`;

      lmtdDataset = `
      {
        label: 'LMTD (°C)',
        data: [${lmtdData.join(',')}],
        borderColor: '${colors[5]}',
        backgroundColor: '${colors[5]}33',
        tension: 0.3,
        fill: false,
        pointRadius: 2,
        pointHoverRadius: 4,
        yAxisID: 'y',
        borderDash: [5, 5]
      },`;

      // Calculate stats for heat exchanger
      const validPower = heatExchangerData.power.filter(v => v !== null);
      const validLMTD = heatExchangerData.lmtd.filter(v => v !== null);
      const validEff = heatExchangerData.effectiveness.filter(v => v !== null);
      
      if (validPower.length > 0) {
        const avgPower = (validPower.reduce((a, b) => a + b, 0) / validPower.length).toFixed(3);
        const minPower = Math.min(...validPower).toFixed(3);
        const maxPower = Math.max(...validPower).toFixed(3);
        const avgLMTD = (validLMTD.reduce((a, b) => a + b, 0) / validLMTD.length).toFixed(2);
        const avgEff = (validEff.reduce((a, b) => a + b, 0) / validEff.length).toFixed(1);

        heatExchangerHTML = `
          <div class="heat-exchanger-section">
            <h2>⚡ Heat Exchanger Performance</h2>
            <div class="stats">
              <div class="stat-card heat-card">
                <h3>Power</h3>
                <p><strong>Min:</strong> ${minPower} kW</p>
                <p><strong>Max:</strong> ${maxPower} kW</p>
                <p><strong>Avg:</strong> ${avgPower} kW</p>
              </div>
              <div class="stat-card heat-card">
                <h3>LMTD</h3>
                <p><strong>Average:</strong> ${avgLMTD}°C</p>
              </div>
              <div class="stat-card heat-card">
                <h3>Effectiveness</h3>
                <p><strong>Average:</strong> ${avgEff}%</p>
              </div>
              <div class="stat-card heat-card">
                <h3>Configuration</h3>
                <p><strong>U-Value:</strong> ${config.uValue} W/m²·K</p>
                <p><strong>Area:</strong> ${config.area} m²</p>
              </div>
            </div>
          </div>`;
      }
    }

    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>BrewNode Temperature Monitor - Graph</title>
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background: linear-gradient(135deg, #1e3c72 0%, #2a5298 100%);
            min-height: 100vh;
            padding: 20px;
        }
        .container {
            max-width: 1400px;
            margin: 0 auto;
            background: white;
            border-radius: 8px;
            box-shadow: 0 10px 40px rgba(0,0,0,0.3);
            padding: 30px;
        }
        h1 { color: #333; margin-bottom: 10px; font-size: 28px; }
        h2 { color: #333; margin: 30px 0 20px 0; font-size: 22px; }
        .header-info { color: #666; margin-bottom: 20px; font-size: 14px; }
        .chart-wrapper { position: relative; height: 500px; margin-bottom: 30px; }
        .stats {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 20px;
            margin-top: 20px;
        }
        .stat-card {
            background: #f8f9fa;
            padding: 20px;
            border-radius: 6px;
            border-left: 4px solid #4ECDC4;
        }
        .heat-card {
            border-left-color: #FF1744;
        }
        .stat-card h3 {
            color: #333;
            margin-bottom: 10px;
            font-size: 14px;
            text-transform: uppercase;
            letter-spacing: 1px;
        }
        .refresh-info {
            background: #e8f4f8;
            padding: 10px 15px;
            border-radius: 4px;
            margin-bottom: 20px;
            font-size: 13px;
            color: #0066cc;
        }
        .footer {
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid #eee;
            color: #999;
            font-size: 12px;
        }
        .heat-exchanger-section {
            margin-top: 30px;
            padding-top: 30px;
            border-top: 2px solid #eee;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>🌡️ BrewNode Temperature Monitor</h1>
        <div class="header-info">
            <p><strong>Log File:</strong> ${csvFile}</p>
            <p><strong>Generated:</strong> ${new Date().toLocaleString()}</p>
            <p><strong>Data Points:</strong> ${timestamps.length} readings</p>
            ${config.includeHeatExchanger ? '<p><strong>Heat Exchanger:</strong> LMTD calculations enabled</p>' : ''}
        </div>
        <div class="refresh-info">
            💡 To update this graph, run: <code>npm run graph:html</code>
        </div>
        <div class="chart-wrapper">
            <canvas id="temperatureChart"></canvas>
        </div>
        
        <h2>🌡️ Temperature Statistics</h2>
        <div class="stats">
            ${sensors.map((sensor) => {
              const temps = sensorData[sensor].filter(v => v !== null);
              const min = Math.min(...temps).toFixed(1);
              const max = Math.max(...temps).toFixed(1);
              const avg = (temps.reduce((a, b) => a + b, 0) / temps.length).toFixed(1);
              let label = sensor;
            if (sensor === 'Temp Kettle') label = 'Hot Inlet';
<<<<<<< HEAD
            else if (sensor === 'Temp Glycol') label = 'Hot Outlet';
            else if (sensor === 'Temp UniTank') label = 'Cold Inlet';
            else if (sensor === 'Temp Mash') label = 'Cold Outlet';
=======
            else if (sensor === 'Temp Mash') label = 'Hot Outlet';
            else if (sensor === 'Temp UniTank') label = 'Cold Inlet';
            else if (sensor === 'Temp Glycol') label = 'Cold Outlet';
>>>>>>> 5e1ac86a1b3d7ed44df7945d7dde40aa77a275f2
              return `
                <div class="stat-card">
                  <h3>${label}</h3>
                  <p><strong>Min:</strong> ${min}°C</p>
                  <p><strong>Max:</strong> ${max}°C</p>
                  <p><strong>Avg:</strong> ${avg}°C</p>
                </div>`;
            }).join('')}
        </div>
        
        ${heatExchangerHTML}
        
        <div class="footer">
            <p>BrewNode Temperature Monitor | Generated on ${new Date().toLocaleString()}</p>
            ${config.includeHeatExchanger ? '<p>Heat Exchanger: Counterflow | Hot: Inlet→Outlet | Cold: Inlet→Outlet</p>' : ''}
        </div>
    </div>
    <script>
        const ctx = document.getElementById('temperatureChart').getContext('2d');
        new Chart(ctx, {
            type: 'line',
            data: {
                labels: [${timestamps.map(t => `'${t}'`).join(',')}],
                datasets: [${datasets}${powerDataset}${lmtdDataset}]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                interaction: {
                    mode: 'index',
                    intersect: false
                },
                plugins: {
                    title: { 
                        display: true, 
                        text: 'Temperature${config.includeHeatExchanger ? ' & Heat Exchanger Power' : ''} Over Time', 
                        font: { size: 16 } 
                    },
                    legend: { display: true, position: 'top' },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                let label = context.dataset.label || '';
                                if (label) {
                                    label += ': ';
                                }
                                if (context.parsed.y !== null) {
                                    if (label.includes('Power')) {
                                        label += context.parsed.y.toFixed(3) + ' kW';
                                    } else if (label.includes('Effectiveness')) {
                                        label += context.parsed.y.toFixed(1) + '%';
                                    } else {
                                        label += context.parsed.y.toFixed(1) + '°C';
                                    }
                                }
                                return label;
                            }
                        }
                    }
                },
                scales: {
                    y: {
                        type: 'linear',
                        display: true,
                        position: 'left',
                        title: { display: true, text: 'Temperature (°C)' },
                        beginAtZero: false
                    },
                    ${config.includeHeatExchanger ? `
                    y1: {
                        type: 'linear',
                        display: true,
                        position: 'right',
                        title: { display: true, text: 'Power (kW)' },
                        grid: { drawOnChartArea: false }
                    },` : ''}
                    x: { title: { display: true, text: 'Time' } }
                }
            }
        });
    </script>
</body>
</html>`;
  }
}

// CLI usage
if (require.main === module) {
  const args = process.argv.slice(2);
  let inputFile = 'logs/temperatures.csv';
  let outputType = 'ascii';
  let outputFile = null;
  const options = {
    includeHeatExchanger: true,
    uValue: 500,
    area: 1.0
  };

  for (let i = 0; i < args.length; i++) {
    if ((args[i] === '--input' || args[i] === '-i') && args[i + 1]) {
      inputFile = args[i + 1];
      i++;
    } else if ((args[i] === '--html' || args[i] === '-h') && args[i + 1]) {
      outputType = 'html';
      outputFile = args[i + 1];
      i++;
    } else if (args[i] === '--ascii' || args[i] === '-a') {
      outputType = 'ascii';
    } else if (args[i] === '--no-heat') {
      options.includeHeatExchanger = false;
    } else if (args[i] === '--uvalue' && args[i + 1]) {
      options.uValue = parseFloat(args[i + 1]);
      i++;
    } else if (args[i] === '--area' && args[i + 1]) {
      options.area = parseFloat(args[i + 1]);
      i++;
    } else if (args[i] === '--help') {
      console.log(`
Graph Generator - Generate temperature graphs from CSV logs

Usage: node graph-generator.js [options]

Options:
  --input, -i FILE    Input CSV file (default: logs/temperatures.csv)
  --html FILE         Output as HTML file
  --ascii, -a         Output as ASCII (default)
  --no-heat           Disable heat exchanger calculations
  --uvalue VALUE      Set U-value in W/m²·K (default: 500)
  --area VALUE        Set heat transfer area in m² (default: 1.0)
  --help              Show this help message

Examples:
  node graph-generator.js                              # ASCII output
  node graph-generator.js --input logs/temps.csv      # ASCII from custom file
  node graph-generator.js --html graph.html           # HTML with heat exchanger
  node graph-generator.js --html graph.html --no-heat # HTML without heat exchanger
  node graph-generator.js --html graph.html --uvalue 300 --area 0.5  # Custom config

Heat Exchanger:
  The heat exchanger uses LMTD (Log Mean Temperature Difference) method to calculate
  power transfer. Default configuration assumes:
    - U-Value: 500 W/m²·K (overall heat transfer coefficient)
    - Area: 1.0 m² (heat transfer surface area)
  
  Adjust these values to match your actual heat exchanger specifications.
      `);
      process.exit(0);
    }
  }

  try {
    if (outputType === 'html') {
      const outPath = outputFile || 'temperature-graph.html';
      const result = TemperatureGraphGenerator.generateHTMLGraph(inputFile, outPath, options);
      console.log(`✅ HTML graph generated: ${result}`);
      console.log(`📊 Open in browser: file://${path.resolve(result)}`);
      if (options.includeHeatExchanger) {
        console.log(`⚡ Heat Exchanger: U=${options.uValue} W/m²·K, A=${options.area} m²`);
      }
    } else {
      const graph = TemperatureGraphGenerator.generateASCIIGraph(inputFile);
      console.log(graph);
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

module.exports = TemperatureGraphGenerator;

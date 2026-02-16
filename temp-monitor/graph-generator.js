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
  static generateHTMLGraph(csvFilePath, outputPath) {
    if (!fs.existsSync(csvFilePath)) {
      throw new Error(`CSV file not found: ${csvFilePath}`);
    }

    const data = this.parseCSV(csvFilePath);
    if (data.length === 0) {
      throw new Error('No data available in CSV file');
    }

    // Group by sensor
    const sensorData = {};
    const timestamps = [];
    
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

    // Create HTML
    const html = this._createHTMLChart(sensorData, timestamps, csvFilePath);
    fs.writeFileSync(outputPath, html);
    return outputPath;
  }

  /**
   * Create HTML chart
   */
  static _createHTMLChart(sensorData, timestamps, csvFile) {
    const sensors = Object.keys(sensorData);
    const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A'];

    let datasets = '';
    sensors.forEach((sensor, idx) => {
      const color = colors[idx % colors.length];
      const data = sensorData[sensor].map(v => v === null ? 'null' : v);
      datasets += `
      {
        label: '${sensor}',
        data: [${data.join(',')}],
        borderColor: '${color}',
        backgroundColor: '${color}33',
        tension: 0.3,
        fill: true,
        pointRadius: 2,
        pointHoverRadius: 4
      },`;
    });

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
        .header-info { color: #666; margin-bottom: 20px; font-size: 14px; }
        .chart-wrapper { position: relative; height: 500px; margin-bottom: 30px; }
        .stats {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 20px;
            margin-top: 30px;
        }
        .stat-card {
            background: #f8f9fa;
            padding: 20px;
            border-radius: 6px;
            border-left: 4px solid #4ECDC4;
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
    </style>
</head>
<body>
    <div class="container">
        <h1>🌡️ BrewNode Temperature Monitor</h1>
        <div class="header-info">
            <p><strong>Log File:</strong> ${csvFile}</p>
            <p><strong>Generated:</strong> ${new Date().toLocaleString()}</p>
            <p><strong>Data Points:</strong> ${timestamps.length} readings</p>
        </div>
        <div class="refresh-info">
            💡 To update this graph, run: <code>npm run graph:html</code>
        </div>
        <div class="chart-wrapper">
            <canvas id="temperatureChart"></canvas>
        </div>
        <div class="stats">
            ${sensors.map((sensor) => {
                const temps = sensorData[sensor].filter(v => v !== null);
                const min = Math.min(...temps).toFixed(1);
                const max = Math.max(...temps).toFixed(1);
                const avg = (temps.reduce((a, b) => a + b, 0) / temps.length).toFixed(1);
                return `
                <div class="stat-card">
                    <h3>${sensor}</h3>
                    <p><strong>Min:</strong> ${min}°C</p>
                    <p><strong>Max:</strong> ${max}°C</p>
                    <p><strong>Avg:</strong> ${avg}°C</p>
                </div>`;
            }).join('')}
        </div>
        <div class="footer">
            <p>BrewNode Temperature Monitor | Generated on ${new Date().toLocaleString()}</p>
        </div>
    </div>
    <script>
        const ctx = document.getElementById('temperatureChart').getContext('2d');
        new Chart(ctx, {
            type: 'line',
            data: {
                labels: [${timestamps.map(t => `'${t}'`).join(',')}],
                datasets: [${datasets}]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    title: { display: true, text: 'Temperature Over Time', font: { size: 16 } },
                    legend: { display: true, position: 'top' }
                },
                scales: {
                    y: { title: { display: true, text: 'Temperature (°C)' }, beginAtZero: false },
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
    } else if (args[i] === '--help') {
      console.log(`
Graph Generator - Generate temperature graphs from CSV logs

Usage: node graph-generator.js [options]

Options:
  --input, -i FILE    Input CSV file (default: logs/temperatures.csv)
  --html FILE         Output as HTML file
  --ascii, -a         Output as ASCII (default)
  --help              Show this help message

Examples:
  node graph-generator.js                           # ASCII output
  node graph-generator.js --input logs/temps.csv   # ASCII from custom file
  node graph-generator.js --html graph.html        # HTML output
      `);
      process.exit(0);
    }
  }

  try {
    if (outputType === 'html') {
      const outPath = outputFile || 'temperature-graph.html';
      const result = TemperatureGraphGenerator.generateHTMLGraph(inputFile, outPath);
      console.log(`✅ HTML graph generated: ${result}`);
      console.log(`📊 Open in browser: file://${path.resolve(result)}`);
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

#!/usr/bin/env node

/**
 * Graph Generation Examples
 * 
 * Demonstrates how to use the graph generation feature
 */

const GraphGenerator = require('./graph-generator.js');
const path = require('path');

console.log('🌡️  BrewNode Temperature Monitor - Graph Generation Examples\n');
console.log('These examples show how to generate temperature graphs.\n');

// Example 1: ASCII Graph to Console
console.log('Example 1: ASCII Graph (Terminal Output)');
console.log('═'.repeat(60));
console.log('Code:');
console.log('  const GraphGen = require(\'./graph-generator.js\');');
console.log('  const graph = GraphGen.generateASCIIGraph(\'logs/temperatures.csv\');');
console.log('  console.log(graph);\n');
console.log('Command:');
console.log('  npm run graph\n');

// Example 2: ASCII Graph from Custom File
console.log('Example 2: ASCII Graph from Custom File');
console.log('═'.repeat(60));
console.log('Code:');
console.log('  const graph = GraphGen.generateASCIIGraph(\'/var/log/temps.csv\');');
console.log('  console.log(graph);\n');
console.log('Command:');
console.log('  node graph-generator.js --input /var/log/temps.csv --ascii\n');

// Example 3: HTML Graph with Custom Width/Height
console.log('Example 3: HTML Graph File');
console.log('═'.repeat(60));
console.log('Code:');
console.log('  const GraphGen = require(\'./graph-generator.js\');');
console.log('  GraphGen.generateHTMLGraph(\'logs/temperatures.csv\', \'chart.html\');');
console.log('  // Open chart.html in browser\n');
console.log('Command:');
console.log('  npm run graph:html\n');

// Example 4: HTML Graph to Custom Location
console.log('Example 4: HTML Graph to Custom Location');
console.log('═'.repeat(60));
console.log('Code:');
console.log('  GraphGen.generateHTMLGraph(');
console.log('    \'logs/temperatures.csv\',');
console.log('    \'/tmp/brewery-chart.html\'');
console.log('  );\n');
console.log('Command:');
console.log('  node graph-generator.js \\');
console.log('    --input logs/temperatures.csv \\');
console.log('    --html /tmp/brewery-chart.html\n');

// Example 5: Use Case - Daily Report
console.log('Example 5: Generate Daily Report');
console.log('═'.repeat(60));
console.log('Code:');
console.log(`
const GraphGen = require('./graph-generator.js');
const fs = require('fs');
const path = require('path');

// Create reports directory
const reportsDir = './reports';
if (!fs.existsSync(reportsDir)) {
  fs.mkdirSync(reportsDir, { recursive: true });
}

// Generate report with today's date
const today = new Date().toISOString().split('T')[0];
const reportFile = path.join(reportsDir, \`temperature-report-\${today}.html\`);

GraphGen.generateHTMLGraph('logs/temperatures.csv', reportFile);
console.log(\`✅ Report generated: \${reportFile}\`);
`);
console.log('Command:');
console.log('  node -e "<code above>"\n');

// Example 6: Module Usage in Application
console.log('Example 6: Integration into Application');
console.log('═'.repeat(60));
console.log(`
const TemperatureMonitor = require('./index.js');
const GraphGenerator = require('./graph-generator.js');

// Start monitoring
const monitor = new TemperatureMonitor();
await monitor.start();

// Later, generate graph
setTimeout(() => {
  try {
    GraphGenerator.generateHTMLGraph(
      'logs/temperatures.csv',
      'latest-graph.html'
    );
    console.log('Graph updated!');
  } catch (err) {
    console.error('Graph generation failed:', err);
  }
}, 300000); // Generate every 5 minutes
`);

console.log('\n═'.repeat(60));
console.log('CLI Options Reference:');
console.log('═'.repeat(60));
console.log('');
console.log('node graph-generator.js --help              Show help');
console.log('node graph-generator.js                     ASCII to console');
console.log('node graph-generator.js --ascii             ASCII to console');
console.log('node graph-generator.js --html graph.html   HTML to file');
console.log('node graph-generator.js -i custom.csv       Custom input file');
console.log('npm run graph                               ASCII graph');
console.log('npm run graph:html                          HTML graph');
console.log('');

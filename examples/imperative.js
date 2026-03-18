// Complex Imperative Examples: Using for loops with various if statements
// These examples demonstrate imperative programming with explicit loops, conditionals, and mutable state.

const users = [
  { id: 1, name: 'Alice', age: 25, active: true, scores: [85, 90, 88] },
  { id: 2, name: 'Bob', age: 30, active: false, scores: [70, 75, 80] },
  { id: 3, name: 'Charlie', age: 22, active: true, scores: [95, 92, 98] },
  { id: 4, name: 'Diana', age: 28, active: true, scores: [60, 65, 70] },
  { id: 5, name: 'Eve', age: 35, active: false, scores: [88, 85, 90] }
];

// Example 1: Filter active users, calculate average score, and categorize by age group
function processUsersImperative(users) {
  const result = { young: [], middle: [], senior: [] };
  for (let i = 0; i < users.length; i++) {
    const user = users[i];
    if (user.active) {
      let totalScore = 0;
      for (let j = 0; j < user.scores.length; j++) {
        totalScore += user.scores[j];
      }
      const avgScore = totalScore / user.scores.length;
      if (avgScore >= 80) {
        const category = user.age < 25 ? 'young' : user.age < 35 ? 'middle' : 'senior';
        result[category].push({ name: user.name, avgScore: Math.round(avgScore) });
      }
    }
  }
  return result;
}

console.log('Imperative Result:', processUsersImperative(users));

// Example 2: Find users with scores above threshold and build a summary report
function buildReportImperative(users, threshold = 85) {
  const report = { totalQualified: 0, details: [] };
  for (let i = 0; i < users.length; i++) {
    const user = users[i];
    let hasHighScore = false;
    for (let j = 0; j < user.scores.length; j++) {
      if (user.scores[j] > threshold) {
        hasHighScore = true;
        break;
      }
    }
    if (hasHighScore && user.active) {
      report.totalQualified++;
      report.details.push({
        id: user.id,
        name: user.name,
        maxScore: Math.max(...user.scores)
      });
    }
  }
  return report;
}

console.log('Imperative Report:', buildReportImperative(users));

// Example 3: Transform data with conditional logic and accumulate statistics
function transformAndAccumulateImperative(users) {
  const transformed = [];
  let stats = { totalActive: 0, avgAge: 0, highPerformers: 0 };
  let ageSum = 0;
  for (let i = 0; i < users.length; i++) {
    const user = users[i];
    if (user.active) {
      stats.totalActive++;
      ageSum += user.age;
      const avgScore = user.scores.reduce((a, b) => a + b, 0) / user.scores.length;
      if (avgScore > 85) {
        stats.highPerformers++;
        transformed.push({
          fullName: user.name.toUpperCase(),
          age: user.age,
          performance: avgScore > 90 ? 'Excellent' : 'Good',
          scores: user.scores.map(score => score + 5) // Bonus points
        });
      } else if (avgScore > 75) {
        transformed.push({
          fullName: user.name,
          age: user.age,
          performance: 'Average',
          scores: user.scores
        });
      }
    }
  }
  stats.avgAge = ageSum / stats.totalActive;
  return { transformed, stats };
}

console.log('Imperative Transform:', transformAndAccumulateImperative(users));

// Simple Examples with Numbers Array

const numbers = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

// Simple Example 1: Filter Even Numbers
const evens = [];
for (let i = 0; i < numbers.length; i++) {
  if (numbers[i] % 2 === 0) {
    evens.push(numbers[i]);
  }
}
console.log('Simple Imperative Evens:', evens);

// Simple Example 2: Transform Elements Conditionally (Double evens, leave odds)
const transformed = [];
for (let i = 0; i < numbers.length; i++) {
  if (numbers[i] % 2 === 0) {
    transformed.push(numbers[i] * 2);
  } else {
    transformed.push(numbers[i]);
  }
}
console.log('Simple Imperative Transformed:', transformed);

// Simple Example 3: Accumulate Sum with Conditions (Sum > 5)
let sum = 0;
for (let i = 0; i < numbers.length; i++) {
  if (numbers[i] > 5) {
    sum += numbers[i];
  }
}
console.log('Simple Imperative Sum:', sum);

// Simple Example 4: Find First Matching Element (> 7)
let found = null;
for (let i = 0; i < numbers.length; i++) {
  if (numbers[i] > 7) {
    found = numbers[i];
    break;
  }
}
console.log('Simple Imperative Found:', found);

// Simple Example 5: Count Elements with Multiple Conditions (Even and > 5)
let count = 0;
for (let i = 0; i < numbers.length; i++) {
  if (numbers[i] % 2 === 0 && numbers[i] > 5) {
    count++;
  }
}
console.log('Simple Imperative Count:', count);
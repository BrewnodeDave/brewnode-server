// Complex Functional Examples: Using array methods like filter, map, reduce
// These examples demonstrate functional programming with declarative transformations, immutability, and chaining.

const users = [
  { id: 1, name: 'Alice', age: 25, active: true, scores: [85, 90, 88] },
  { id: 2, name: 'Bob', age: 30, active: false, scores: [70, 75, 80] },
  { id: 3, name: 'Charlie', age: 22, active: true, scores: [95, 92, 98] },
  { id: 4, name: 'Diana', age: 28, active: true, scores: [60, 65, 70] },
  { id: 5, name: 'Eve', age: 35, active: false, scores: [88, 85, 90] }
];

// Helper functions for functional examples
const isActive = (user) => user.active;

const addAvgScore = (user) => ({
  ...user,
  avgScore: user.scores.reduce((sum, score) => sum + score, 0) / user.scores.length
});

const hasHighAvgScore = (user) => user.avgScore >= 80;

const ageCategory = (age) => age < 25 ? 'young' : age < 35 ? 'middle' : 'senior';

function categorizeByAge(result, user) {
  const category = ageCategory(user.age);

  result[category].push({ 
    name: user.name, 
    avgScore: Math.round(user.avgScore) 
  });
  return result;
}

const isQualified = (user, threshold = 85) => user.active && user.scores.some(score => score > threshold);

const toSummary = (user) => ({
  id: user.id,
  name: user.name,
  maxScore: Math.max(...user.scores)
});

const add = (a, b) => a + b;

const addAvgScoreForTransform = (user) => ({
  ...user, 
  avgScore: user.scores.reduce(add, 0) / user.scores.length
});

const hasGoodAvgScore = (user) => user.avgScore > 75;

const getScore = (score) => score > 90 ? 'Excellent' : score > 85 ? 'Good' : 'Average';

const add5 = (score) => add(score, 5);

const transformUser = (user) => ({
  fullName: (user.avgScore > 85) ? user.name.toUpperCase() : user.name,
  age: user.age,
  performance: getScore(user.avgScore),
  scores: user.avgScore > 85 ? user.scores.map(add5) : user.scores
});

function accumulateStats(acc, user) {
  acc.totalActive++;
  acc.avgAge += user.age;
  const avgScore = user.scores.reduce(add, 0) / user.scores.length;
  
  if (avgScore > 85) acc.highPerformers++;
  
  return acc;
}

// Example 1: Filter active users, calculate average score, and categorize by age group
const processUsersFunctional = (users) =>  
    users.filter(isActive)
    .map(addAvgScore)
    .filter(hasHighAvgScore)
    .reduce(categorizeByAge, { young: [], middle: [], senior: [] });


console.log('Functional Result:', processUsersFunctional(users));

// Example 2: Find users with scores above threshold and build a summary report
function buildReportFunctional(users, threshold = 85) {
  const qualified = users
    .filter(user => isQualified(user, threshold))
    .map(toSummary);

  return {
    totalQualified: qualified.length,
    details: qualified
  };
}

console.log('Functional Report:', buildReportFunctional(users));

// Example 3: Transform data with conditional logic and accumulate statistics
function transformAndAccumulateFunctional(users) {
  const activeUsers = users.filter(isActive);

  const transformed = activeUsers
    .map(addAvgScoreForTransform)
    .filter(hasGoodAvgScore)
    .map(transformUser);

  const stats = activeUsers.reduce(accumulateStats, { totalActive: 0, avgAge: 0, highPerformers: 0 });
  stats.avgAge /= stats.totalActive;

  return { transformed, stats };
}

console.log('Functional Transform:', transformAndAccumulateFunctional(users));

// Simple Examples with Numbers Array

const numbers = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

const greaterThan = (threshold) => (num) => num > threshold;
// Simple Example 1: Filter Even Numbers
const isEven = (num) => num % 2 === 0;
const evens = numbers.filter(isEven);
console.log('Simple Functional Evens:', evens);

// Simple Example 2: Transform Elements Conditionally (Double evens, leave odds)
const transformed = numbers.map(num => isEven(num) ? num * 2 : num);
console.log('Simple Functional Transformed:', transformed);

// Simple Example 3: Accumulate Sum with Conditions (Sum > 5)
const sum = numbers.filter(greaterThan(5)).reduce(add, 0);
console.log('Simple Functional Sum:', sum);

// Simple Example 4: Find First Matching Element (> 7)
const found = numbers.find(greaterThan(7));
console.log('Simple Functional Found:', found);

// Simple Example 5: Count Elements with Multiple Conditions (Even and > 5)
const count = numbers.filter(num => isEven(num) && greaterThan(5)(num)).length;
console.log('Simple Functional Count:', count);
# Imperative vs Functional JavaScript: A Comparison

---

## Slide 1: Title Slide
### Imperative vs Functional JavaScript Examples
**Comparing Loops with If Statements vs Array Methods**

- Presented by: GitHub Copilot
- Date: March 9, 2026

---

## Slide 2: Overview
### What We'll Cover
- **Imperative Programming**: Using `for` loops and `if` statements
- **Functional Programming**: Using `filter`, `map`, `reduce`, etc.
- **Examples**: Simple (numbers) and Complex (objects)
- **Comparison**: Readability, Performance, Best Use Cases
- **Note**: Functional examples use extracted helper functions for clarity

---

## Slide 3: Simple Example 1 - Filter Evens
### Task: Extract even numbers from [1,2,3,4,5,6,7,8,9,10]

**Imperative:**
```javascript
const evens = [];
for (let i = 0; i < numbers.length; i++) {
  if (numbers[i] % 2 === 0) {
    evens.push(numbers[i]);
  }
}
```

**Functional:**
```javascript
const isEven = (num) => num % 2 === 0;
const evens = numbers.filter(isEven);
```

**Output:** [2, 4, 6, 8, 10]

---

## Slide 4: Simple Example 2 - Conditional Transform
### Task: Double evens, leave odds unchanged

**Imperative:**
```javascript
const transformed = [];
for (let i = 0; i < numbers.length; i++) {
  if (numbers[i] % 2 === 0) {
    transformed.push(numbers[i] * 2);
  } else {
    transformed.push(numbers[i]);
  }
}
```

**Functional:**
```javascript
const transformed = numbers.map(num => num % 2 === 0 ? num * 2 : num);
```

**Output:** [1, 4, 3, 8, 5, 12, 7, 16, 9, 20]

---

## Slide 5: Simple Example 3 - Conditional Sum
### Task: Sum numbers greater than 5

**Imperative:**
```javascript
let sum = 0;
for (let i = 0; i < numbers.length; i++) {
  if (numbers[i] > 5) {
    sum += numbers[i];
  }
}
```

**Functional:**
```javascript
const greaterThan = (threshold) => (num) => num > threshold;
const add = (a, b) => a + b;
const sum = numbers.filter(greaterThan(5)).reduce(add, 0);
```

**Output:** 40

---

## Slide 6: Simple Example 4 - Find First Match
### Task: Find first number > 7

**Imperative:**
```javascript
let found = null;
for (let i = 0; i < numbers.length; i++) {
  if (numbers[i] > 7) {
    found = numbers[i];
    break;
  }
}
```

**Functional:**
```javascript
const greaterThan = (threshold) => (num) => num > threshold;
const found = numbers.find(greaterThan(7));
```

**Output:** 8

---

## Slide 7: Simple Example 5 - Count with Conditions
### Task: Count evens greater than 5

**Imperative:**
```javascript
let count = 0;
for (let i = 0; i < numbers.length; i++) {
  if (numbers[i] % 2 === 0 && numbers[i] > 5) {
    count++;
  }
}
```

**Functional:**
```javascript
const isEven = (num) => num % 2 === 0;
const greaterThan = (threshold) => (num) => num > threshold;
const count = numbers.filter(num => isEven(num) && greaterThan(5)(num)).length;
```

**Output:** 3

---

## Slide 8: Complex Example 1 - Process Users
### Task: Filter active users, avg score >=80, categorize by age

**Imperative:** (Nested loops, mutations)
```javascript
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
```

**Functional:** (Chained methods)
```javascript
function processUsersFunctional(users) {
  return users
    .filter(isActive)
    .map(addAvgScore)
    .filter(hasHighAvgScore)
    .reduce(categorizeByAge, { young: [], middle: [], senior: [] });
}
```

---

## Slide 9: Complex Example 2 - Build Report
### Task: Find active users with score >85, build summary

**Imperative:** (Loop with nested check)
```javascript
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
```

**Functional:** (Filter with some, map)
```javascript
function buildReportFunctional(users, threshold = 85) {
  const qualified = users
    .filter(user => isQualified(user, threshold))
    .map(toSummary);

  return {
    totalQualified: qualified.length,
    details: qualified
  };
}
```

---

## Slide 10: Complex Example 3 - Transform & Accumulate
### Task: Transform based on performance, accumulate stats

**Imperative:** (Multiple loops, mutations)
```javascript
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
          scores: user.scores.map(score => score + 5)
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
```

**Functional:** (Separate chains)
```javascript
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
```

---

## Slide 11: Key Differences Summary
### Imperative vs Functional

| Aspect | Imperative | Functional |
|--------|------------|------------|
| **Control** | Explicit loops, breaks | Declarative methods |
| **State** | Mutable variables | Immutable |
| **Readability** | Step-by-step | Expressive chains |
| **Performance** | Faster for large data | Optimized by JS engines |
| **Debugging** | Easier with breakpoints | Chain debugging |
| **Best For** | Complex control flow | Data transformations |

---

## Slide 12: When to Use Each
### Choosing the Right Approach

- **Use Imperative When:**
  - Performance-critical code
  - Need fine-grained control (e.g., early exits)
  - Complex nested logic

- **Use Functional When:**
  - Data processing pipelines
  - Readability and maintainability matter
  - Avoiding side effects

**Hybrid Approach:** Mix both in real code!

---

## Slide 13: Conclusion
### Takeaways
- Both paradigms achieve the same results
- Functional is often more concise and safer
- Choose based on context and team preferences
- Practice both to become a better developer

**Questions?**

---

## Slide 14: References
- Files: `examples/imperative.js`, `examples/functional.js`
- Run with: `node examples/imperative.js`
- Documentation: `examples/README.md`
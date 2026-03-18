---
marp: true
theme: default
paginate: true
header: Imperative vs Functional JavaScript
footer: Dave Leitch - 2024
---

# Imperative vs Functional JavaScript

## Comparing Two Programming Paradigms

---

## What is Imperative Programming?

- **How**: Focuses on **how** to achieve the result
- **Commands**: Uses explicit commands and loops
- **State**: Modifies state directly
- **Control Flow**: Explicit with for loops, if statements
- **Readability**: Step-by-step instructions

```javascript
// Example: Imperative style
for (let i = 0; i < array.length; i++) {
    if (array[i] > 5) {
        result.push(array[i] * 2);
    }
}
```

---

## What is Functional Programming?

- **What**: Focuses on **what** transformation to apply
- **Functions**: Uses higher-order functions
- **Immutability**: Avoids modifying state
- **Composition**: Chains operations together
- **Readability**: Declarative and expressive

```javascript
// Example: Functional style
const result = array
    .filter(item => item > 5)
    .map(item => item * 2);
```

---

## Example 1: Processing Users

### Imperative Approach

```javascript
function processUsersImperative(users) {
    const activeUsers = [];
    for (let i = 0; i < users.length; i++) {
        if (users[i].isActive) {
            activeUsers.push({
                name: users[i].name,
                score: users[i].score + 10
            });
        }
    }
    return activeUsers;
}
```

---

## Example 1: Processing Users (cont.)

### Functional Approach

```javascript
const isActive = user => user.isActive;
const addBonus = user => ({
    name: user.name,
    score: user.score + 10
});

function processUsersFunctional(users) {
    return users
        .filter(isActive)
        .map(addBonus);
}
```

---

## Example 2: Building Reports

### Imperative Approach

```javascript
function buildReportImperative(data) {
    const report = {};
    for (let i = 0; i < data.length; i++) {
        const item = data[i];
        const key = item.category;
        
        if (!report[key]) {
            report[key] = [];
        }
        report[key].push(item.value);
    }
    return report;
}
```

---

## Example 2: Building Reports (cont.)

### Functional Approach

```javascript
function buildReportFunctional(data) {
    return data.reduce((report, item) => ({
        ...report,
        [item.category]: [
            ...(report[item.category] || []),
            item.value
        ]
    }), {});
}
```

---

## Example 3: Transform & Accumulate

### Imperative Approach

```javascript
function transformAndAccumulateImperative(items) {
    let total = 0;
    const processed = [];
    
    for (let i = 0; i < items.length; i++) {
        const value = items[i] * 2;
        processed.push(value);
        total += value;
    }
    
    return { items: processed, total };
}
```

---

## Example 3: Transform & Accumulate (cont.)

### Functional Approach

```javascript
function transformAndAccumulateFunctional(items) {
    const processed = items.map(item => item * 2);
    const total = processed.reduce((sum, val) => sum + val, 0);
    return { items: processed, total };
}
```

---

## Simple Operations: Filtering

### Imperative
```javascript
const result = [];
for (let i = 0; i < numbers.length; i++) {
    if (numbers[i] > 5) {
        result.push(numbers[i]);
    }
}
```

### Functional
```javascript
const result = numbers.filter(n => n > 5);
```

---

## Simple Operations: Mapping

### Imperative
```javascript
const result = [];
for (let i = 0; i < numbers.length; i++) {
    result.push(numbers[i] * 2);
}
```

### Functional
```javascript
const result = numbers.map(n => n * 2);
```

---

## Simple Operations: Reducing

### Imperative
```javascript
let sum = 0;
for (let i = 0; i < numbers.length; i++) {
    sum += numbers[i];
}
```

### Functional
```javascript
const sum = numbers.reduce((acc, n) => acc + n, 0);
```

---

## Advantages: Imperative

✅ **Explicit Control**: Complete control over each step  
✅ **Performance**: Sometimes faster due to explicit operations  
✅ **Debugging**: Step-by-step execution is easier to trace  
✅ **Legacy**: Familiar to most developers  

---

## Advantages: Functional

✅ **Readability**: Cleaner, more expressive code  
✅ **Testability**: Pure functions are easier to unit test  
✅ **Reusability**: Functions are more composable  
✅ **Immutability**: Reduces bugs from state mutations  
✅ **Parallelization**: Easier to parallelize operations  

---

## When to Use Each?

### Use Imperative When:
- Performance is critical
- You need fine-grained control
- The logic is complex and procedural
- Working with legacy code

### Use Functional When:
- Code clarity is important
- You're processing data transformations
- You need robust, testable code
- Team is familiar with FP concepts

---

## Key Takeaways

1. **Both paradigms are valid** and have their place
2. **Modern JavaScript** supports both styles
3. **Hybrid approach** often works best
4. **Functional style** is increasingly preferred for data processing
5. **Imperative style** is still useful for complex control flow

---

## Resources

- MDN Web Docs: Array Methods
- ECMAScript 2015 (ES6) Specification
- "Composing Software" by Eric Elliott
- Functional Programming in JavaScript

---

# Thank You!

### Questions?

**GitHub**: github.com/yourusername  
**Email**: your.email@example.com

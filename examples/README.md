# Imperative vs Functional JavaScript Examples

This document compares imperative and functional programming approaches in JavaScript, including both simple examples with number arrays and complex examples with object arrays and conditional logic.

## Overview

- **Imperative**: Uses explicit `for` loops, mutable variables, and step-by-step control flow with `if` statements.
- **Functional**: Uses declarative array methods (`filter`, `map`, `reduce`), immutability, and method chaining.
- **Helper Functions**: Functional examples include extracted named functions for better readability and reusability.

## Simple Examples (Number Arrays)

These demonstrate basic operations on `[1, 2, 3, 4, 5, 6, 7, 8, 9, 10]`:

1. **Filter Evens**: Extract even numbers using `filter(isEven)`.
2. **Conditional Transform**: Double evens, leave odds unchanged.
3. **Conditional Sum**: Sum numbers > 5 using `filter(greaterThan(5))`.
4. **Find First**: Find first number > 7 using `find(greaterThan(7))`.
5. **Count with Conditions**: Count evens > 5 using `filter` with combined conditions.

Both files include these simple examples for comparison. The functional version uses extracted helper functions like `isEven`, `greaterThan`, and `add` for composability.

## Complex Examples (Object Arrays)

These examples work with user objects containing nested data and multiple conditions.

### Example 1: Processing Users (Filter, Transform, Categorize)

### Task
Filter active users, calculate average scores, categorize by age, and only include those with avg >= 80.

### Imperative Approach
- Nested loops for score calculation.
- Mutable result object.
- Multiple `if` conditions for categorization.

### Functional Approach
- Uses extracted helpers: `filter(isActive)`, `map(addAvgScore)`, `filter(hasHighAvgScore)`, `reduce(categorizeByAge)`.
- Helper function `ageCategory(age)` extracts the categorization logic.
- Immutable transformations.
- Declarative categorization in `reduce`.

**Key Difference**: Functional avoids nested loops and mutations, making it more composable.

## Example 2: Building Reports (Filter with Nested Conditions)

### Task
Find active users with any score > threshold, build summary with max scores.

### Imperative Approach
- Loop with nested loop for score checking.
- Manual counter and array building.
- `break` for early exit in inner loop.

### Functional Approach
- Uses extracted helpers: `filter(user => isQualified(user, threshold))`, `map(toSummary)`.
- Helper function `isQualified(user, threshold)` encapsulates the complex condition.
- Direct length access for count.

**Key Difference**: Functional handles nested conditions elegantly without explicit loops or breaks.

## Example 3: Transform and Accumulate (Complex Logic)

### Task
Transform active users based on performance, accumulate statistics.

### Imperative Approach
- Multiple loops and mutations.
- Conditional logic scattered in loops.
- Manual accumulation of stats.

### Functional Approach
- Uses extracted helpers: `filter(isActive)`, `map(addAvgScoreForTransform)`, `filter(hasGoodAvgScore)`, `map(transformUser)`, `reduce(accumulateStats)`.
- Helper functions like `add`, `add5`, `getScore` extract common operations and scoring logic.
- Pure functions with no side effects.
- Separate chains for transformation and stats aggregation.

**Key Difference**: Functional separates concerns better, leading to more testable and reusable code.

## General Comparison

| Aspect | Imperative | Functional |
|--------|------------|------------|
| **Readability** | Step-by-step, familiar | Declarative, expressive |
| **Immutability** | Mutable state (prone to bugs) | Immutable (safer) |
| **Performance** | Often faster for large data | Optimized by engines, but may create intermediate arrays |
| **Debugging** | Easier to trace with breakpoints | Harder to debug chains |
| **Composability** | Limited | High (easy to add/remove steps) |
| **Best For** | Performance-critical, complex control flow | Data transformations, readability |

## Running the Examples

To run these examples:

```bash
node examples/imperative.js
node examples/functional.js
```

Both should produce equivalent outputs, demonstrating that functional code can achieve the same results with different paradigms.

## When to Use Each

- **Imperative**: When you need fine-grained control, early exits, or performance optimization.
- **Functional**: For most data processing tasks, especially in modern JS applications where readability and maintainability matter more than micro-optimizations.
/*
 * Beerware License
 * ----------------
 * As long as you retain this notice, you can do whatever you want with 
 * this stuff. If we meet someday, and you think this stuff is worth it, 
 * you can buy me a beer in return.
 */

/**
 * Temperature sensor definitions with compensation formulas
 * Uses 4 key sensors from the BrewNode system
 */

function round(num) {
  return Math.round(num * 10) / 10;
}

module.exports = [
  {
    name: "Temp Glycol",
    id: '28-000007519802',
    prevValue: null,
    compensate: x => round(x * 1.023534722 - 1.509305021)
  },
  {
    name: "Temp Kettle",
    id: '28-00000751bbce',
    prevValue: null,
    compensate: x => round(x * 1.023534722 - 1.509305021)
  },
  {
    name: "Temp UniTank",
    id: '28-0000071f5017',
    prevValue: null,
    compensate: x => round(x * 1.020492493 - 1.323124509)
  },
  {
    name: "Temp SS",
    id: '28-0000006a79e8',
    prevValue: null,
    compensate: x => round(x * 1.020492493 - 1.323124509)
  }
];

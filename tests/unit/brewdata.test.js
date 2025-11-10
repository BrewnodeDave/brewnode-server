const brewdata = require('../../src/brewstack/common/brewdata.js');
const fs = require('fs');

// Mock dependencies
jest.mock('fs');
jest.mock('../../src/brewstack/common/brewdefs.js', () => ({
  isRaspPi: jest.fn(() => false),
  WATER_TO_GRIST: 3.0,
  MASHTUN_LOSSES: 2.0
}));
jest.mock('../../src/brewstack/common/brewlog.js', () => ({
  info: jest.fn(),
  error: jest.fn()
}));
jest.mock('../../src/services/brewfather-service.js', () => ({
  currentRecipe: jest.fn()
}));
jest.mock('../../src/services/temp-service.js', () => ({
  getTemp: jest.fn()
}));

describe('Brewdata Module', () => {
  let mockFs;
  let brewfatherService;

  beforeEach(() => {
    jest.clearAllMocks();
    
    mockFs = require('fs');
    brewfatherService = require('../../src/services/brewfather-service.js');
  });

  describe('defaultOptions', () => {
    test('should return default brewing options', () => {
      const options = brewdata.defaultOptions();
      
      expect(options).toHaveProperty('ambientTemp', 10);
      expect(options).toHaveProperty('flowTimeoutSecs');
      expect(options).toHaveProperty('flowReportSecs', 1);
      expect(options).toHaveProperty('whirlpoolMins');
      expect(options).toHaveProperty('boilMins');
      expect(options).toHaveProperty('valveSwitchDelay');
      expect(options).toHaveProperty('sparge', 'batch');
      expect(options).toHaveProperty('spargeLitres', 20);
      expect(options).toHaveProperty('sim');
    });

    test('should apply speedup factor when simulating', () => {
      const options = brewdata.defaultOptions();
      
      // When simulating, times should be divided by speedup factor
      expect(options.sim.simulate).toBe(true);
      expect(options.sim.speedupFactor).toBe(10);
      
      // Verify that values are reduced due to simulation speedup
      expect(options.flowTimeoutSecs).toBeLessThan(2); // Original 2 / 10
      expect(options.boilMins).toBeLessThan(90); // Original 90 / 10
      expect(options.whirlpoolMins).toBeLessThan(5); // Original 5 / 10
    });

    test('should include simulation options object', () => {
      const options = brewdata.defaultOptions();
      
      expect(options.sim).toBeDefined();
      expect(options.sim).toHaveProperty('simulate');
      expect(options.sim).toHaveProperty('speedupFactor');
      expect(options.sim).toHaveProperty('ambientTemp', 10);
      expect(options.sim).toHaveProperty('resetLog', true);
    });
  });

  describe('getBrewfatherOptions', () => {
    test('should fetch and process brewfather recipe', async () => {
      const mockRecipe = {
        name: 'Test IPA',
        data: {
          mashWaterAmount: 30,
          strikeTemp: 68,
          spargeWaterAmount: 20,
          hltWaterAmount: 25
        },
        mash: {
          steps: [
            { tempC: 65, mins: 60 },
            { tempC: 72, mins: 15 }
          ]
        },
        boilTime: 90,
        fermentation: {
          steps: [
            { tempC: 18, mins: 7200 }
          ]
        },
        equipment: {
          whirlpoolTime: 10
        }
      };

      brewfatherService.currentRecipe.mockResolvedValue(mockRecipe);

      const options = await brewdata.getBrewfatherOptions(5);

      expect(options).toHaveProperty('brewname', 'Test IPA');
      expect(options).toHaveProperty('strikeLitres', 30);
      expect(options).toHaveProperty('strikeTemp', 68);
      expect(options).toHaveProperty('sparge', true);
      expect(options).toHaveProperty('spargeLitres', 25);
      expect(options).toHaveProperty('mashMins', 15); // (60 + 15) / 5 speedup factor = 15
      expect(options).toHaveProperty('boilMins');
      expect(options).toHaveProperty('fermentTempC', 18);
      expect(options).toHaveProperty('fermentDays', 1440); // 7200 / 5 speedup factor = 1440
      expect(options).toHaveProperty('whirlpoolMins');
    });

    test('should handle recipe with no sparge water', async () => {
      const mockRecipe = {
        name: 'BIAB Beer',
        data: {
          mashWaterAmount: 35,
          strikeTemp: 70,
          spargeWaterAmount: 0,
          hltWaterAmount: 0
        },
        mash: {
          steps: [{ tempC: 67, mins: 90 }]
        },
        boilTime: 60,
        fermentation: {
          steps: [{ tempC: 20, mins: 10080 }]
        },
        equipment: {
          whirlpoolTime: 15
        }
      };

      brewfatherService.currentRecipe.mockResolvedValue(mockRecipe);

      const options = await brewdata.getBrewfatherOptions(1);

      expect(options.sparge).toBe(false);
      expect(options.spargeLitres).toBe(0);
    });

    test('should apply speedup factor to all time values when simulating', async () => {
      const mockRecipe = {
        name: 'Fast Test',
        data: {
          mashWaterAmount: 20,
          strikeTemp: 65,
          spargeWaterAmount: 15,
          hltWaterAmount: 18
        },
        mash: {
          steps: [{ tempC: 65, mins: 60 }]
        },
        boilTime: 90,
        fermentation: {
          steps: [{ tempC: 18, mins: 7200 }]
        },
        equipment: {
          whirlpoolTime: 10
        }
      };

      brewfatherService.currentRecipe.mockResolvedValue(mockRecipe);

      const speedupFactor = 10;
      const options = await brewdata.getBrewfatherOptions(speedupFactor);

      // Verify speedup is applied when simulating
      if (options.sim.simulate) {
        expect(options.boilMins).toBe(90 / speedupFactor);
        expect(options.mashMins).toBe(60 / speedupFactor);
        expect(options.whirlpoolMins).toBe(10 / speedupFactor);
        expect(options.fermentDays).toBe(7200 / speedupFactor);
        expect(options.flowTimeoutSecs).toBe(2 / speedupFactor);
        expect(options.mashSteps[0].mins).toBe(60 / speedupFactor);
      }
    });

    test('should map mash steps correctly', async () => {
      const mockRecipe = {
        name: 'Multi Step Mash',
        data: {
          mashWaterAmount: 25,
          strikeTemp: 68,
          spargeWaterAmount: 10,
          hltWaterAmount: 15
        },
        mash: {
          steps: [
            { tempC: 62, mins: 30 },
            { tempC: 68, mins: 45 },
            { tempC: 75, mins: 10 }
          ]
        },
        boilTime: 75,
        fermentation: {
          steps: [{ tempC: 19, mins: 5760 }]
        },
        equipment: {
          whirlpoolTime: 5
        }
      };

      brewfatherService.currentRecipe.mockResolvedValue(mockRecipe);

      const options = await brewdata.getBrewfatherOptions(1);

      expect(options.mashSteps).toHaveLength(3);
      expect(options.mashSteps[0]).toEqual({ mins: 30, temp: 62 });
      expect(options.mashSteps[1]).toEqual({ mins: 45, temp: 68 });
      expect(options.mashSteps[2]).toEqual({ mins: 10, temp: 75 });
      expect(options.mashTempC).toBe(62); // First step temperature
    });

    test('should handle fermentation steps array', async () => {
      const mockRecipe = {
        name: 'Complex Fermentation',
        data: {
          mashWaterAmount: 30,
          strikeTemp: 68,
          spargeWaterAmount: 20,
          hltWaterAmount: 25
        },
        mash: {
          steps: [{ tempC: 65, mins: 60 }]
        },
        boilTime: 90,
        fermentation: {
          steps: [
            { tempC: 18, mins: 4320 },
            { tempC: 2, mins: 2880 }
          ]
        },
        equipment: {
          whirlpoolTime: 10
        }
      };

      brewfatherService.currentRecipe.mockResolvedValue(mockRecipe);

      const options = await brewdata.getBrewfatherOptions(1);

      expect(options.fermentSteps).toHaveLength(2);
      expect(options.fermentTempC).toBe(18); // First fermentation step temp
      expect(options.fermentDays).toBe(4320); // First fermentation step duration
    });
  });

  describe('module structure', () => {
    test('should export required functions', () => {
      expect(typeof brewdata.getBrewfatherOptions).toBe('function');
      expect(typeof brewdata.defaultOptions).toBe('function');
    });

    test('should handle async operations', async () => {
      brewfatherService.currentRecipe.mockResolvedValue({
        name: 'Async Test',
        data: { mashWaterAmount: 20, strikeTemp: 65, spargeWaterAmount: 0, hltWaterAmount: 0 },
        mash: { steps: [{ tempC: 65, mins: 60 }] },
        boilTime: 60,
        fermentation: { steps: [{ tempC: 18, mins: 7200 }] },
        equipment: { whirlpoolTime: 5 }
      });

      await expect(brewdata.getBrewfatherOptions(1)).resolves.toBeDefined();
    });
  });
});
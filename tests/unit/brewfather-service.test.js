const brewfatherService = require('../../src/services/brewfather-service.js');

// Mock dependencies
jest.mock('axios');
jest.mock('../../controllers/brewfather-stream.js', () => ({
  post: jest.fn(() => Promise.resolve({ success: true }))
}));

jest.mock('../../src/brewstack/common/brewlog.js', () => ({
  info: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  debug: jest.fn()
}));

jest.mock('../../src/services/temp-service.js', () => ({
  getTemp: jest.fn((sensor) => {
    const temps = {
      'Temp Fermenter': 18.5,
      'Temp Glycol': 2.0,
      'Temp Ambient': 22.0
    };
    return Promise.resolve(temps[sensor] || 20.0);
  })
}));

jest.mock('../../src/services/mysql-service.js', () => ({
  getBrewname: jest.fn(() => 'Test IPA'),
  getSession: jest.fn(() => 'test-session')
}));

const { post } = require('../../controllers/brewfather-stream.js');
const axios = require('axios');
const therm = require('../../src/services/temp-service.js');
const mysqlService = require('../../src/services/mysql-service.js');
const brewlog = require('../../src/brewstack/common/brewlog.js');

describe('Brewfather Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.BREWFATHER_STREAM_NAME = 'TestBrewnode';
    process.env.BREWFATHER_USERNAME = 'testuser';
    process.env.BREWFATHER_PASSWORD = 'testpass';
  });

  describe('getFermenterTemp', () => {
    test('should get fermenter temperature and log to Brewfather', async () => {
      await brewfatherService.getFermenterTemp();

      expect(therm.getTemp).toHaveBeenCalledWith('Temp Fermenter');
      expect(therm.getTemp).toHaveBeenCalledWith('Temp Glycol');
      expect(therm.getTemp).toHaveBeenCalledWith('Temp Ambient');
      expect(post).toHaveBeenCalled();
    });

    test('should handle temperature reading errors', async () => {
      therm.getTemp.mockRejectedValueOnce(new Error('Sensor error'));

      await expect(brewfatherService.getFermenterTemp()).rejects.toThrow('Sensor error');
    });
  });

  describe('logTemps', () => {
    test('should format and post temperature data correctly', async () => {
      const fermenter = 18.5;
      const ambient = 22.0;
      const glycol = 2.0;

      await brewfatherService.logTemps(fermenter, ambient, glycol);

      expect(mysqlService.getBrewname).toHaveBeenCalled();
      expect(post).toHaveBeenCalledWith(
        expect.stringContaining('"temp":18.5')
      );
      expect(post).toHaveBeenCalledWith(
        expect.stringContaining('"aux_temp":2')
      );
      expect(post).toHaveBeenCalledWith(
        expect.stringContaining('"ext_temp":22')
      );
    });

    test('should include brew name in data', async () => {
      mysqlService.getBrewname.mockReturnValue('Custom Brew Name');
      
      await brewfatherService.logTemps(20, 23, 3);

      const postedData = post.mock.calls[0][0];
      const parsedData = JSON.parse(postedData);
      
      expect(parsedData.beer).toBe('Custom Brew Name');
    });

    test('should include correct stream name', async () => {
      await brewfatherService.logTemps(20, 23, 3);

      const postedData = post.mock.calls[0][0];
      const parsedData = JSON.parse(postedData);
      
      expect(parsedData.name).toBe('TestBrewnode');
    });
  });

  describe('start', () => {
    beforeEach(() => {
      jest.useFakeTimers();
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    test('should start temperature logging interval', () => {
      const intervalMinutes = 5;
      jest.spyOn(global, 'setInterval');
      
      brewfatherService.start(intervalMinutes);
      
      expect(setInterval).toHaveBeenCalledWith(
        expect.any(Function),
        intervalMinutes * 60 * 1000
      );
    });

    test('should clear existing interval before starting new one', () => {
      jest.spyOn(global, 'setInterval');
      jest.spyOn(global, 'clearInterval');
      
      brewfatherService.start(5);
      brewfatherService.start(10);
      
      expect(clearInterval).toHaveBeenCalled();
      expect(setInterval).toHaveBeenCalledTimes(2);
    });

    test('should call getFermenterTemp on interval', () => {
      // Since getFermenterTemp is an internal function, let's spy on the dependencies it uses
      const tempServiceSpy = jest.spyOn(therm, 'getTemp').mockResolvedValue(20.5);
      
      brewfatherService.start(1);
      jest.advanceTimersByTime(60000); // 1 minute
      
      // Verify that temp service was called (indicating getFermenterTemp ran)
      expect(tempServiceSpy).toHaveBeenCalled();
    });
  });

  describe('stop', () => {
    beforeEach(() => {
      jest.useFakeTimers();
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    test('should stop temperature logging', () => {
      jest.spyOn(global, 'clearInterval');
      
      brewfatherService.start(5);
      brewfatherService.stop();
      
      expect(clearInterval).toHaveBeenCalled();
    });

    test('should log stop message', () => {
      brewfatherService.stop();
      
      expect(brewlog.warn).toHaveBeenCalledWith(
        "brewfather-service",
        "Stop"
      );
    });
  });

  describe('error handling', () => {
    test('should handle Brewfather API errors gracefully', async () => {
      post.mockRejectedValueOnce(new Error('API Error'));

      await expect(brewfatherService.logTemps(20, 22, 3)).rejects.toThrow('API Error');
      expect(post).toHaveBeenCalled();
    });

    test('should handle missing environment variables', async () => {
      delete process.env.BREWFATHER_STREAM_NAME;
      
      await brewfatherService.logTemps(20, 22, 3);
      
      const postedData = post.mock.calls[0][0];
      const parsedData = JSON.parse(postedData);
      
      expect(parsedData.name).toBeUndefined();
    });
  });

  describe('currentRecipe', () => {
    const mockBrewingBatch = {
      batchNo: 42,
      recipe: {
        name: 'Test IPA',
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
          steps: [{ tempC: 18, mins: 7200 }]
        },
        equipment: {
          whirlpoolTime: 10
        }
      }
    };

    test('should return recipe from batch with Brewing status', async () => {
      axios.get.mockResolvedValueOnce({ data: [mockBrewingBatch] });

      const recipe = await brewfatherService.currentRecipe();

      expect(recipe.name).toBe('Test IPA-42');
      expect(recipe.data.mashWaterAmount).toBe(30);
      expect(axios.get).toHaveBeenCalledWith(
        'https://api.brewfather.app/v2/batches',
        expect.objectContaining({
          params: { complete: true, status: 'Brewing' }
        })
      );
    });

    test('should fall back to Fermenting status if no Brewing batches', async () => {
      const mockFermentingBatch = {
        batchNo: 43,
        recipe: {
          name: 'Fermenting Stout',
          data: { mashWaterAmount: 25 }
        }
      };

      axios.get
        .mockResolvedValueOnce({ data: [] }) // No brewing batches
        .mockResolvedValueOnce({ data: [mockFermentingBatch] }); // Fermenting batch

      const recipe = await brewfatherService.currentRecipe();

      expect(recipe.name).toBe('Fermenting Stout-43');
      expect(axios.get).toHaveBeenCalledTimes(2);
      expect(axios.get).toHaveBeenLastCalledWith(
        'https://api.brewfather.app/v2/batches',
        expect.objectContaining({
          params: { complete: true, status: 'Fermenting' }
        })
      );
    });

    test('should throw error if no brews in progress', async () => {
      axios.get
        .mockResolvedValueOnce({ data: [] }) // No brewing batches
        .mockResolvedValueOnce({ data: [] }); // No fermenting batches

      await expect(brewfatherService.currentRecipe()).rejects.toThrow('No brews in progress!');
    });

    test('should throw error if multiple brews in progress', async () => {
      axios.get.mockResolvedValueOnce({ data: [mockBrewingBatch, mockBrewingBatch] });

      await expect(brewfatherService.currentRecipe()).rejects.toThrow('Multiple brews in progress!');
    });

    test('should use environment credentials for authentication', async () => {
      axios.get.mockResolvedValueOnce({ data: [mockBrewingBatch] });

      await brewfatherService.currentRecipe();

      expect(axios.get).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          auth: {
            username: 'testuser',
            password: 'testpass'
          }
        })
      );
    });
  });
});

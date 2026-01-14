const brewfatherService = require('../../src/services/brewfather-service.js');

// Mock dependencies
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
      'Temp UniTank': 18.5,
      'Temp SS': 22.0,
      'Temp Glycol': 2.0
    };
    return Promise.resolve(temps[sensor] || 20.0);
  }),
  getActiveFermenter: jest.fn(() => 'UNI')
}));

jest.mock('../../src/services/mysql-service.js', () => ({
  getBrewname: jest.fn(() => 'Test IPA'),
  getSession: jest.fn(() => 'test-session')
}));

const { post } = require('../../controllers/brewfather-stream.js');
const therm = require('../../src/services/temp-service.js');
const mysqlService = require('../../src/services/mysql-service.js');
const brewlog = require('../../src/brewstack/common/brewlog.js');

describe('Brewfather Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.BREWFATHER_STREAM_NAME = 'TestBrewnode';
  });

  describe('getFermenterTemp', () => {
    test('should get fermenter temperature and log to Brewfather', async () => {
      await brewfatherService.getFermenterTemp();

      expect(therm.getActiveFermenter).toHaveBeenCalled();
      expect(therm.getTemp).toHaveBeenCalledWith('Temp UniTank');
      expect(therm.getTemp).toHaveBeenCalledWith('Temp Glycol');
      expect(therm.getTemp).toHaveBeenCalledWith('Temp SS');
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
});

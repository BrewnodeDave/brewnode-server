/**
 * Tests for brewdefs.js - Raspberry Pi detection and configuration
 */

const fs = require('fs');
const brewdefs = require('../../src/brewstack/common/brewdefs.js');

describe('brewdefs - Raspberry Pi Detection', () => {
  describe('isRaspPi()', () => {
    test('should return false on non-Pi Linux systems (like Debian bookworm)', () => {
      // This test runs on the current system, which should NOT be detected as a Pi
      const result = brewdefs.isRaspPi();
      
      // Verify detection logic
      const cpuInfo = fs.readFileSync('/proc/cpuinfo', 'utf8');
      const hasPiCpu = cpuInfo.includes('Raspberry Pi') || cpuInfo.includes('BCM');
      
      // If the CPU doesn't have Pi hardware, isRaspPi should return false
      if (!hasPiCpu) {
        expect(result).toBe(false);
      } else {
        // If it does have Pi hardware, it should return true
        expect(result).toBe(true);
      }
    });

    test('should not falsely detect Debian bookworm as Raspberry Pi', () => {
      // The old implementation had a bug where it would check for 'bookworm' in os-release
      // which would match regular Debian 12 systems, not just Raspberry Pi OS
      const osRelease = fs.readFileSync('/etc/os-release', 'utf8');
      
      if (osRelease.includes('bookworm') && !osRelease.includes('Raspberry Pi') && !osRelease.includes('Raspbian')) {
        // This is a regular Debian bookworm system, NOT a Pi
        expect(brewdefs.isRaspPi()).toBe(false);
      }
    });

    test('should prioritize CPU hardware detection over OS release codename', () => {
      // The new implementation checks /proc/cpuinfo FIRST
      // This prevents false positives on regular Debian systems with Pi codenames
      const cpuInfo = fs.readFileSync('/proc/cpuinfo', 'utf8');
      const hasPiCpu = cpuInfo.includes('Raspberry Pi') || cpuInfo.includes('BCM');
      const result = brewdefs.isRaspPi();
      
      // Result should match CPU hardware detection
      expect(result).toBe(hasPiCpu);
    });
  });

  describe('module exports', () => {
    test('should export isLinux property', () => {
      expect(typeof brewdefs.isLinux).toBe('boolean');
    });

    test('should export isRaspPi function', () => {
      expect(typeof brewdefs.isRaspPi).toBe('function');
    });

    test('should export brewing constants', () => {
      expect(typeof brewdefs.WATER_TO_GRIST).toBe('number');
      expect(typeof brewdefs.PIPE_LOSSES).toBe('number');
      expect(typeof brewdefs.TRUB_LOSSES).toBe('number');
      expect(typeof brewdefs.MASHTUN_LOSSES).toBe('number');
      expect(typeof brewdefs.EVAP_RATE_L_PER_HOUR).toBe('number');
    });
  });
});

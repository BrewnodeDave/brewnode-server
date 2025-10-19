# 🔧 BrewNode Server Hardware Requirements

[![Platform](https://img.shields.io/badge/Platform-Raspberry%20Pi-red.svg)](https://www.raspberrypi.org/)
[![Power](https://img.shields.io/badge/Power-240V%20%7C%2012V%20%7C%205V-orange.svg)](#power-requirements)
[!**Cable & Wiring Requirements**
**Power Cables:**
- **240V Kettle Heater:** 12 AWG THWN, 15A rating
- **240V Cooling Fan:** 12 AWG THWN, 6A rating  
- **240V Glycol Heater:** 14 AWG THWN, 1A rating
- **12V Equipment:** 14 AWG control cable, shielded (pumps + valves)](https://img.shields.io/badge/I2C-32%20Channels-blue.svg)](#i2c-expansion)

**Complete hardware specification for brewery automation with BrewNode Server**

## 📋 System Overview

The BrewNode Server requires specific hardware components for complete brewery automation. The system is designed around a Raspberry Pi with custom I2C expansion boards and industrial brewery equipment interfaces.

## 🖥️ Core Computing Platform

### Primary Controller: Raspberry Pi
**Minimum Requirements:**
- **Model:** Raspberry Pi 4B (4GB RAM recommended)
- **OS:** Raspberry Pi OS (Debian-based) 64-bit
- **Node.js:** Version 18.20.5 or higher
- **Storage:** 32GB+ microSD card (Class 10 or better)
- **Network:** Ethernet connection recommended for reliability

**Recommended Specifications:**
- **Model:** Raspberry Pi 4B (8GB RAM)
- **Storage:** 64GB+ high-endurance microSD card
- **Cooling:** Active cooling solution (fan + heatsinks)
- **Power Supply:** Official Raspberry Pi 15.3W USB-C Power Supply

### Development/Testing Alternative
- **Any x64/ARM system** running Linux, macOS, or Windows
- **Node.js 18.20.5+** with hardware simulation mode
- **4GB+ RAM** for development workloads

## 🔌 GPIO & Communication Interfaces

### I2C Bus Expansion
**Primary Communication Interface**

**Physical Connections:**
- **Pin 3 (GPIO 2):** SDA (I2C Data)  
- **Pin 5 (GPIO 3):** SCL (I2C Clock)
- **Bus Speed:** 100kHz standard mode
- **Pull-up Resistors:** 4.7kΩ on SDA/SCL lines

**Required I2C Expansion Boards:**
- **2x MCP23017** I2C GPIO expanders
  - **Primary:** Address 0x20 (bits 0-15)
  - **Secondary:** Address 0x21 (bits 16-31)
  - **Total Capacity:** 32 digital I/O channels
  - **Logic Level:** 5V tolerant
  - **Current:** 25mA per pin maximum

### OneWire Temperature Bus
**Temperature Sensing Network**

**Physical Connections:**
- **Pin 7 (GPIO 4):** OneWire DQ (Data)
- **Pin 1:** 3.3V Power
- **Pin 6:** Ground
- **Pull-up:** 4.7kΩ resistor from DQ to 3.3V

**Supported Sensors:**
- **DS18B20** - Primary temperature sensor
- **DS1820/DS1822/DS18S20** - Extended sensor family support

### Additional GPIO Requirements
**Direct Raspberry Pi GPIO connections for valve position feedback:**

| GPIO Pin | BCM# | Function | Purpose |
|----------|------|----------|---------|
| Pin 7 | GPIO 4 | OneWire | Temperature sensors |
| Pin 11 | GPIO 17 | Input | Valve 6 opened |
| Pin 12 | GPIO 18 | Input | Valve 4 opened |
| Pin 13 | GPIO 27 | Input | Valve 5 closed |
| Pin 15 | GPIO 22 | Input | Valve 3 closed |
| Pin 16 | GPIO 23 | Input | Valve 4 closed |
| Pin 18 | GPIO 24 | Input | ADC data |
| Pin 19 | GPIO 10 | Input | Valve 7 opened |
| Pin 21 | GPIO 9 | Input | Valve 7 closed |
| Pin 22 | GPIO 25 | Input | Valve 3 opened |
| Pin 24 | GPIO 8 | Input | ADC clock |
| Pin 32 | GPIO 12 | Input | Valve 6 closed |
| Pin 33 | GPIO 13 | Input | Valve 2 closed |
| Pin 35 | GPIO 19 | Input | Valve 1 closed |
| Pin 36 | GPIO 16 | Input | Valve 2 opened |
| Pin 37 | GPIO 26 | Input | Valve 1 opened |
| Pin 38 | GPIO 20 | Input | Valve 0 opened |
| Pin 40 | GPIO 21 | Input | Valve 0 closed |

## ⚡ Power Requirements

### System Power Budget

#### Computing & Control Electronics
- **Raspberry Pi 4B:** 15W maximum (5V @ 3A)
- **MCP23017 I2C Expanders:** 2 × 1W (5V @ 200mA each)
- **Temperature Sensors:** 8 × 0.05W (3.3V @ 15mA each)
- **Control Electronics Subtotal:** ~17W

#### Brewery Equipment Loads
**High Power Devices (240V AC):**
- **Kettle Heating Element:** 3000W (240V @ 12.5A)
  - Primary wort boiling and mash heating
  - PWM controlled via solid-state relay
- **Cooling Fan:** 1000W (240V @ 4.2A)
  - Cooling system ventilation
  - I2C controlled switching
- **Glycol Heater:** 120W (240V @ 0.5A)
  - Glycol temperature control
  - I2C controlled switching

**Medium Power Devices (12V DC):**
- **Pumps:** 4 × 18W = 72W (12V @ 6A total)
  - Glycol circulation pump
  - Kettle transfer pump  
  - Mash recirculation pump
  - Fermenter transfer pump
- **Motorized Valves:** 4 × 20W = 80W (12V @ 6.7A total)
  - Fermenter valve
  - Chill wort valve
  - Mash input valve  
  - 3-way control valves

**Low Power Devices (5V DC):**
- **Status LEDs & Indicators:** 8 × 0.1W = 0.8W
- **Control Relays:** 8 × 0.5W = 4W

### Total Power Requirements
- **240V AC Circuit:** 4120W (kettle + fan + glycol heater - requires dedicated 20A breaker)
- **12V DC Supply:** 152W minimum (200W recommended for pumps + valves)  
- **5V DC Supply:** 25W (Raspberry Pi power + electronics)

### Recommended Power Infrastructure
**240V AC (Mains Power):**
- Dedicated 15A circuit breaker for kettle heater
- Industrial-grade solid-state relay (SSR) rated 25A minimum
- EMI filtering for PWM switching

**12V DC Power Supply:**
- **Industrial switching PSU:** 200W, 12V DC output
- **Regulation:** ±1% load/line regulation  
- **Protection:** Over-current, over-voltage, thermal protection
- **Efficiency:** 85%+ efficiency rating
- **Current Capacity:** 15A minimum (pumps + valves only)

**5V DC Power:**
- **Raspberry Pi:** Official 15.3W USB-C power adapter
- **I2C Electronics:** Separate regulated 5V rail, 2A capacity

## 🌡️ Temperature Sensing System

### DS18B20 Digital Temperature Sensors
**Primary Temperature Monitoring**

**Specifications:**
- **Accuracy:** ±0.5°C (-10°C to +85°C)
- **Resolution:** 9-12 bit configurable (0.0625°C max)
- **Range:** -55°C to +125°C operating
- **Interface:** OneWire digital protocol
- **Power:** 3.3V (parasitic or external power)
- **Response Time:** 750ms (12-bit conversion)

**Required Sensors (Minimum):**
- **Mash Temperature:** Stainless steel probe
- **Boil Temperature:** High-temperature probe  
- **Fermentation Temperature:** Thermowell probe
- **Glycol Supply Temperature:** Pipe-mount sensor
- **Glycol Return Temperature:** Pipe-mount sensor
- **Ambient Temperature:** Environment monitoring

**Sensor Installation:**
- **Stainless steel probe construction** for food-grade applications
- **Thermowell fittings** for pressure vessel integration
- **CAT6 cable** for sensor wiring (up to 100m runs)
- **Junction boxes** for sensor network distribution

## 🔧 Brewery Equipment Interface

### Pump Control System
**4x Industrial Pumps (12V DC)**

**Specifications per Pump:**
- **Voltage:** 12V DC
- **Current:** 1.5A maximum
- **Power:** 18W typical
- **Control:** I2C via MCP23017 GPIO expander
- **Protection:** Overcurrent and thermal protection

**Pump Assignments:**
- **Glycol Pump (I2C Bit 0):** Cooling system circulation
- **Fermenter Pump (I2C Bit 7):** Transfer to/from fermenters  
- **Kettle Pump (I2C Bit 8):** Wort transfer and circulation
- **Mash Pump (I2C Bit 9):** Mash recirculation

### Valve Control System
**4x Motorized Ball Valves (12V DC)**

**Specifications per Valve:**
- **Voltage:** 12V DC
- **Current:** 1.7A maximum (during actuation)
- **Power:** 20W typical (40W peak)
- **Actuation Time:** 5-15 seconds full travel
- **Position Feedback:** End-of-travel limit switches
- **Control:** I2C output + GPIO position feedback

**Valve Assignments:**
- **Fermenter Valve (I2C Bit 1):** Chiller wort output control
- **Chill Wort Valve (I2C Bit 2):** Chiller wort input control  
- **Kettle Valve (I2C Bit 5):** Kettle input flow control
- **Mash In Valve (I2C Bit 6):** Mash input flow control

### Heating System
**Electric Heating Elements**

**Kettle Heater (Primary):**
- **Power:** 3000W (240V AC)
- **Control:** PWM via solid-state relay
- **Element:** Immersion or jacket-mount
- **Safety:** Thermal cutoff switch
- **I2C Control:** Bit 17

**Glycol Heater (Secondary):**
- **Power:** 120W (240V AC)  
- **Control:** On/off via I2C
- **Application:** Glycol temperature adjustment
- **I2C Control:** Bit 11

### Cooling System
**Glycol Cooling Infrastructure**

**Cooling Fan:**
- **Power:** 1000W (240V AC)
- **Type:** Industrial cooling fan
- **Control:** On/off switching via I2C
- **I2C Control:** Bit 10

**Glycol System:**
- **Chiller Unit:** External glycol chiller (customer provided)
- **Heat Exchanger:** Plate heat exchanger for wort cooling
- **Glycol Lines:** Insulated glycol supply/return lines
- **Pump Integration:** Via BrewNode glycol pump control

## 🔌 Electrical Installation Requirements

### Safety & Code Compliance
- **Electrical Code:** Compliance with local electrical codes
- **GFCI Protection:** Required for all 240V circuits
- **Grounding:** Proper equipment grounding throughout
- **Enclosures:** NEMA-rated enclosures for control electronics

### Control Panel Layout
**Recommended Control Enclosure:**
- **Size:** 24" × 36" × 8" minimum
- **Rating:** NEMA 4X (stainless steel, IP66)
- **Components:**
  - Raspberry Pi in DIN rail mount enclosure
  - I2C expansion boards on DIN rail
  - 400W 12V power supply (DIN rail mount) for all equipment
  - Circuit breakers and fusing
  - Terminal blocks for field wiring
  - Cooling fan and ventilation

### Cable & Wiring Requirements
**Power Cables:**
- **240V Kettle Heater:** 12 AWG THWN, 20A rating
- **24V Equipment:** 16 AWG control cable, shielded

**Signal Cables:**
- **Temperature Sensors:** CAT6 network cable
- **I2C Communications:** Shielded twisted pair
- **GPIO Signals:** Multi-conductor control cable

## 🛠️ Optional Equipment

### Advanced Monitoring
- **Flow Meters:** Turbine flow sensors (currently disabled in software)
- **Pressure Sensors:** Analog pressure transducers
- **pH Sensors:** Digital pH monitoring (future expansion)

### Network Infrastructure  
- **Ethernet Switch:** For reliable network connectivity
- **WiFi Access Point:** For mobile device access
- **Network Storage:** For data logging and backup

### Development Tools
- **Logic Analyzer:** For I2C bus debugging
- **Digital Multimeter:** For voltage/current verification
- **Oscilloscope:** For signal analysis and troubleshooting

## 📦 Procurement Summary

### Essential Components (Phase 1)
1. **Raspberry Pi 4B (8GB)** + accessories
2. **2x MCP23017 I2C GPIO expanders**
3. **6x DS18B20 temperature sensors** with probes
4. **200W 12V industrial power supply** (pumps + valves)
5. **3000W heating element** + SSR control
6. **1000W 240V cooling fan** + relay control
7. **120W 240V glycol heater** + relay control
8. **4x 12V pumps** (18W each)
9. **4x 12V motorized valves** (20W each)
8. **Control enclosure** (NEMA 4X stainless)
9. **Electrical components** (breakers, terminals, wiring)

### Expansion Components (Phase 2)
1. **Flow monitoring sensors**
2. **Advanced glycol chiller integration**
3. **Remote monitoring hardware**
4. **Backup/redundancy systems**

### Estimated Budget Range
- **Phase 1 (Core System):** $2,500 - $4,000 USD
- **Phase 2 (Advanced Features):** $1,000 - $2,000 USD
- **Professional Installation:** $1,500 - $3,000 USD

---

**⚠️ Safety Note:** This system involves high-voltage electricity and industrial equipment. Professional installation by qualified electricians and system integrators is strongly recommended to ensure code compliance and safe operation.
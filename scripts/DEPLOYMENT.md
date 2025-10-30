# BrewNode Server - Pi Deployment Guide

## Problem: modprobe Command Not Found

The error `modprobe: not found` occurs when the Node.js I2C libraries (`raspi` and `raspi-i2c`) try to load kernel modules but `modprobe` is not available in the systemd service environment.

## Solution Options

### Option 1: Use the Brewery Service Script (Recommended)

Use the provided startup script that handles I2C module loading:

```bash
# Update your systemd service to use the new script
sudo cp scripts/brewnode-server.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl restart brewnode-server
```

The script will:
- ✅ Load I2C modules (`i2c-dev`, `i2c-bcm2835`) before Node.js starts
- ✅ Load OneWire modules (`w1-gpio`, `w1-therm`) for temperature sensors
- ✅ Validate hardware availability
- ✅ Start Node.js with proper environment

### Option 2: Pre-load Modules Manually

Load the I2C modules manually before starting the service:

```bash
# Load I2C modules
sudo modprobe i2c-dev
sudo modprobe i2c-bcm2835

# Load OneWire modules  
sudo modprobe w1-gpio
sudo modprobe w1-therm

# Then start the service
sudo systemctl start brewnode-server
```

### Option 3: Auto-load Modules at Boot

Add modules to `/etc/modules` to load automatically:

```bash
echo 'i2c-dev' | sudo tee -a /etc/modules
echo 'i2c-bcm2835' | sudo tee -a /etc/modules  
echo 'w1-gpio' | sudo tee -a /etc/modules
echo 'w1-therm' | sudo tee -a /etc/modules
```

### Option 4: Skip Hardware Validation (Not Recommended)

For testing only - bypass hardware validation:

```bash
# Set environment variable to skip validation
sudo systemctl edit brewnode-server
```

Add:
```ini
[Service]
Environment=SKIP_HARDWARE_TESTS=true
```

## Systemd Service Configuration

The recommended systemd service configuration:

```ini
[Unit]
Description=BrewNode Server - Raspberry Pi Brewery Automation
After=network.target

[Service]
Type=simple
User=dave
Group=gpio
WorkingDirectory=/home/dave/git/brewnode-server
Environment=NODE_ENV=production
Environment=PATH=/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin

# Use startup script that handles module loading
ExecStart=/home/dave/git/brewnode-server/scripts/start-brewery-service.sh

Restart=always
RestartSec=10

# Required for I2C/GPIO access
AmbientCapabilities=CAP_SYS_ADMIN

[Install]
WantedBy=multi-user.target
```

## Verification

After implementing the solution, check that the service starts successfully:

```bash
sudo systemctl status brewnode-server
journalctl -u brewnode-server -f
```

Expected output:
```
🔧 BrewNode Server - Initializing hardware environment...
📋 Raspberry Pi detected
✅ I2C modules already loaded
✅ I2C device /dev/i2c-1 available
✅ OneWire modules already loaded
🚀 Starting BrewNode Server...
🔧 Running Pi hardware validation before server startup...
✅ Pi hardware validation passed in 23ms - server startup approved
🎉 Server started successfully
```

## Troubleshooting

If issues persist:

1. **Check module loading**: `lsmod | grep i2c`
2. **Check I2C devices**: `ls -la /dev/i2c*`  
3. **Check permissions**: User must be in `gpio` group
4. **Check Pi config**: Ensure I2C is enabled in `raspi-config`
5. **Check OneWire**: Ensure `dtoverlay=w1-gpio` in `/boot/config.txt`

The solution ensures reliable startup of brewery operations with proper hardware initialization! 🍺
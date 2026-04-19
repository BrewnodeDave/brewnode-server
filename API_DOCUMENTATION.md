# API Specification Documentation

## Overview
The `api.yaml` file contains the complete OpenAPI 3.0 specification for the BrewNode server API. This 2,188-line specification defines all REST endpoints, request/response schemas, and authentication requirements.

## API Structure

### Base Information
- **Version:** 2.0.0
- **Title:** Brewnode Server
- **Specification:** OpenAPI 3.0.1
- **Base URL:** `http://localhost:8080` (development)

### Authentication Methods
1. **API Key Authentication**
   - Header: `api_key`
   - Used for Brewfather integration
2. **Basic Authentication**
   - Username/Password for Brewfather API access
3. **No Authentication**
   - Public endpoints for basic system information

## Core Endpoint Categories

### 🍺 BrewNode Native Endpoints

#### Database Operations
```yaml
/mysql/brewnames:
  get:
    summary: Get all brewnames in mysql database
    operationId: mysqlBrewnames
    controller: mysql
```

#### Brew Data Management
```yaml
/brewdata:
  get:
    summary: Fetch all data for particular brew
    parameters:
      - name: brewname (required)
      - name: since (optional, ISO 8601 date)
    controller: brewnode
```

#### Brewing Process Control
```yaml
/brewing:
  get:
    summary: Get current brewing status
    security: [api_key]
    controller: brewnode
```

### 🔗 Brewfather API Proxy Endpoints

The API proxies the complete Brewfather v2 API, providing seamless integration:

#### Batch Management
- `GET /batches` - List all batches
- `GET /batches/{id}` - Get specific batch
- `POST /batches` - Create new batch
- `PUT /batches/{id}` - Update batch
- `DELETE /batches/{id}` - Delete batch

#### Recipe Operations
- `GET /recipes` - List recipes
- `GET /recipes/{id}` - Get recipe details
- `POST /recipes` - Create recipe
- `PUT /recipes/{id}` - Update recipe

#### Ingredient Management
- `GET /fermentables` - List fermentables
- `GET /hops` - List hop varieties
- `GET /yeasts` - List yeast strains
- `GET /miscs` - List miscellaneous ingredients

#### Real-Time Streaming
- `POST /stream` - Send telemetry data to Brewfather
- WebSocket integration for live updates

### 🔌 Hardware Control Endpoints

#### I2C Device Control
```yaml
/i2c:
  put:
    summary: Set I2C pin state
    operationId: i2cSet
    parameters:
      - name: bit
        in: query
        description: I2C bit number (0-31)
        required: true
        schema:
          type: integer
          minimum: 0
          maximum: 31
          example: 8
      - name: value
        in: query
        description: Pin state (0=off, 1=on)
        required: true
        schema:
          type: integer
          minimum: 0
          maximum: 1
          example: 1
    responses:
      200:
        description: Success - returns hex value of I2C state
        content:
          application/json:
            schema:
              type: object
              properties:
                result: 
                  type: string
                  example: "0x00000100"
```

**I2C Device Bit Mapping:**
- **Bit 0:** Glycol Pump
- **Bit 1:** Fermenter Valve In
- **Bit 2:** Chill Wort Valve In
- **Bit 3:** Switch 4 (General Purpose)
- **Bit 4:** Switch 5 (General Purpose)
- **Bit 5:** Kettle Valve In
- **Bit 6:** Mash In Valve
- **Bit 7:** Fermenter Pump
- **Bit 8:** Kettle Pump
- **Bit 9:** Mash Pump
- **Bit 10:** Fan
- **Bit 11:** Glycol Heater
- **Bit 12:** Relay 4
- **Bit 13:** Glycol Power
- **Bit 14:** Relay 2
- **Bit 15:** Relay 1
- **Bit 16:** Watchdog LED
- **Bit 17:** Kettle Heater (3000W)

**Usage Examples:**
```bash
# Turn on kettle pump
curl -X PUT "http://localhost:3000/i2c?bit=8&value=1"

# Open mash valve
curl -X PUT "http://localhost:3000/i2c?bit=6&value=0"

# Turn on kettle heater
curl -X PUT "http://localhost:3000/i2c?bit=17&value=1"
```

#### RIMS (Recirculating Infusion Mash System) Control
```yaml
/kettlePumpModulate:
  put:
    summary: Modulate kettle pump on/off cycling
    operationId: kettlePumpModulate
    parameters:
      - name: onSecs (optional)
        description: Seconds pump is on per cycle
        schema:
          type: number
          minimum: 0.1
          maximum: 3600
      - name: offSecs (optional)
        description: Seconds pump is off per cycle
        schema:
          type: number
          minimum: 0.1
          maximum: 3600
    description: |
      Controls kettle pump modulation for RIMS recirculation.
      - Call with parameters to start modulation
      - Call without parameters to stop modulation
      - Times are adjusted based on simulation speed factor

/mashPumpModulate:
  put:
    summary: Modulate mash pump on/off cycling
    operationId: mashPumpModulate
    parameters:
      - name: onSecs (optional)
      - name: offSecs (optional)
    description: Similar to kettlePumpModulate for mash pump

/recirculate:
  put:
    summary: Start/stop RIMS recirculation with temperature control
    operationId: recirculate
    parameters:
      - name: onOff
        required: true
        schema:
          type: string
          enum: [On, Off]
      - name: tempC
        required: when starting
        description: Target mash temperature (0-100°C)
        schema:
          type: number
          minimum: 0
          maximum: 100
      - name: dutyCycle
        required: false
        description: Kettle pump duty cycle percentage (1-100, default 50%)
        schema:
          type: number
          minimum: 1
          maximum: 100
          default: 50
      - name: mashDutyCycle
        required: false
        description: Mash pump duty cycle percentage (1-100); when provided the mash pump will cycle instead of running continuously.
        schema:
          type: number
          minimum: 1
          maximum: 100
    description: |
      Complete RIMS operation control:
      - Turns on mash pump continuously
        - Modulates kettle pump with configurable duty cycle
        - Optionally modulates mash pump with its own duty cycle
      - Controls mash temperature via PID and kettle heater
      - Synchronizes mash-in valve with kettle pump
      - Duty cycle: 50% = 6.5s on / 6.5s off in 13s total cycle

/recirculate/dutycycle:
  put:
    summary: Update kettle pump duty cycle during active recirculation
    operationId: updateDutyCycle
    parameters:
      - name: dutyCycle
        required: true
        schema:
          type: number
          minimum: 1
          maximum: 99
      - name: mashDutyCycle
        required: false
        schema:
          type: number
          minimum: 1
          maximum: 99
    description: |
      Dynamically adjusts kettle pump on/off times while recirculation runs.
      Optionally adjusts mash pump cycle as well using mashDutyCycle.
      Recalculates onSecs and offSecs to maintain 13-second total cycle.

/recirculate/status:
  get:
    summary: Get current recirculation status
    operationId: getRecirculationStatus
    responses:
      200:
        content:
          application/json:
            schema:
              type: object
              properties:
                active:
                  type: boolean
                  description: Whether recirculation is currently active
                targetTemp:
                  type: number
                  description: Target mash temperature in Celsius
                dutyCycle:
                  type: number
                  description: Kettle pump duty cycle percentage
                onSecs:
                  type: number
                  description: Calculated on time in seconds
                offSecs:
                  type: number
                  description: Calculated off time in seconds
    description: |
      Returns the current state of RIMS recirculation.
      Used by frontend to restore state after navigation.
```

**RIMS Usage Examples:**
```bash
# Start RIMS recirculation at 67°C with 50% duty cycle
curl -X PUT "http://localhost:8080/recirculate?onOff=On&tempC=67&dutyCycle=50"

# Update duty cycle to 30% during recirculation
curl -X PUT "http://localhost:8080/recirculate/dutycycle?dutyCycle=30"

# Check current recirculation status
curl -X GET "http://localhost:8080/recirculate/status"

# Stop recirculation
curl -X PUT "http://localhost:8080/recirculate?onOff=Off"

# Modulate kettle pump independently (3s on, 10s off)
curl -X PUT "http://localhost:8080/kettlePumpModulate?onSecs=3&offSecs=10"

# Stop kettle pump modulation
curl -X PUT "http://localhost:8080/kettlePumpModulate"
```

**RIMS Technical Details:**
- **Temperature Control:** PID controller (Kp=800, Ki=0.3, Kd=100)
- **Sensor Interference:** Pumps auto-stop during temp reads (3 retries, 500ms settle)
- **Valve Synchronization:** Mash-in valve opens/closes with kettle pump
- **Duty Cycle:** Percentage of 13-second cycle pump is on (e.g., 50% = 6.5s/6.5s)
- **Simulation Support:** All timings adjusted by simulation speed factor

## Request/Response Schemas

### Standard Response Format
```yaml
components:
  schemas:
    SuccessResponse:
      type: object
      properties:
        success:
          type: boolean
        data:
          type: object
        timestamp:
          type: string
          format: date-time
```

### Error Response Format
```yaml
components:
  schemas:
    ErrorResponse:
      type: object
      properties:
        error:
          type: string
        message:
          type: string
        code:
          type: string
```

### Brewing Data Schema
```yaml
components:
  schemas:
    BrewData:
      type: object
      properties:
        brewname:
          type: string
        timestamp:
          type: string
          format: date-time
        temperature:
          type: number
          format: float
        gravity:
          type: number
          format: float
        ph:
          type: number
          format: float
```

## Security Configuration

### CORS Settings
```yaml
servers:
  - url: http://localhost:8080
    description: Development server
security:
  - api_key: []
  - basicAuth: []
```

### Rate Limiting
- Brewfather API calls: Respects upstream rate limits
- Local endpoints: Configurable rate limiting
- WebSocket connections: Connection limit per IP

## Parameter Validation

### Query Parameters
- **Date Filtering:** ISO 8601 format validation
- **Pagination:** Limit and offset parameters
- **Sorting:** Field-based sorting with direction

### Path Parameters
- **ID Validation:** UUID and integer format validation
- **Name Validation:** Alphanumeric with specific characters
- **Case Sensitivity:** Configurable per endpoint

## API Documentation Features

### Interactive Documentation
- **Swagger UI:** Available at `/docs`
- **Try It Out:** Test endpoints directly from browser
- **Schema Visualization:** Interactive schema explorer
- **Authentication Testing:** Built-in credential management

### Code Generation
- **Client Libraries:** Generate in multiple languages
- **Server Stubs:** Generate boilerplate server code
- **Documentation:** Generate markdown documentation

## Integration Patterns

### Brewfather Integration
```yaml
# Proxy pattern for Brewfather API
/brewfather/{endpoint}:
  parameters:
    - name: endpoint
      in: path
      required: true
  security:
    - basicAuth: []
```

### WebSocket Integration
```yaml
# WebSocket endpoint definition
/ws:
  get:
    summary: WebSocket connection for real-time data
    protocols: [ws, wss]
```

### Hardware Control Endpoints
```yaml
/hardware/temperature:
  get:
    summary: Get current temperatures
  post:
    summary: Set target temperature
```

## Validation Rules

### Data Types
- **Temperature:** Celsius, range -20 to 120
- **Gravity:** Specific gravity, range 0.990 to 1.200
- **pH:** Range 0.0 to 14.0
- **Time:** ISO 8601 format with timezone

### Business Rules
- **Brew Names:** Must be unique per user
- **Date Ranges:** End date must be after start date
- **Temperature Limits:** Safety limits based on equipment
- **Flow Rates:** Physical limits based on pump capacity

## Error Handling

### HTTP Status Codes
- `200` - Success
- `201` - Created
- `400` - Bad Request (validation error)
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `422` - Unprocessable Entity
- `429` - Rate Limit Exceeded
- `500` - Internal Server Error
- `502` - Bad Gateway (Brewfather API error)
- `503` - Service Unavailable

### Error Response Examples
```yaml
examples:
  ValidationError:
    value:
      error: "Validation Error"
      message: "Invalid temperature range"
      code: "TEMP_OUT_OF_RANGE"
```

## Performance Considerations

### Response Optimization
- **Gzip Compression:** Enabled for all text responses
- **Caching Headers:** Appropriate cache control
- **Pagination:** Large datasets automatically paginated
- **Field Selection:** Sparse fieldsets supported

### Rate Limiting
- **Per-endpoint Limits:** Based on operation cost
- **User-based Limits:** Different limits per user type
- **Burst Allowance:** Short-term burst tolerance
- **Graceful Degradation:** Fallback when limits exceeded

## API Versioning Strategy

### Version Management
- **URL Versioning:** `/v1/`, `/v2/` prefixes
- **Header Versioning:** `Accept-Version` header support
- **Backward Compatibility:** Maintained for major versions
- **Deprecation Policy:** 12-month deprecation notice

### Migration Support
- **Version Bridging:** Automatic translation between versions
- **Feature Flags:** Gradual rollout of new features
- **Documentation Versioning:** Version-specific documentation

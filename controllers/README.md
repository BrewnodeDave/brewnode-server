# Controllers Directory Documentation

## Overview
The `controllers/` directory contains Express.js route handlers that implement the REST API endpoints defined in `api.yaml`. Each controller handles specific domains of functionality.

## Controller Files

### 🍺 `brewnode.js` - Core Brewing Controller
**Primary Responsibility:** Main brewing operations and process control

**Key Operations:**
- `getBrewData()` - Retrieve brewing data with optional date filtering
- Brewing process state management
- Real-time data coordination with broker
- Hardware status aggregation

**Dependencies:**
- MySQL service for data persistence
- Broker for real-time updates
- Hardware services for sensor readings

### 🗄️ `mysql.js` - Database Controller
**Primary Responsibility:** Direct MySQL database operations

**Key Operations:**
- `mysqlBrewnames()` - Get all brew names from database
- Raw database query handling
- Connection management
- Data validation and sanitization

**Security Notes:**
- Implements input sanitization
- Uses parameterized queries
- Handles connection errors gracefully

### 🔧 `common.js` - Utility Controller
**Primary Responsibility:** Shared functionality across controllers

**Key Functions:**
- Response formatting utilities
- Error handling middleware
- Validation helpers
- Common authentication checks

## Brewfather Integration Controllers

### 📦 `brewfather-batches.js`
**Brewfather API:** `/v2/batches/*`
**Operations:**
- List all batches
- Get specific batch details
- Update batch information
- Delete batches
- Batch import/export

### 📋 `brewfather-recipes.js`
**Brewfather API:** `/v2/recipes/*`
**Operations:**
- Recipe CRUD operations
- Recipe sharing and importing
- Recipe calculations
- Style guidelines integration

### 🌾 `brewfather-fermentables.js`
**Brewfather API:** `/v2/fermentables/*`
**Operations:**
- Fermentable ingredient management
- Grain bill calculations
- Malt extract equivalencies
- Custom fermentable creation

### 🌿 `brewfather-hops.js`
**Brewfather API:** `/v2/hops/*`
**Operations:**
- Hop variety database access
- IBU calculations
- Hop schedule management
- Alpha acid adjustments

### 🧪 `brewfather-miscs.js`
**Brewfather API:** `/v2/miscs/*`
**Operations:**
- Miscellaneous ingredient management
- Additive scheduling
- Water treatment chemicals
- Clarifying agents

### 🦠 `brewfather-yeasts.js`
**Brewfather API:** `/v2/yeasts/*`
**Operations:**
- Yeast strain database
- Attenuation calculations
- Pitch rate recommendations
- Fermentation temperature ranges

### 📡 `brewfather-stream.js`
**Brewfather API:** Stream endpoint integration
**Operations:**
- Real-time data streaming to Brewfather
- Fermentation telemetry
- Automated logging
- Batch status updates

## Authentication Flow

### API Key Authentication
1. Client provides API key in header
2. Common middleware validates key
3. Brewfather credentials passed through to external API

### Security Measures
- Input validation on all endpoints
- Rate limiting implementation
- CORS configuration for web client access
- Error message sanitization

## Error Handling

### Standard Error Responses
```javascript
{
  "error": "Error type",
  "message": "Human readable message",
  "code": "SPECIFIC_ERROR_CODE"
}
```

### Common Error Codes
- `401` - Authentication required
- `403` - Insufficient permissions
- `404` - Resource not found
- `422` - Validation error
- `500` - Internal server error

## Controller Integration Pattern

### Request Flow
1. **Route Matching:** Express routes to appropriate controller
2. **Authentication:** Common middleware validates request
3. **Validation:** Input validation and sanitization
4. **Business Logic:** Controller executes operation
5. **Response:** Formatted response sent to client

### Broker Integration
Controllers publish events to the broker for real-time updates:
```javascript
broker.publish('sensor-name', data);
```

### Database Integration
Controllers use the MySQL service for data persistence:
```javascript
const mysql = require('./mysql-service');
const result = await mysql.query('SELECT * FROM brews');
```

## Testing Considerations

### Unit Test Coverage
- Input validation testing
- Error handling verification
- Mock external API responses
- Database operation testing

### Integration Testing
- End-to-end API testing
- Brewfather API integration
- Real-time event publishing
- Authentication flow testing

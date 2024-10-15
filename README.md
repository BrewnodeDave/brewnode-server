## Backend Server

### Pre-requisite

Create a **.env** file in the root folder that contains the following variables:

These are used to access all Brewfather API endpoints
```
    BREWFATHER_USERNAME
    BREWFATHER_PASSWORD
```

These are used to stream fermentation data
```
    BREWFATHER_CUSTOM_STREAM
    BREWFATHER_HOSTNAME
    BREWFATHER_ID
```

### Start
```
npm run start
```

### Interactive API
Open browser at 
```
http://localhost:8080/docs/
```
Add Brefather username and password by pressing the "Authorize" button. 
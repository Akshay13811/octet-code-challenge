# Octet Code Challenge

## Starting the Server

Upon startup the server will check the last updated time for all forex rates. If they are older than the start of the current hour, the forex rates will update immediately.
Forex updates will occur at the start of every UTC hour.

1. Navigate to the server directory
2. Run `npm run install`
3. Run `node .\index.js`

## Starting the App

If you wish to use the app from a different machine than which the server is running on, you will need to edit 'app\src\components\common.ts' and change the `HOST_IP` constant to the servers Public IP Address.

1. Navigate to the app directory
2. Run `npm run install`
3. Run `npm run start`

## Database

The database used by the server is MongoDB Atlas. Please contact me if you would like to access the MongoDB cluster.

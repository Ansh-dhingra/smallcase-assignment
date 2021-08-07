SMALLCASE PORTFOLIO ASSIGNMENT
Portfolio assignment consisting of API's for creating, fetching, updating & deleting trades, portfolio & return


TECH STACK

* NodeJS - Version : v14.17.0
* NPM version : 6.14.13
* MongoDB : v4.2.12
* ExpressJS - A back end web application framework for Node.js.
* Mongoose - Mongoose is an Object Data Modeling (ODM) library for MongoDB and NodeJS

APIs

* GET /api/trade - Get All Buy/SELL Trades 

* POST /api/trade - Add a new BUY/SELL trade for a security

* PUT /api/trade/:tradeId - Updates an existing trade

* DELETE /api/trade/:tradeId - Delete an exisiting trade and revert the changes

* GET /api/trade/netReturn - GET Net Return for Current portfolio

* GET /api/trade/portfolio - GET details of portfolio in a consolidated manner


FOLDER STRUCTURE

* Entry point of application : app.js 
* DB initialization : /database/mongooseLib.js
* DB schema : /models/*
* API : /modules/index.js
* Each module will be having separate 
  Router file(API definition : index.js) 
  Validator(Schema Validation) 
  Controller(Business Logic) & 
  Services(Helper service if any)
* Static Content : /static/constants.js



STEPS TO INITIALIZE

* npm install
* nodemon

/*
    Language : Javascript
    Environment : Node JS
    Framework : Express
*/
const express       = require("express");
const app           = express();
const morgan        = require("morgan");
const bodyParser    = require("body-parser");
const config        = require("config");

const mongooseLib   = require("./database/mongooseLib");
const constants     = require("./static/constants");

app.use(morgan("tiny"));
app.use(bodyParser.json());

// Routes
const routes = require("./modules");
app.use("/api", routes);

// Initialising dependencies & server
(async () => {
    try{
        await mongooseLib.initialise(process.env.mongodbConnectionURL || config.get("mongodbConnectionURL"));
        server = app.listen(config.get("PORT"), () => console.log("Portfolio Backend Server running on Port : ", config.get("PORT")))
    }catch(err){
        console.error("Error in starting the app -: ", err);
    }
})()

function shutDown() {
	/* Close all connections to node server */
	server.close(() => {
		process.exit(0);
	});

	/* Wait for 10 seconds and then close forcefully */
	setTimeout(() => {
		process.exit(1);
	}, 10000);
}

process.on(constants.processEvents.SIGINT, shutDown);
process.on(constants.processEvents.SIGTERM, shutDown);
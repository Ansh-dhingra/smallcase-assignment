/* This file contains all constants*/
exports.CURRENT_STOCK_PRICE = 100;

exports.TRADE_TYPE = {
	BUY: 'BUY',
	SELL: 'SELL'
}

exports.RESPONSE_MESSAGES = {
	NOT_ENOUGH_SHARES : "Not enough shares",
	NO_TRADE_PRESENT: "No such trade in database",
	NO_SECURITY_PRESENT: "No such security in database",
	NO_DATA_FOUND : "No data found",
	SUCCESS : "Success",
	DELETED : "Deleted successfully",
	UPDATED : "Updated successfully",
	ISERROR : "Internal Server Error"
};

exports.successHTTPCode = 200;
exports.badReqHTTPCode = 400;
exports.errorHTTPCode = 503;
exports.notFoundHTTPCode = 404;


exports.processEvents = {
	SIGINT: "SIGINT",
	SIGTERM: "SIGTERM"
};
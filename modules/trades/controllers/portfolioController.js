const portfolioModel    = require("../../../models/portfolio");
const constants         = require("../../../static/constants");
const tradeService      = require("../services/tradeService");

/**
     * @function <b>getReturns</b> Get Returns
     * @return {Object} Net Returns of the User
*/
exports.getReturns = async (req, res) => {
    try {
        const portfolioResult = await portfolioModel.find({});
        let netReturn = 0;
        // SUM(currentPrice[security] * shareQuantity)
        portfolioResult.map((portfolio) => netReturn += (constants.CURRENT_STOCK_PRICE - portfolio.avgBuyPrice) * portfolio.shareQuantity )
        return res.status(constants.successHTTPCode).send({
            message: constants.RESPONSE_MESSAGES.SUCCESS,
            netReturn: tradeService.roundToTwo(netReturn)
        });
    } catch (err) {
        console.log(err);
        res.status(constants.errorHTTPCode).send({
            message: constants.RESPONSE_MESSAGES.ISERROR
        });
    }
};

/**
     * @function <b>getPortfolio</b> Get Portfolio
     * @return {Object} Portfolio - Security Object Array  
*/
exports.getPortfolio = async (req, res) => {
    try {
        // Get all Security to display a consolidated Portfolio 
        const portfolioResult = await portfolioModel.find({});
        !portfolioResult || !portfolioResult.length ? res.status(constants.notFoundHTTPCode).send({
            message : constants.RESPONSE_MESSAGES.NO_DATA_FOUND,
        }) : res.status(constants.successHTTPCode).send({
            message: constants.RESPONSE_MESSAGES.SUCCESS,
            portfolioResult
        });
    } catch (err) {
        console.log(err);
        res.status(constants.errorHTTPCode).send({
            message: constants.RESPONSE_MESSAGES.ISERROR
        });
    }
};
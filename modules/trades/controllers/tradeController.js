const tradesModel       = require("../../../models/trade");
const portfolioModel    = require("../../../models/portfolio");
const tradeService      = require("../services/tradeService");
const constants         = require("../../../static/constants");

/**
     * @function <b>getAllTrades</b> Get All Trades
     * @return {Object} Trades object Array
*/
exports.getAllTrades = async (req, res) => {
    try {
        // Get All trades in ASC order
        const tradeResult = await tradesModel.find({});
        !tradeResult || !tradeResult.length ? res.status(constants.notFoundHTTPCode).send({
            message : constants.RESPONSE_MESSAGES.NO_DATA_FOUND,
        }) : res.status(constants.successHTTPCode).send({
            message : constants.RESPONSE_MESSAGES.SUCCESS,
            tradeResult
        });
    } catch (err) {
        console.log(err);
        res.status(constants.errorHTTPCode).send({
            message: constants.RESPONSE_MESSAGES.ISERROR
        });
    }
};

/**
     * @function <b>addTrade</b> Add a Trade BUY/SELL
     * @return {Object} Inserted Trade Object
*/
exports.addTrade = async (req, res) => {
    try {
        let { tickerSymbol, unitSharePrice, shareQuantity, tradeType } = req.body;
        unitSharePrice = tradeService.roundToTwo(unitSharePrice);
        const totalTradeAmount = tradeService.roundToTwo(unitSharePrice * shareQuantity);
        let portfolioDoc = await portfolioModel.findOne({ tickerSymbol });
        switch(tradeType){
            case constants.TRADE_TYPE.BUY: {
            // Check if ticker exists already in Portfolio Collection
                if (portfolioDoc){
                    // Weighted Average Calculation in case of BUY
                    portfolioDoc.avgBuyPrice = tradeService.roundToTwo(((
                            portfolioDoc.shareQuantity * portfolioDoc.avgBuyPrice
                        ) + totalTradeAmount
                    ) / (
                        portfolioDoc.shareQuantity + shareQuantity
                    ));
                    portfolioDoc.shareQuantity += shareQuantity;
                }else{
                    // New Portfolio Document in case there's no mapping in DB and BUY tradeType only
                    portfolioDoc = new portfolioModel({ tickerSymbol, shareQuantity, avgBuyPrice : tradeService.roundToTwo(unitSharePrice) })
                }
                break;
            }
            case constants.TRADE_TYPE.SELL: {
                // In case of SELL - The current share quanity should be able to support the incoming SELL operation
                if(!portfolioDoc || portfolioDoc.shareQuantity < shareQuantity){
                    return res.status(constants.badReqHTTPCode)
                    .send({ 
                        message: constants.RESPONSE_MESSAGES.NOT_ENOUGH_SHARES 
                    });
                }else{
                    // Only reduce share Quantity, no affect on the Average Buy Price
                    portfolioDoc.shareQuantity -= shareQuantity;
                }
                break;
            }
        }
        // New Trade Document always for atomic structure
        const newTrade = new tradesModel({ tickerSymbol, unitSharePrice, shareQuantity, tradeType, totalTradeAmount });
        await Promise.all([
            newTrade.save(),
            portfolioDoc.save()
        ])
        res.status(constants.successHTTPCode).send({
            message: constants.RESPONSE_MESSAGES.SUCCESS,
            data : { tickerSymbol, unitSharePrice, shareQuantity, tradeType, totalTradeAmount } 
        });
    } catch (err) {
        console.log(err);
        res.status(constants.errorHTTPCode).send({
            message: constants.RESPONSE_MESSAGES.ISERROR
        });
    }
};

/**
     * @function <b>updateTradeById</b> Update an existing Trade
     * @return {Object} Updated Trade Object
*/
exports.updateTradeById = async (req, res) => {
    try {
        const tradeId = req.params.tradeId;
        let { tickerSymbol, unitSharePrice, shareQuantity, tradeType } = req.body;
        let tradeDoc = await tradesModel.findById(tradeId)
        if (!tradeDoc) {
            return res.status(constants.badReqHTTPCode).send({
                message : constants.RESPONSE_MESSAGES.NO_TRADE_PRESENT
            });
        }
        tickerSymbol = tickerSymbol ? tickerSymbol : tradeDoc.tickerSymbol;
        unitSharePrice = unitSharePrice ? tradeService.roundToTwo(unitSharePrice) : tradeDoc.unitSharePrice;
        shareQuantity = shareQuantity ? shareQuantity : tradeDoc.shareQuantity;
        tradeType = tradeType ? tradeType : tradeDoc.tradeType;
        let PromiseArray = [];
        PromiseArray.push(portfolioModel.findOne({ tickerSymbol : tradeDoc.tickerSymbol }))
        tickerSymbol !== tradeDoc.tickerSymbol ? PromiseArray.push(portfolioModel.findOne({ tickerSymbol : tickerSymbol })) : "";
        const [ oldPortfolio, newPortfolio ] = await Promise.all(PromiseArray);
        PromiseArray = [];
        if(tickerSymbol !== tradeDoc.tickerSymbol){ //If Ticker symbol has been updated in existing trade
            if(!newPortfolio){
                if(tradeType === constants.TRADE_TYPE.SELL){
                    return res.status(constants.badReqHTTPCode).send({ 
                        message: constants.RESPONSE_MESSAGES.NOT_ENOUGH_SHARES 
                    });
                }
                const insertPortfolio = new portfolioModel({ tickerSymbol, shareQuantity, avgBuyPrice : unitSharePrice })
                PromiseArray.push(insertPortfolio.save())
            }else{
                switch(tradeType){
                    case constants.TRADE_TYPE.BUY: {
                        newPortfolio.avgBuyPrice = !newPortfolio.avgBuyPrice ? unitSharePrice : tradeService.roundToTwo(((newPortfolio.avgBuyPrice * newPortfolio.shareQuantity) + (unitSharePrice * shareQuantity))
                            / (newPortfolio.shareQuantity + shareQuantity));
                        newPortfolio.shareQuantity += shareQuantity;
                        break;
                    }
                    case constants.TRADE_TYPE.SELL: {
                        if(newPortfolio.shareQuantity < shareQuantity){
                            return res.status(constants.badReqHTTPCode).send({ 
                                message: constants.RESPONSE_MESSAGES.NOT_ENOUGH_SHARES 
                            });
                        }
                        newPortfolio.shareQuantity -= shareQuantity;
                        break;
                    }
                }
                PromiseArray.push(newPortfolio.save());
            }
        }
        const oldPortfolioResult = await tradeService.processOldPortfolioUpdates(tradeId, tradeDoc, oldPortfolio, tickerSymbol, unitSharePrice, shareQuantity, tradeType);
        if(!oldPortfolioResult){
            return res.status(constants.badReqHTTPCode).send({ 
                message: constants.RESPONSE_MESSAGES.NOT_ENOUGH_SHARES 
            });
        }
        tradeService.processTradeUpdates(tradeDoc, tickerSymbol, unitSharePrice, shareQuantity, tradeType);    
        PromiseArray.push(tradeDoc.save(), oldPortfolio.save());
        await Promise.all(PromiseArray);
        return res.status(constants.successHTTPCode).send({
            message : constants.RESPONSE_MESSAGES.UPDATED,
            data : tradeDoc
        });
    } catch (err) {
        console.log(err);
        res.status(constants.errorHTTPCode).send({
            message: constants.RESPONSE_MESSAGES.ISERROR
        });
    }
};

/**
     * @function <b>deleteTradeById</b> Delete an existing Trade
     * @return {Object} Deletion success message
*/
exports.deleteTradeById = async (req, res) => {
    try {
        const tradeId = req.params.tradeId;
        // Check if the incoming Trade exists in DB
        const tradeDoc = await tradesModel.findById(tradeId);
        if (!tradeDoc) {
            return res.status(constants.badReqHTTPCode).send({
                message : constants.RESPONSE_MESSAGES.NO_TRADE_PRESENT
            });
        }
        // Get Security details mapped with Ticket Symbol
        let portfolioDoc = await portfolioModel.findOne({ tickerSymbol : tradeDoc.tickerSymbol });
        switch(tradeDoc.tradeType){
            case constants.TRADE_TYPE.BUY: {
                if((portfolioDoc.shareQuantity < tradeDoc.shareQuantity) || 
                    (portfolioDoc.avgBuyPrice * portfolioDoc.shareQuantity) < tradeDoc.totalTradeAmount){
                    return res.status(constants.badReqHTTPCode).send({ 
                        message: constants.RESPONSE_MESSAGES.NOT_ENOUGH_SHARES 
                    })
                }
                // Revert everything that was done by the trade initially
                portfolioDoc.shareQuantity -= tradeDoc.shareQuantity;
                portfolioDoc.avgBuyPrice = await tradeService.processAvgBuyPrice(tradeId, tradeDoc.tickerSymbol);
                break;
            }
            case constants.TRADE_TYPE.SELL: {
                // No affect on Average Buy Price as this reverting a SELL Trade
                portfolioDoc.shareQuantity += tradeDoc.shareQuantity;
                break;
            }
        }
        if(portfolioDoc.avgBuyPrice < 0){ 
            //In case BUY Trade is deleted and then there are not enough to perform SELL 
            return res.status(constants.badReqHTTPCode).send({ 
                message: constants.RESPONSE_MESSAGES.NOT_ENOUGH_SHARES 
            }) 
        }
        // Delete and Update Portfolio details
        await Promise.all([
            tradesModel.findByIdAndDelete(tradeId),
            portfolioDoc.save()
        ])
        res.status(constants.successHTTPCode).send({
            message: constants.RESPONSE_MESSAGES.DELETED
        })
    } catch (err) {
        console.log(err);
        res.status(constants.errorHTTPCode).send({
            message: constants.RESPONSE_MESSAGES.ISERROR
        });
    }
};
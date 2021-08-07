const constants     = require("../../../static/constants");
const tradesModel   = require("../../../models/trade");

/**
     * @function <b>processTradeUpdates</b> Update Trade API Service
     * @param {Object} tradeDoc Existing Trade Document
     * @param {List} payload All keys to be updated
     * @return {Object} Update values in existing trade
*/
exports.processTradeUpdates = ((tradeDoc, ...payload) => {
    // Update tradeDoc Object to be saved in the primary function
    const [ tickerSymbol, unitSharePrice, shareQuantity, tradeType ] = payload;
    tickerSymbol ? tradeDoc.tickerSymbol = tickerSymbol : "";
    unitSharePrice ? tradeDoc.unitSharePrice = unitSharePrice : "";
    shareQuantity ? tradeDoc.shareQuantity = shareQuantity : "";
    tradeType ? tradeDoc.tradeType = tradeType : "";
    tradeDoc.totalTradeAmount = unitSharePrice * shareQuantity;
    return;
})

/**
     * @function <b>processOldPortfolioUpdates</b> Update Trade API Service - Process portfolio keys
     * @param {String} tradeId Existing Trade ID
     * @param {Object} tradeDoc Existing Trade Document
     * @param {Object} portfolioDoc Existing Portfolio Document
     * @param {List} payload All keys to be updated
     * @return {Boolean} 
*/
exports.processOldPortfolioUpdates = ((tradeId, tradeDoc, portfolioDoc, ...payload) => {
    return new Promise(async (resolve, reject) => {
        try{
            const [ tickerSymbol, unitSharePrice, shareQuantity, tradeType ] = payload;
            const totalTradeAmount = exports.roundToTwo(unitSharePrice * shareQuantity);
            if(tradeDoc.tickerSymbol !== tickerSymbol){
                // Case : TicketSymbol has been updated 
                switch(tradeDoc.tradeType){
                    case constants.TRADE_TYPE.BUY: {
                        if(portfolioDoc.shareQuantity - tradeDoc.shareQuantity < 0){ 
                            return resolve(0); // Share Quantity of old security cannot revert input shares 
                        }
                        portfolioDoc.shareQuantity -= tradeDoc.shareQuantity;
                        portfolioDoc.avgBuyPrice = await exports.processAvgBuyPrice(tradeId, tradeDoc.tickerSymbol);    
                        break;
                    }
                    case constants.TRADE_TYPE.BUY: {
                        portfolioDoc.shareQuantity += tradeDoc.shareQuantity;
                        break;
                    }
                }
            }else {
                if(tradeDoc.tradeType !== tradeType){
                    // Case : Incoming tradeType and stored tradeType is not same
                    switch(tradeType){
                        case constants.TRADE_TYPE.BUY: {
                            portfolioDoc.shareQuantity += tradeDoc.shareQuantity + shareQuantity;
                            portfolioDoc.avgBuyPrice = await exports.processAvgBuyPrice(tradeId, tradeDoc.tickerSymbol, unitSharePrice, shareQuantity);
                            break;
                        }
                        case constants.TRADE_TYPE.SELL:{
                            if(portfolioDoc.shareQuantity - tradeDoc.shareQuantity - shareQuantity < 0){
                                return resolve(0);
                            }
                            portfolioDoc.shareQuantity -= (tradeDoc.shareQuantity + shareQuantity);
                            portfolioDoc.avgBuyPrice = await exports.processAvgBuyPrice(tradeId, tradeDoc.tickerSymbol);
                            break;
                        }
                    }
                }else{
                    // Case : Either unitSharePrice or shareQuantity has been updated 
                    switch(tradeDoc.tradeType){
                        case constants.TRADE_TYPE.BUY: {
                            if((portfolioDoc.shareQuantity + shareQuantity) - tradeDoc.shareQuantity < 0){
                                return resolve(0);
                            }
                            tradeDoc.shareQuantity !== shareQuantity ? portfolioDoc.shareQuantity += shareQuantity - tradeDoc.shareQuantity : "";
                            portfolioDoc.avgBuyPrice = await exports.processAvgBuyPrice(tradeId, tradeDoc.tickerSymbol, unitSharePrice, shareQuantity);
                            break;
                        }
                        case constants.TRADE_TYPE.SELL: {
                            if(portfolioDoc.shareQuantity + tradeDoc.shareQuantity - shareQuantity < 0){
                                return resolve(0);
                            }
                            shareQuantity && tradeDoc.shareQuantity !== shareQuantity ? 
                            portfolioDoc.shareQuantity += (tradeDoc.shareQuantity - shareQuantity) : "";
                            break;
                        }
                    }
                }
            }
            return resolve(1);
        }catch(error){
            reject(error);
        }
    })
})

/**
     * @function <b>processAvgBuyPrice</b> Update Trade API Service - Calculate Avg Buy Price Again
     * @param {String} tradeId Existing Trade ID
     * @param {Object} tickerSymbol Existing Ticket Symbol
     * @param {Object} currentBuyPrice Current Trade Document
     * @param {List} currentShares Current share quantity
     * @return {Number} avgBuyPrice to be updated
*/
exports.processAvgBuyPrice = ((tradeId, tickerSymbol, currentBuyPrice = 0, currentShares = 0) => {
    return new Promise(async (resolve, reject) => {
        try{
            // Fetch all Trades mapped with input tickerSymbol calculate Avg Buy Price
            let tradeAllDoc = await tradesModel.find({ 
                "tickerSymbol" : tickerSymbol
            });
            let avgBuyPrice = 0, totalShares = 0;
            tradeAllDoc.map((tradeData) => {
                if(currentBuyPrice && currentShares && tradeData._id === tradeId){
                    avgBuyPrice = !avgBuyPrice ? currentBuyPrice : 
                        exports.roundToTwo((avgBuyPrice * totalShares) + currentBuyPrice * currentShares) 
                        / (totalShares + currentShares)
                    totalShares += currentShares
                }else{
                    if(tradeData._id != tradeId){
                        switch(tradeData.tradeType){
                            case constants.TRADE_TYPE.BUY: {
                                avgBuyPrice = !avgBuyPrice ? tradeAllDoc.length > 1 ? tradeData.unitSharePrice : 0 : 
                                    exports.roundToTwo(((avgBuyPrice * totalShares) + tradeData.totalTradeAmount) 
                                    / (totalShares + tradeData.shareQuantity))
                                totalShares += tradeData.shareQuantity;
                                break;
                            }
                            case constants.TRADE_TYPE.SELL: {
                                totalShares -= tradeData.shareQuantity;
                                break;
                            }
                        }
                    }
                }
            })
            resolve(exports.roundToTwo(avgBuyPrice));
        }catch(error){
            reject(error);
        }
    })
})

exports.roundToTwo = (num)=>{
	return +(Math.round(num + "e+2")  + "e-2");
}
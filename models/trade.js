const mongoose = require("mongoose");

const tradeSchema = new mongoose.Schema({
    tickerSymbol: {
        type: String,
        required : true
    },
    unitSharePrice: {
        type: Number,
        min: 0
    },
    shareQuantity: {
        type: Number,
        required : true,
        min : 1
    },
    tradeType : {
        type : String,
        required : true,
        enum : ['BUY','SELL'],
    },
    totalTradeAmount : {
        type: Number,
        required : true,
        min : 0
    }
},{
    timestamps : true
});

module.exports = mongoose.model("trade", tradeSchema);
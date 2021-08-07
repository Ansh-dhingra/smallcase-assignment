const mongoose = require("mongoose");

const tradeSchema = new mongoose.Schema({
    tickerSymbol: {
        type: String,
        required : true,
        unique : true
    },
    avgBuyPrice: {
        type: Number,
        min: 0
    },
    shareQuantity: {
        type: Number,
        required : true,
        min : 0
    }
},{
    timestamps : true
});

module.exports = mongoose.model("portfolio", tradeSchema);
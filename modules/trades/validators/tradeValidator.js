const Joi = require("joi");

const validator = require('../../../validators/joiValidator');

exports.addTrade = ((req, res, next) => {
    const schema = Joi.object().keys({
        tickerSymbol: Joi.string().required(),
        unitSharePrice: Joi.number().positive().required(),
        shareQuantity: Joi.number().integer().positive().min(1).required(),
        tradeType: Joi.string().valid("BUY","SELL").required()
    })
    const validField = validator.validateFields(req.body, res, schema);
    if(validField){
        next();
    }
})

exports.updateTradeById = ((req, res, next) => {
    const schema = Joi.object().keys({
        tickerSymbol: Joi.string().optional(),
        unitSharePrice: Joi.number().positive().optional(),
        shareQuantity: Joi.number().integer().positive().min(1).optional(),
        tradeType: Joi.string().valid("BUY","SELL").optional()
    })
    const validField = validator.validateFields(req.body, res, schema);
    if(validField){
        next();
    }
})
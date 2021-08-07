const Joi = require('joi');

exports.validateFields = ((payload, res, schema) => {
    const validation = schema.validate(payload);
    if(validation.error){
        res.status(400).send({
            error : validation.error ? validation.error.details : validation.error
        });
        return false;
    }
    return true;
})
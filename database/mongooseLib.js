const mongoose                  = require("mongoose");

/**
     * @function <b>initialise</b> Initialise MongoDB
     * @param {String} mongodbConnectionURL MongoDB Connection URL
*/
exports.initialise = ((mongodbConnectionURL) => {
    return new Promise((resolve, reject) =>{
        mongoose.connect(mongodbConnectionURL, {
            useNewUrlParser : true, 
            useUnifiedTopology : true, 
            useCreateIndex : true 
        })
        .then(() => resolve())
        .catch((err) => reject(err))
    })
})
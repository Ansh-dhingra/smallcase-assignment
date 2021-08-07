const router = require("express").Router();
const tradeRoutes = require("./trades");

router.use("/trade", tradeRoutes);

module.exports = router;
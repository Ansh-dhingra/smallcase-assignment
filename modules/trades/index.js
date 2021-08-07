const router = require("express").Router();
const tradeController = require("./controllers/tradeController");
const portfolioController = require("./controllers/portfolioController");

const tradeValidator = require("./validators/tradeValidator");

router.route("/")
  .get(tradeController.getAllTrades)
  .post(
    tradeValidator.addTrade,
    tradeController.addTrade
  );

router.route("/:tradeId")
  .put(
    tradeValidator.updateTradeById,
    tradeController.updateTradeById
  )
  .delete(tradeController.deleteTradeById);

router.route("/portfolio").get(portfolioController.getPortfolio);

router.route("/netReturn").get(portfolioController.getReturns);

module.exports = router;
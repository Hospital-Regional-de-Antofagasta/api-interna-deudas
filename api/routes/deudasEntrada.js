const express = require("express");
const deudasEntradaController = require("../controllers/deudasEntradaController");
const { isAuthenticated } = require("../middleware/auth");
const { requiredParameters } = require("../middleware/validarOrdenesFlow");

const router = express.Router();

router.get("/pagos", isAuthenticated, requiredParameters, deudasEntradaController.getOrdenesFlow);

module.exports = router;

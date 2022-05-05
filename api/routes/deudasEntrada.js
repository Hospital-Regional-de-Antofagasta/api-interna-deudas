const express = require("express");
const deudasEntradaController = require("../controllers/deudasEntradaController");
const { isAuthenticated } = require("../middleware/auth");
const { requiredParameters } = require("../middleware/validarOrdenesFlow");

const router = express.Router();

router.get("/pagos", isAuthenticated, requiredParameters, deudasEntradaController.getOrdenesFlow);

router.put("/pagos", isAuthenticated, deudasEntradaController.updateOrdenesFlow);

router.delete("/pagos", isAuthenticated, deudasEntradaController.deleteOrdenesFlow);

module.exports = router;

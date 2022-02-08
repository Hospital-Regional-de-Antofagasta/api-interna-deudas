const express = require("express");
const deudasSalidaController = require("../controllers/deudasSalidaController");
const { isAuthenticated } = require("../middleware/auth");

const router = express.Router();

router.post("", isAuthenticated, deudasSalidaController.create);

router.put("", isAuthenticated, deudasSalidaController.updateMany);

router.delete("", isAuthenticated, deudasSalidaController.deleteMany);

module.exports = router;

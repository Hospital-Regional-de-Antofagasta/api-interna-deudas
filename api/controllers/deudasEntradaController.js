const OrdenesFlow = require("../models/OrdenesFlow");
const Deudas = require("../models/Deudas");

exports.getOrdenesFlow = async (req, res) => {
  try {
    const { codigoEstablecimiento } = req.query;

    const ordenesFlow = await OrdenesFlow.find({
      estado: { $in: ["PAGADA", "ERROR_FLOW", "ERROR_VALIDACION"] },
    })
      .sort({ createdAt: 1 })
      .limit(100)
      .exec();

    const ordenesAEnviar = [];
    for (let ordenFlow of ordenesFlow) {
      let aEnviar = true;
      for (let pago of ordenFlow.pagos) {
        const deuda = await Deudas.findOne({ _id: pago.idDeuda }).exec();
        if (deuda.codigoEstablecimiento !== codigoEstablecimiento) {
          aEnviar = false;
          break;
        }
      }
      if (aEnviar) ordenesAEnviar.push(ordenFlow);
    }

    res.status(200).send(ordenesAEnviar);
  } catch (error) {
    res.status(500).send({
      error: `OrdenesFlow get: ${error.name} - ${error.message}`,
    });
  }
};

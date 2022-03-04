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
      .lean()
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
        pago.correlativoDeuda = deuda.correlativo;
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

exports.updateOrdenesFlow = async (req, res) => {
  const ordenesFlowActualizadas = [];
  try {
    const ordenesFlow = req.body;
    for (let ordenFlow of ordenesFlow) {
      try {
        const ordenFlowMismoIdentificador = await OrdenesFlow.find({
          _id: ordenFlow._id,
        }).exec();
        // si no existe la orden de flow, reportar el error
        if (ordenFlowMismoIdentificador.length === 0) {
          ordenesFlowActualizadas.push({
            afectado: ordenFlow._id,
            realizado: false,
            error: "La orden de flow no existe.",
          });
          continue;
        }
        // si existen multiples ordenes de flow con el mismo identificador, indicar el error
        if (ordenFlowMismoIdentificador.length > 1) {
          ordenesFlowActualizadas.push({
            afectado: ordenFlow._id,
            realizado: false,
            error: `Existen ${ordenFlowMismoIdentificador.length} ordenes de flow con el identificador ${solicitudes._id}.`,
          });
          continue;
        }
        // si solo se encontro una orden de flow para actualizar
        const response = await OrdenesFlow.updateOne(
          {
            _id: ordenFlow._id,
          },
          ordenFlow
        ).exec();
        ordenesFlowActualizadas.push({
          afectado: ordenFlow._id,
          realizado: response.modifiedCount ? true : false,
          error: response.modifiedCount
            ? ""
            : "La orden de flow no fue actualizada.",
        });
      } catch (error) {
        ordenesFlowActualizadas.push({
          afectado: ordenFlow._id,
          realizado: false,
          error: `${error.name} - ${error.message}`,
        });
      }
    }
    res.status(200).send({
      respuesta: ordenesFlowActualizadas,
    });
  } catch (error) {
    res.status(500).send({
      error: `OrdenesFlow update: ${error.name} - ${error.message}`,
      respuesta: ordenesFlowActualizadas,
    });
  }
};

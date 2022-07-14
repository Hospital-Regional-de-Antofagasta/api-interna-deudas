const OrdenesFlow = require("../models/OrdenesFlow");

exports.getOrdenesFlow = async (req, res) => {
  try {
    const { codigoEstablecimiento } = req.query;
    const now = new Date();
    console.log(now.setSeconds(now.getSeconds() + 60))
    const ordenesFlow = await OrdenesFlow.find({
      estado: { $in: ["PAGADA", "ANULADA", "RECHAZADA", "ERROR_FLOW"] },
      registradoEnEstablecimiento: false,
      updatedAt: { $lte: now.setSeconds(now.getSeconds() + 60) },
    })
      .select("-_id -pagos._id")
      .sort({ createdAt: 1 })
      .limit(100)
      .lean()
      .exec();

    const ordenesAEnviar = [];
    for (let ordenFlow of ordenesFlow) {
      if (
        ordenFlow.pagos.filter(
          (e) => e.codigoEstablecimientoDeuda !== codigoEstablecimiento
        )
      )
        ordenesAEnviar.push(ordenFlow);
    }

    res.status(200).send({ respuesta: ordenesAEnviar });
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
          flowOrder: ordenFlow.flowOrder,
        }).exec();
        // si no existe la orden de flow, reportar el error
        if (ordenFlowMismoIdentificador.length === 0) {
          ordenesFlowActualizadas.push({
            afectado: ordenFlow.flowOrder,
            realizado: false,
            error: "La orden de flow no existe.",
          });
          continue;
        }
        // si existen multiples ordenes de flow con el mismo identificador, indicar el error
        if (ordenFlowMismoIdentificador.length > 1) {
          ordenesFlowActualizadas.push({
            afectado: ordenFlow.flowOrder,
            realizado: false,
            error: `Existen ${ordenFlowMismoIdentificador.length} ordenes de flow con el identificador ${solicitudes.flowOrder}.`,
          });
          continue;
        }
        // si solo se encontro una orden de flow para actualizar
        const response = await OrdenesFlow.updateOne(
          {
            flowOrder: ordenFlow.flowOrder,
          },
          ordenFlow
        ).exec();
        ordenesFlowActualizadas.push({
          afectado: ordenFlow.flowOrder,
          realizado: response.modifiedCount ? true : false,
          error: response.modifiedCount
            ? ""
            : "La orden de flow no fue actualizada.",
        });
      } catch (error) {
        ordenesFlowActualizadas.push({
          afectado: ordenFlow.flowOrder,
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

exports.deleteOrdenesFlow = async (req, res) => {
  const ordenesFlowEliminadas = [];
  try {
    const ordenesFlow = req.body;
    for (let ordenFlow of ordenesFlow) {
      try {
        const ordenFlowMismoIdentificador = await OrdenesFlow.find({
          flowOrder: ordenFlow,
        }).exec();
        // si no existe la orden de flow, reportar el error
        if (ordenFlowMismoIdentificador.length === 0) {
          ordenesFlowEliminadas.push({
            afectado: ordenFlow,
            realizado: false,
            error: "La orden de flow no existe.",
          });
          continue;
        }
        // si existen multiples ordenes de flow con el mismo identificador, indicar el error
        if (ordenFlowMismoIdentificador.length > 1) {
          ordenesFlowEliminadas.push({
            afectado: ordenFlow,
            realizado: false,
            error: `Existen ${ordenFlowMismoIdentificador.length} ordenes de flow con el identificador ${solicitudes.flowOrder}.`,
          });
          continue;
        }
        // si solo se encontro una orden de flow para actualizar
        const response = await OrdenesFlow.deleteOne({
          flowOrder: ordenFlow,
        }).exec();
        ordenesFlowEliminadas.push({
          afectado: ordenFlow,
          realizado: response.deletedCount ? true : false,
          error: response.deletedCount
            ? ""
            : "La orden de flow no fue eliminada.",
        });
      } catch (error) {
        ordenesFlowEliminadas.push({
          afectado: ordenFlow,
          realizado: false,
          error: `${error.name} - ${error.message}`,
        });
      }
    }
    res.status(200).send({
      respuesta: ordenesFlowEliminadas,
    });
  } catch (error) {
    res.status(500).send({
      error: `OrdenesFlow delete: ${error.name} - ${error.message}`,
      respuesta: ordenesFlowEliminadas,
    });
  }
};

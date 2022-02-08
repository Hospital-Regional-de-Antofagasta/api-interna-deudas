const Deudas = require("../models/Deudas");

exports.create = async (req, res) => {
  const deudasInsertadas = [];
  try {
    const deudas = req.body;
    for (let deuda of deudas) {
      try {
        const deudasMismoIdentificador = await Deudas.find({
          $and: [
            { correlativo: deuda.correlativo },
            { codigoEstablecimiento: deuda.codigoEstablecimiento },
          ],
        }).exec();
        // si existen multiples deudas con el mismo identificador, indicar el error
        if (deudasMismoIdentificador.length > 1) {
          deudasInsertadas.push({
            afectado: deuda.correlativo,
            realizado: false,
            error: `Existen ${deudasMismoIdentificador.length} deudas con el correlativo ${deuda.correlativo} para el establecimiento ${deuda.codigoEstablecimiento}.`,
          });
          continue;
        }
        // si ya existe la deuda, indicar el error y decir que se inserto
        if (deudasMismoIdentificador.length === 1) {
          deudasInsertadas.push({
            afectado: deuda.correlativo,
            realizado: true,
            error: "La deuda ya existe.",
          });
          continue;
        }
        // si la deuda no existe, se inserta
        await Deudas.create(deuda);
        deudasInsertadas.push({
          afectado: deuda.correlativo,
          realizado: true,
          error: "",
        });
      } catch (error) {
        deudasInsertadas.push({
          afectado: deuda.correlativo,
          realizado: false,
          error: `${error.name} - ${error.message}`,
        });
      }
    }
    res.status(201).send({
      respuesta: deudasInsertadas,
    });
  } catch (error) {
    res.status(500).send({
      error: `Deudas create: ${error.name} - ${error.message}`,
      respuesta: deudasInsertadas,
    });
  }
};

exports.updateMany = async (req, res) => {
  const deudasActualizadas = [];
  try {
    const deudas = req.body;
    for (let deuda of deudas) {
      try {
        const deudasMismoIdentificador = await Deudas.find({
          $and: [
            { correlativo: deuda.correlativo },
            { codigoEstablecimiento: deuda.codigoEstablecimiento },
          ],
        }).exec();
        // si la deuda no existe, reportar el error
        if (deudasMismoIdentificador.length === 0) {
          deudasActualizadas.push({
            afectado: deuda.correlativo,
            realizado: false,
            error: "La deuda no existe.",
          });
          continue;
        }
        // si existen multiples deudas con el mismo identificador, indicar el error
        if (deudasMismoIdentificador.length > 1) {
          deudasActualizadas.push({
            afectado: deuda.correlativo,
            realizado: false,
            error: `Existen ${deudasMismoIdentificador.length} deudas con el correlativo ${deuda.correlativo} para el establecimiento ${deuda.codigoEstablecimiento}.`,
          });
          continue;
        }
        // si solo encontro una para actualizar, la actualiza
        const response = await Deudas.updateOne(
          {
            correlativo: deuda.correlativo,
            codigoEstablecimiento: deuda.codigoEstablecimiento,
          },
          deuda
        ).exec();
        deudasActualizadas.push({
          afectado: deuda.correlativo,
          realizado: response.modifiedCount ? true : false,
          error: response.modifiedCount
            ? ""
            : "La deuda no fue actualizada.",
        });
      } catch (error) {
        deudasActualizadas.push({
          afectado: deuda.correlativo,
          realizado: false,
          error: `${error.name} - ${error.message}`,
        });
      }
    }
    res.status(200).send({
      respuesta: deudasActualizadas,
    });
  } catch (error) {
    res.status(500).send({
      error: `Deudas delete: ${error.name} - ${error.message}`,
      respuesta: deudasActualizadas,
    });
  }
};

exports.deleteMany = async (req, res) => {
  const deudasEliminados = [];
  try {
    const identificadoresDeudas = req.body;
    for (let identificadorDocumento of identificadoresDeudas) {
      try {
        const deudasMismoIdentificador = await Deudas.find({
          $and: [
            { correlativo: identificadorDocumento.correlativo },
            {
              codigoEstablecimiento:
                identificadorDocumento.codigoEstablecimiento,
            },
          ],
        }).exec();
        // si el deuda no existe, reportar el error e indicar que se elimino
        if (deudasMismoIdentificador.length === 0) {
          deudasEliminados.push({
            afectado: identificadorDocumento.correlativo,
            realizado: true,
            error: "La deuda no existe.",
          });
          continue;
        }
        // si existen multiples deudas con el mismo identificador, indicar el error
        if (deudasMismoIdentificador.length > 1) {
          deudasEliminados.push({
            afectado: identificadorDocumento.correlativo,
            realizado: false,
            error: `Existen ${deudasMismoIdentificador.length} deudas con el correlativo ${identificadorDocumento.correlativo} para el establecimiento ${identificadorDocumento.codigoEstablecimiento}.`,
          });
          continue;
        }
        // si solo encontro un deuda para eliminar, lo elimina
        const response = await Deudas.deleteOne(identificadorDocumento).exec();
        deudasEliminados.push({
          afectado: identificadorDocumento.correlativo,
          realizado: response.deletedCount ? true : false,
          error: response.deletedCount
            ? ""
            : "La deuda no fue eliminada.",
        });
      } catch (error) {
        deudasEliminados.push({
          afectado: identificadorDocumento.correlativo,
          realizado: false,
          error: `${error.name} - ${error.message}`,
        });
      }
    }
    res.status(200).send({
      respuesta: deudasEliminados,
    });
  } catch (error) {
    res.status(500).send({
      error: `Deudas delete: ${error.name} - ${error.message}`,
      respuesta: deudasEliminados,
    });
  }
};

const mongoose = require("mongoose");
const Deudas = require("../models/Deudas");
const Schema = mongoose.Schema;

const validarMinimo1 = (valor) => {
  if (!valor) return false;
  if (valor.length === 0) return false;
  return true;
};

const validarExisteDeuda = async (pagos) => {
  for (let pago of pagos) {
    if (!pago) continue;
    if (!pago.identificadorDeuda) continue;
    if (!pago.tipoDeuda) continue;
    if (!pago.codigoEstablecimientoDeuda) continue;

    const deuda = await Deudas.findOne({
      identificador: pago.identificadorDeuda,
      tipo: pago.tipoDeuda,
      codigoEstablecimiento: pago.codigoEstablecimientoDeuda,
    });

    if (!deuda) return false;
  }
  return true;
};

const validarDeudaMayorAbono = async (pagos) => {
  for (let pago of pagos) {
    if (!pago) continue;
    if (!pago.identificadorDeuda) continue;
    if (!pago.tipoDeuda) continue;
    if (!pago.codigoEstablecimientoDeuda) continue;

    const deuda = await Deudas.findOne({
      identificador: pago.identificadorDeuda,
      tipo: pago.tipoDeuda,
      codigoEstablecimiento: pago.codigoEstablecimientoDeuda,
    });

    if (!deuda) continue;
    if (deuda.deuda < pago.abono) return false;
  }
  return true;
};

const validarDeudaDisponibleParaPago = async (pagos) => {
  for (let pago of pagos) {
    const pagosEnValidacion = await OrdenesFlow.find({
      "pagos.identificadorDeuda": pago.identificadorDeuda,
      "pagos.tipoDeuda": pago.tipoDeuda,
      "pagos.codigoEstablecimientoDeuda": pago.codigoEstablecimientoDeuda,
      estado: {
        $in: [
          "EN_PROCESO",
          "PAGADA",
          "ERROR_FLOW",
          "ERROR_FLOW_CONFIRMADO",
          "ERROR_FLOW_INFORMADO",
        ],
      },
    }).exec();

    if (pagosEnValidacion.length > 0) return false;
    return true;
  }
};

const validarDeudasDiferentes = async (pagos) => {
  for (let pago of pagos) {
    if (
      pagos.filter(
        (e) =>
          e.identificadorDeuda === pago.identificadorDeuda &&
          e.tipoDeuda === pago.tipoDeuda &&
          e.codigoEstablecimiento === pago.codigoEstablecimiento
      )
    )
      return false;
  }
  return true;
};

const OrdenesFlow = mongoose.model(
  "ordenes_flow",
  new Schema(
    {
      flowOrder: { type: String },
      token: { type: String },
      commerceOrder: { type: String, required: true },
      rutPaciente: { type: String, required: true },
      emailPagador: { type: String, required: true },
      rutPagador: { type: String, required: true },
      estado: {
        type: String,
        default: "EN_PROCESO",
        enum: [
          "EN_PROCESO",
          "PAGADA",
          "ANULADA",
          "RECHAZADA",
          "ERROR_FLOW",
          "ERROR_FLOW_CONFIRMADO",
          "ERROR_FLOW_INFORMADO",
        ],
      },
      registradoEnEstablecimiento: {
        type: Boolean,
        default: false,
      },
      pagos: {
        type: [
          {
            identificadorDeuda: {
              type: String,
              required: [true, "El identificadorDeuda es obligatorio."],
            },
            tipoDeuda: {
              type: String,
              required: [true, "El tipoDeuda es obligatorio."],
              enum: [
                "PAGARE",
                "El tipoDeuda '{VALUE}' no tiene el formato correcto.",
              ],
            },
            codigoEstablecimientoDeuda: {
              type: String,
              required: [true, "El codigoEstablecimientoDeuda es obligatorio."],
              enum: [
                "HRA",
                "El codigoEstablecimientoDeuda '{VALUE}' no tiene el formato correcto.",
              ],
            },
            abono: {
              type: Number,
              required: [true, "El abono es obligatorio."],
              max: [999999999, "El abono no puede ser mayor a 999999999"],
              min: [350, "El abono no puede ser menor a 350"],
            },
          },
        ],
        required: [true, "El pago es obligatorio."],
        validate: [
          {
            validator: validarMinimo1,
            message: "Se debe ingresar al menos un pago.",
          },
          {
            validator: validarExisteDeuda,
            message: "No se encontró la deuda.",
          },
          {
            validator: validarDeudaMayorAbono,
            message: "El abono debe ser menor a la deuda.",
          },
          {
            validator: validarDeudaDisponibleParaPago,
            message: "La deuda tiene un pago en validación.",
          },
          {
            validator: validarDeudasDiferentes,
            message:
              "No se puede realizar dos o mas pagos a la misma deuda en la misma consulta.",
          },
        ],
      },
    },
    { timestamps: true }
  ),
  "ordenes_flow"
);

module.exports = OrdenesFlow;

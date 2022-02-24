exports.requiredParameters = async (req, res, next) => {
  try {
    const { codigoEstablecimiento } = req.query;

    if (!codigoEstablecimiento)
      return res.status(400).send({
        error: `Se debe enviar el codigo del establecimiento.`,
      });

    next();
  } catch (error) {
    res.status(500).send({
      error: `Pacientes requiredParameters: ${error.name} - ${error.message}`,
    });
  }
};

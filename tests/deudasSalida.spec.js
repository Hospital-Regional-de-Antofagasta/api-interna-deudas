const supertest = require("supertest");
const app = require("../api/app");
const mongoose = require("mongoose");
const Deudas = require("../api/models/Deudas");
const deudasSeed = require("../tests/testSeeds/deudasSeed.json");
const deudasAInsertarSeed = require("../tests/testSeeds/deudasAInsertarSeed.json");
const deudasAActualizarSeed = require("../tests/testSeeds/deudasAActualizarSeed.json");
const deudasAEliminarSeed = require("../tests/testSeeds/deudasAEliminarSeed.json");

const request = supertest(app);

const token = process.env.HRADB_A_MONGODB_SECRET;

const deudaGuardar = {
  correlativo: 9,
  rutPaciente: "11111111-1",
  fecha: "2000-04-25",
  identificador: "70118",
  valor: 8768,
  deuda: 8768,
  tipo: "PAGARE",
  codigoEstablecimiento: "HRA",
  nombreEstablecimiento: "Hospital Regional Antofagasta Dr. Leonardo Guzmán",
  rutDeudor: "11111111-1",
  nombreDeudor: "nombre deudor",
};

const deudaActualizar = {
  correlativo: 2,
  rutPaciente: "22222222-2",
  fecha: "2000-04-25",
  identificador: "9911100173",
  valor: 8768,
  deuda: 8768,
  tipo: "PAGARE",
  codigoEstablecimiento: "HRA",
  nombreEstablecimiento: "Hospital Regional Antofagasta Dr. Leonardo Guzmán",
  rutDeudor: "11111111-1",
  nombreDeudor: "nombre deudor",
};

beforeEach(async () => {
  await mongoose.disconnect();
  await mongoose.connect(`${process.env.MONGO_URI}/deudas_salida_test`, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });
  await Deudas.create(deudasSeed);
});

afterEach(async () => {
  await Deudas.deleteMany();
  await mongoose.disconnect();
});

// afterAll(async () => {
//   await mongoose.disconnect();
// });

describe("Endpoints deudas salida", () => {
  describe("POST /inter-mongo-deudas/salida", () => {
    it("Should not save deuda without token", async () => {
      const response = await request
        .post("/inter-mongo-deudas/salida")
        .send(deudaGuardar);

      expect(response.status).toBe(401);

      expect(response.body.error).toBe("Acceso no autorizado.");

      const deudaDespues = await Deudas.findOne({
        $and: [
          { correlativo: deudaGuardar.correlativo },
          { codigoEstablecimiento: deudaGuardar.codigoEstablecimiento },
        ],
      });

      expect(deudaDespues).toBeFalsy();
    });
    it("Should not save deuda with invalid token", async () => {
      const response = await request
        .post("/inter-mongo-deudas/salida")
        .set("Authorization", "no-token")
        .send(deudaGuardar);

      expect(response.status).toBe(401);

      expect(response.body.error).toBe("Acceso no autorizado.");

      const deudaDespues = await Deudas.findOne({
        $and: [
          { correlativo: deudaGuardar.correlativo },
          { codigoEstablecimiento: deudaGuardar.codigoEstablecimiento },
        ],
      });

      expect(deudaDespues).toBeFalsy();
    });
    it("Should save deuda", async () => {
      const response = await request
        .post("/inter-mongo-deudas/salida")
        .set("Authorization", token)
        .send([deudaGuardar]);

      expect(response.status).toBe(201);

      const deudaDespues = await Deudas.findOne({
        $and: [
          { correlativo: deudaGuardar.correlativo },
          { codigoEstablecimiento: deudaGuardar.codigoEstablecimiento },
        ],
      }).exec();

      expect(deudaDespues).toBeTruthy();
      expect(deudaDespues.correlativo).toBe(deudaGuardar.correlativo);
      expect(deudaDespues.rutPaciente).toBe(deudaGuardar.rutPaciente);
      expect(Date.parse(deudaDespues.fecha)).toBe(
        Date.parse(deudaGuardar.fecha)
      );
      expect(deudaDespues.identificador).toBe(deudaGuardar.identificador);
      expect(deudaDespues.valor).toBe(deudaGuardar.valor);
      expect(deudaDespues.deuda).toBe(deudaGuardar.deuda);
      expect(deudaDespues.tipo).toBe(deudaGuardar.tipo);
      expect(deudaDespues.codigoEstablecimiento).toBe(
        deudaGuardar.codigoEstablecimiento
      );
      expect(deudaDespues.nombreEstablecimiento).toBe(
        deudaGuardar.nombreEstablecimiento
      );
      expect(deudaDespues.rutDeudor).toBe(deudaGuardar.rutDeudor);
      expect(deudaDespues.nombreDeudor).toBe(deudaGuardar.nombreDeudor);
    });
    it("Should save multiple deudas and return errors", async () => {
      const response = await request
        .post("/inter-mongo-deudas/salida")
        .set("Authorization", token)
        .send(deudasAInsertarSeed);

      expect(response.status).toBe(201);

      const deudasBD = await Deudas.find().exec();

      expect(deudasBD.length).toBe(10);

      const { respuesta } = response.body;

      expect(respuesta.length).toBe(7);
      expect(respuesta).toEqual([
        {
          afectado: 1,
          realizado: true,
          error: "La deuda ya existe.",
        },
        {
          afectado: 13,
          realizado: true,
          error: "",
        },
        {
          afectado: 2,
          realizado: true,
          error: "La deuda ya existe.",
        },
        {
          afectado: 14,
          realizado: true,
          error: "",
        },
        {
          afectado: 16,
          realizado: false,
          error:
            "MongoServerError - E11000 duplicate key error collection: deudas_salida_test.deudas index: _id_ dup key: { _id: ObjectId('303030303030303030303031') }",
        },
        {
          afectado: 15,
          realizado: true,
          error: "",
        },
        {
          afectado: 4,
          realizado: true,
          error: "La deuda ya existe.",
        },
      ]);
    });
  });
  describe("PUT /inter-mongo-deudas/salida", () => {
    it("Should not update deuda without token", async () => {
      const deudaAntes = await Deudas.findOne({
        $and: [
          { correlativo: deudaActualizar.correlativo },
          {
            codigoEstablecimiento: deudaActualizar.codigoEstablecimiento,
          },
        ],
      }).exec();

      const response = await request
        .put("/inter-mongo-deudas/salida")
        .send(deudaActualizar);

      expect(response.status).toBe(401);

      expect(response.body.error).toBe("Acceso no autorizado.");

      const deudaDespues = await Deudas.findOne({
        $and: [
          { correlativo: deudaActualizar.correlativo },
          {
            codigoEstablecimiento: deudaActualizar.codigoEstablecimiento,
          },
        ],
      }).exec();

      expect(deudaAntes).toEqual(deudaDespues);
    });
    it("Should not update deuda with invalid token", async () => {
      const deudaAntes = await Deudas.findOne({
        $and: [
          { correlativo: deudaActualizar.correlativo },
          {
            codigoEstablecimiento: deudaActualizar.codigoEstablecimiento,
          },
        ],
      }).exec();

      const response = await request
        .put("/inter-mongo-deudas/salida")
        .set("Authorization", "no-token")
        .send(deudaActualizar);

      expect(response.status).toBe(401);

      expect(response.body.error).toBe("Acceso no autorizado.");

      const deudaDespues = await Deudas.findOne({
        $and: [
          { correlativo: deudaActualizar.correlativo },
          {
            codigoEstablecimiento: deudaActualizar.codigoEstablecimiento,
          },
        ],
      }).exec();

      expect(deudaAntes).toEqual(deudaDespues);
    });
    it("Should update deuda", async () => {
      const response = await request
        .put("/inter-mongo-deudas/salida")
        .set("Authorization", token)
        .send([deudaActualizar]);

      expect(response.status).toBe(200);

      const deudaDespues = await Deudas.findOne({
        $and: [
          { correlativo: deudaActualizar.correlativo },
          {
            codigoEstablecimiento: deudaActualizar.codigoEstablecimiento,
          },
        ],
      }).exec();

      expect(deudaDespues.correlativo).toBe(deudaActualizar.correlativo);
      expect(deudaDespues.rutPaciente).toBe(deudaActualizar.rutPaciente);
      expect(Date.parse(deudaDespues.fecha)).toBe(
        Date.parse(deudaActualizar.fecha)
      );
      expect(deudaDespues.identificador).toBe(deudaActualizar.identificador);
      expect(deudaDespues.valor).toBe(deudaActualizar.valor);
      expect(deudaDespues.deuda).toBe(deudaActualizar.deuda);
      expect(deudaDespues.tipo).toBe(deudaActualizar.tipo);
      expect(deudaDespues.codigoEstablecimiento).toBe(
        deudaActualizar.codigoEstablecimiento
      );
      expect(deudaDespues.nombreEstablecimiento).toBe(
        deudaActualizar.nombreEstablecimiento
      );
      expect(deudaDespues.rutDeudor).toBe(deudaActualizar.rutDeudor);
      expect(deudaDespues.nombreDeudor).toBe(deudaActualizar.nombreDeudor);
    });
    it("Should update multiple deudas and return errors", async () => {
      const response = await request
        .put("/inter-mongo-deudas/salida")
        .set("Authorization", token)
        .send(deudasAActualizarSeed);

      expect(response.status).toBe(200);

      const { respuesta } = response.body;

      expect(respuesta.length).toBe(4);

      expect(respuesta).toEqual([
        {
          afectado: 10,
          realizado: false,
          error: "La deuda no existe.",
        },
        {
          afectado: 2,
          realizado: true,
          error: "",
        },
        {
          afectado: 3,
          realizado: false,
          error:
            "MongoServerError - Performing an update on the path '_id' would modify the immutable field '_id'",
        },
        {
          afectado: 3,
          realizado: true,
          error: "",
        },
      ]);
    });
  });
  describe("DELETE /inter-mongo-deudas/salida", () => {
    it("Should not delete deuda without token", async () => {
      const deudaAntes = await Deudas.findOne({
        $and: [
          { correlativo: 1 },
          {
            codigoEstablecimiento: "HRA",
          },
        ],
      }).exec();

      const response = await request
        .delete("/inter-mongo-deudas/salida")
        .send([{ correlativo: 1, codigoEstablecimiento: "HRA" }]);

      expect(response.status).toBe(401);

      expect(response.body.error).toBe("Acceso no autorizado.");

      const deudaDespues = await Deudas.findOne({
        $and: [
          { correlativo: 1 },
          {
            codigoEstablecimiento: "HRA",
          },
        ],
      }).exec();

      expect(deudaAntes).toEqual(deudaDespues);
    });
    it("Should not delete deuda with invalid token", async () => {
      const deudaAntes = await Deudas.findOne({
        $and: [
          { correlativo: 1 },
          {
            codigoEstablecimiento: "HRA",
          },
        ],
      }).exec();

      const response = await request
        .delete("/inter-mongo-deudas/salida")
        .set("Authorization", "no-token")
        .send([{ correlativo: 1, codigoEstablecimiento: "HRA" }]);

      expect(response.status).toBe(401);

      expect(response.body.error).toBe("Acceso no autorizado.");

      const deudaDespues = await Deudas.findOne({
        $and: [
          { correlativo: 1 },
          {
            codigoEstablecimiento: "HRA",
          },
        ],
      }).exec();

      expect(deudaAntes).toEqual(deudaDespues);
    });
    it("Should delete deuda", async () => {
      const response = await request
        .delete("/inter-mongo-deudas/salida")
        .set("Authorization", token)
        .send([{ correlativo: 1, codigoEstablecimiento: "HRA" }]);

      const deudaDespues = await Deudas.findOne({
        $and: [
          { correlativo: 1 },
          {
            codigoEstablecimiento: "HRA",
          },
        ],
      }).exec();

      expect(response.status).toBe(200);
      expect(deudaDespues).toBeFalsy();
    });
    it("Should delete multiple deudas and return errors", async () => {
      const response = await request
        .delete("/inter-mongo-deudas/salida")
        .set("Authorization", token)
        .send(deudasAEliminarSeed);

      expect(response.status).toBe(200);

      const deudasBD = await Deudas.find().exec();

      expect(deudasBD.length).toBe(5);

      const { respuesta } = response.body;

      expect(respuesta.length).toBe(4);
      expect(respuesta).toEqual([
        {
          afectado: 14,
          realizado: true,
          error: "La deuda no existe.",
        },
        {
          afectado: 1,
          realizado: true,
          error: "",
        },
        {
          afectado: 15,
          realizado: true,
          error: "La deuda no existe.",
        },
        {
          afectado: 3,
          realizado: true,
          error: "",
        },
      ]);
    });
  });
});

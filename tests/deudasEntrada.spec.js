const supertest = require("supertest");
const app = require("../api/app");
const mongoose = require("mongoose");
const Deudas = require("../api/models/Deudas");
const deudasSeed = require("../tests/testSeeds/deudasSeed.json");
const OrdenesFlow = require("../api/models/OrdenesFlow");
const ordenesFlowSeed = require("../tests/testSeeds/ordenesFlowSeed.json");
const muchasOrdenesFlowSeed = require("../tests/testSeeds/muchasOrdenesFlowSeed.json");
const ordenesFlowAActualizar = require("../tests/testSeeds/ordenesFlowAActualizar.json");

const request = supertest(app);

const token = process.env.HRADB_A_MONGODB_SECRET;

beforeEach(async () => {
  await mongoose.disconnect();
  await mongoose.connect(`${process.env.MONGO_URI}/deudas_entrada_test`, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });
  await Deudas.create(deudasSeed);
  await OrdenesFlow.create(ordenesFlowSeed);
});

afterEach(async () => {
  await Deudas.deleteMany();
  await OrdenesFlow.deleteMany();
  await mongoose.disconnect();
});

describe("Endpoints deudas entrada", () => {
  describe("GET /inter-mongo-deudas/entrada/pagos?codigoEstablecimiento=<codigoEstablecimiento>", () => {
    it("Should not get ordenes flow without token", async () => {
      const response = await request.get("/inter-mongo-deudas/entrada/pagos");

      expect(response.status).toBe(401);
      expect(response.body.error).toBe("Acceso no autorizado.");
    });
    it("Should not get ordenes flow with invalid token", async () => {
      const response = await request
        .get("/inter-mongo-deudas/entrada/pagos")
        .set("Authorization", "no-token");

      expect(response.status).toBe(401);
      expect(response.body.error).toBe("Acceso no autorizado.");
    });
    it("Should not get ordenes flow without codigo establecimiento", async () => {
      const response = await request
        .get("/inter-mongo-deudas/entrada/pagos")
        .set("Authorization", token);

      expect(response.status).toBe(400);
      expect(response.body.error).toBe(
        "Se debe enviar el codigo del establecimiento."
      );
    });
    it("Should get a maximum of 100 ordenes flow", async () => {
      await OrdenesFlow.deleteMany();
      await OrdenesFlow.create(muchasOrdenesFlowSeed);
      const response = await request
        .get("/inter-mongo-deudas/entrada/pagos?codigoEstablecimiento=HRA")
        .set("Authorization", token);

      expect(response.status).toBe(200);
      expect(response.body.length).toBe(100);
    });
    it("Should get ordenes flow", async () => {
      const response = await request
        .get("/inter-mongo-deudas/entrada/pagos?codigoEstablecimiento=HRA")
        .set("Authorization", token);

      expect(response.status).toBe(200);
      expect(response.body.length).toBe(3);

      expect(response.body[0].token).toBe("125");
      expect(response.body[0].flowOrder).toBe("125");
      expect(response.body[0].estado).toBe("PAGADA");
      expect(response.body[0].pagos.length).toBe(2);
      expect(response.body[0].pagos[0].idDeuda).toBe(
        "303030303030303030303032"
      );
      expect(response.body[0].pagos[0].correlativoDeuda).toBe(2);
      expect(response.body[0].pagos[0].abono).toBe(1000);
      expect(response.body[0].pagos[1].idDeuda).toBe(
        "303030303030303030303034"
      );
      expect(response.body[0].pagos[1].correlativoDeuda).toBe(4);
      expect(response.body[0].pagos[1].abono).toBe(3000);
      expect(response.body[0].commerceOrder).toBe("commerceOrder");
      expect(response.body[1].token).toBe("128");
      expect(response.body[1].flowOrder).toBe("128");
      expect(response.body[1].estado).toBe("ERROR_FLOW");
      expect(response.body[1].pagos.length).toBe(1);
      expect(response.body[1].pagos[0].idDeuda).toBe(
        "303030303030303030303033"
      );
      expect(response.body[1].pagos[0].correlativoDeuda).toBe(3);
      expect(response.body[1].pagos[0].abono).toBe(1000);
      expect(response.body[1].commerceOrder).toBe("commerceOrder");
      expect(response.body[2].token).toBe("129");
      expect(response.body[2].flowOrder).toBe("129");
      expect(response.body[2].estado).toBe("ERROR_VALIDACION");
      expect(response.body[2].pagos.length).toBe(1);
      expect(response.body[2].pagos[0].idDeuda).toBe(
        "303030303030303030303037"
      );
      expect(response.body[2].pagos[0].correlativoDeuda).toBe(6);
      expect(response.body[2].pagos[0].abono).toBe(1000);
      expect(response.body[2].commerceOrder).toBe("commerceOrder");
    });
  });
  describe("PUT /inter-mongo-deudas/entrada/pagos", () => {
    it("Should not update pagos without token", async () => {
      const response = await request.put("/inter-mongo-deudas/entrada/pagos");

      expect(response.status).toBe(401);
      expect(response.body.error).toBe("Acceso no autorizado.");
    });
    it("Should not update pagos with invalid token", async () => {
      const response = await request
        .put("/inter-mongo-deudas/entrada/pagos")
        .set("Authorization", "no-token");

      expect(response.status).toBe(401);
      expect(response.body.error).toBe("Acceso no autorizado.");
    });
    it("Should update orden flow", async () => {
      const response = await request
        .put("/inter-mongo-deudas/entrada/pagos")
        .set("Authorization", token)
        .send([ordenesFlowAActualizar[0]]);

      expect(response.status).toBe(200);

      const { respuesta } = response.body;

      expect(respuesta).toEqual([
        {
          afectado: "000000000003",
          realizado: true,
          error: "",
        },
      ]);

      const ordenFlowActualizada = await OrdenesFlow.findOne({
        _id: "000000000003",
      });

      expect(ordenFlowActualizada.token).toBe("125");
      expect(ordenFlowActualizada.flowOrder).toBe("125");
      expect(ordenFlowActualizada.estado).toBe("VALIDADA");
      expect(ordenFlowActualizada.pagos[0].idDeuda.toString()).toBe(
        "303030303030303030303032"
      );
      expect(ordenFlowActualizada.pagos[0].abono).toBe(1000);
      expect(ordenFlowActualizada.pagos[1].idDeuda.toString()).toBe(
        "303030303030303030303034"
      );
      expect(ordenFlowActualizada.pagos[1].abono).toBe(3000);
      expect(ordenFlowActualizada.commerceOrder).toBe("commerceOrder");
    });
    it("Should update multiple ordenes flow", async () => {
      const response = await request
        .put("/inter-mongo-deudas/entrada/pagos")
        .set("Authorization", token)
        .send(ordenesFlowAActualizar);

      expect(response.status).toBe(200);

      const { respuesta } = response.body;

      expect(respuesta).toEqual([
        {
          afectado: "000000000003",
          realizado: true,
          error: "",
        },
        {
          afectado: "000000000013",
          realizado: false,
          error: "La orden de flow no existe.",
        },
        {
          afectado: "000000000006",
          realizado: true,
          error: "",
        },
        {
          afectado: "000000000007",
          realizado: true,
          error: "",
        },
      ]);
    });
  });
});

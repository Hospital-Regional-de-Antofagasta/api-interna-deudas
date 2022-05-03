const supertest = require("supertest");
const app = require("../api/app");
const mongoose = require("mongoose");
// const Deudas = require("../api/models/Deudas");
// const deudasSeed = require("../tests/testSeeds/deudasSeed.json");
const OrdenesFlow = require("../api/models/OrdenesFlow");
const ordenesFlowSeed = require("../tests/testSeeds/ordenesFlowSeed.json");
// const muchasOrdenesFlowSeed = require("../tests/testSeeds/muchasOrdenesFlowSeed.json");
const ordenesFlowAActualizar = require("../tests/testSeeds/ordenesFlowAActualizar.json");

const request = supertest(app);

const token = process.env.HRADB_A_MONGODB_SECRET;

beforeEach(async () => {
  await mongoose.disconnect();
  await mongoose.connect(`${process.env.MONGO_URI}/deudas_entrada_test`, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });
  // await Deudas.create(deudasSeed);
  await OrdenesFlow.create(ordenesFlowSeed, { validateBeforeSave: false });
});

afterEach(async () => {
  // await Deudas.deleteMany();
  await OrdenesFlow.deleteMany();
  await mongoose.disconnect();
});

describe("Endpoints deudas entrada", () => {
  describe("GET /inter-mongo-deudas/entrada/pagos?codigoEstablecimiento=<codigoEstablecimiento>", () => {
    it("Debería retornar error si no se recibe token.", async () => {
      const response = await request.get(
        "/inter-mongo-deudas/entrada/pagos?codigoEstablecimiento=HRA"
      );

      expect(response.status).toBe(401);
      expect(response.body.error).toBe("Acceso no autorizado.");
    });
    it("Debería retornar error si el token es invalido.", async () => {
      const response = await request
        .get("/inter-mongo-deudas/entrada/pagos?codigoEstablecimiento=HRA")
        .set("Authorization", "no-token");

      expect(response.status).toBe(401);
      expect(response.body.error).toBe("Acceso no autorizado.");
    });
    it('Debería retornar error si no se envió el "codigoEstablecimiento".', async () => {
      const response = await request
        .get("/inter-mongo-deudas/entrada/pagos")
        .set("Authorization", token);

      expect(response.status).toBe(400);
      expect(response.body.error).toBe(
        "Se debe enviar el codigo del establecimiento."
      );
    });
    it('Debería retornar solo ordenes Flow en estado "PAGADA", "ANULADA", "RECHAZADA" o "ERROR_FLOW".', async () => {
      const response = await request
        .get("/inter-mongo-deudas/entrada/pagos?codigoEstablecimiento=HRA")
        .set("Authorization", token);

      expect(response.status).toBe(200);

      expect(response.body.length).toBe(100)

      expect(response.body.filter(e=>e.estado==="PAGADA").length).toBe(6)
      expect(response.body.filter(e=>e.estado==="ANULADA").length).toBe(15)
      expect(response.body.filter(e=>e.estado==="RECHAZADA").length).toBe(33)
      expect(response.body.filter(e=>e.estado==="ERROR_FLOW").length).toBe(46)
      expect(response.body.filter(e=>e.estado==="ERROR_FLOW_CONFIRMADO").length).toBe(0)
      expect(response.body.filter(e=>e.estado==="ERROR_FLOW_INFORMADO").length).toBe(0)
    });
    it("Debería retornar máximo 100 ordenes Flow.", async () => {
      const response = await request
        .get("/inter-mongo-deudas/entrada/pagos?codigoEstablecimiento=HRA")
        .set("Authorization", token);

      expect(response.status).toBe(200);
      expect(response.body.length).toBe(100);
    });
  });
  // describe("PUT /inter-mongo-deudas/entrada/pagos", () => {
  //   it("Should not update pagos without token", async () => {
  //     const response = await request.put("/inter-mongo-deudas/entrada/pagos");

  //     expect(response.status).toBe(401);
  //     expect(response.body.error).toBe("Acceso no autorizado.");
  //   });
  //   it("Should not update pagos with invalid token", async () => {
  //     const response = await request
  //       .put("/inter-mongo-deudas/entrada/pagos")
  //       .set("Authorization", "no-token");

  //     expect(response.status).toBe(401);
  //     expect(response.body.error).toBe("Acceso no autorizado.");
  //   });
  //   it("Should update orden flow", async () => {
  //     const response = await request
  //       .put("/inter-mongo-deudas/entrada/pagos")
  //       .set("Authorization", token)
  //       .send([ordenesFlowAActualizar[0]]);

  //     expect(response.status).toBe(200);

  //     const { respuesta } = response.body;

  //     expect(respuesta).toEqual([
  //       {
  //         afectado: "000000000003",
  //         realizado: true,
  //         error: "",
  //       },
  //     ]);

  //     const ordenFlowActualizada = await OrdenesFlow.findOne({
  //       _id: "000000000003",
  //     });

  //     expect(ordenFlowActualizada.token).toBe("125");
  //     expect(ordenFlowActualizada.flowOrder).toBe("125");
  //     expect(ordenFlowActualizada.estado).toBe("VALIDADA");
  //     expect(ordenFlowActualizada.pagos[0].idDeuda.toString()).toBe(
  //       "303030303030303030303032"
  //     );
  //     expect(ordenFlowActualizada.pagos[0].abono).toBe(1000);
  //     expect(ordenFlowActualizada.pagos[1].idDeuda.toString()).toBe(
  //       "303030303030303030303034"
  //     );
  //     expect(ordenFlowActualizada.pagos[1].abono).toBe(3000);
  //     expect(ordenFlowActualizada.commerceOrder).toBe("commerceOrder");
  //     expect(ordenFlowActualizada.rutPaciente).toBe("11111111-1");
  //   });
  //   it("Should update multiple ordenes flow", async () => {
  //     const response = await request
  //       .put("/inter-mongo-deudas/entrada/pagos")
  //       .set("Authorization", token)
  //       .send(ordenesFlowAActualizar);

  //     expect(response.status).toBe(200);

  //     const { respuesta } = response.body;

  //     expect(respuesta).toEqual([
  //       {
  //         afectado: "000000000003",
  //         realizado: true,
  //         error: "",
  //       },
  //       {
  //         afectado: "000000000013",
  //         realizado: false,
  //         error: "La orden de flow no existe.",
  //       },
  //       {
  //         afectado: "000000000006",
  //         realizado: true,
  //         error: "",
  //       },
  //       {
  //         afectado: "000000000007",
  //         realizado: true,
  //         error: "",
  //       },
  //     ]);
  //   });
  // });
});

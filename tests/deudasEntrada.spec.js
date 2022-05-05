const supertest = require("supertest");
const app = require("../api/app");
const mongoose = require("mongoose");
const OrdenesFlow = require("../api/models/OrdenesFlow");
const ordenesFlowSeed = require("../tests/testSeeds/ordenesFlowSeed.json");
const ordenesFlowAActualizar = require("../tests/testSeeds/ordenesFlowAActualizar.json");
const ordenesFlowAEliminar = require("../tests/testSeeds/ordenesFlowAEliminar.json");

const request = supertest(app);

const token = process.env.HRADB_A_MONGODB_SECRET;

beforeEach(async () => {
  await mongoose.disconnect();
  await mongoose.connect(`${process.env.MONGO_URI}/deudas_entrada_test`, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });
  await OrdenesFlow.create(ordenesFlowSeed, { validateBeforeSave: false });
});

afterEach(async () => {
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

      expect(response.body.length).toBe(100);

      const ordenesFlowPagadas = response.body.filter(
        (e) => e.estado === "PAGADA"
      );
      expect(ordenesFlowPagadas.length).toBe(6);
      expect(ordenesFlowPagadas[0]._id).toBeFalsy();
      expect(ordenesFlowPagadas[0].flowOrder).toBe("722907");
      expect(ordenesFlowPagadas[0].token).toBe(
        "bYEzJP36Sp3G7b5ISEUYJ8XdpuppNG"
      );
      expect(ordenesFlowPagadas[0].commerceOrder).toBe(
        "274e124f-cd93-43b7-8ecd-27fb5f7b220c"
      );
      expect(ordenesFlowPagadas[0].rutPaciente).toBe("22222222-2");
      expect(ordenesFlowPagadas[0].emailPagador).toBe("zglossup5@toplist.cz");
      expect(ordenesFlowPagadas[0].rutPagador).toBe("11111111-1");
      expect(ordenesFlowPagadas[0].estado).toBe("PAGADA");
      expect(ordenesFlowPagadas[0].registradoEnEstablecimiento).toBeFalsy();
      expect(ordenesFlowPagadas[0].pagos[0]._id).toBeFalsy();
      expect(ordenesFlowPagadas[0].pagos[0].identificadorDeuda).toBe("YI9xGVg");
      expect(ordenesFlowPagadas[0].pagos[0].tipoDeuda).toBe("PAGARE");
      expect(ordenesFlowPagadas[0].pagos[0].codigoEstablecimientoDeuda).toBe(
        "HRA"
      );
      expect(ordenesFlowPagadas[0].pagos[0].abono).toBe(372127933);

      const ordenesFlowAnuladas = response.body.filter(
        (e) => e.estado === "ANULADA"
      );
      expect(ordenesFlowAnuladas.length).toBe(15);

      const ordenesFlowRechazadas = response.body.filter(
        (e) => e.estado === "RECHAZADA"
      );
      expect(ordenesFlowRechazadas.length).toBe(33);

      const ordenesFlowErrorFlow = response.body.filter(
        (e) => e.estado === "ERROR_FLOW"
      );
      expect(ordenesFlowErrorFlow.length).toBe(46);

      const ordenesFlowErrorFlowConfirmado = response.body.filter(
        (e) => e.estado === "ERROR_FLOW_CONFIRMADO"
      );
      expect(ordenesFlowErrorFlowConfirmado.length).toBe(0);

      const ordenesFlowErrorFlowInformado = response.body.filter(
        (e) => e.estado === "ERROR_FLOW_INFORMADO"
      );
      expect(ordenesFlowErrorFlowInformado.length).toBe(0);
    });
    it("Debería retornar máximo 100 ordenes Flow.", async () => {
      const response = await request
        .get("/inter-mongo-deudas/entrada/pagos?codigoEstablecimiento=HRA")
        .set("Authorization", token);

      expect(response.status).toBe(200);
      expect(response.body.length).toBe(100);
    });
  });
  describe("PUT /inter-mongo-deudas/entrada/pagos", () => {
    it("Debería retornar error si no se recibe token.", async () => {
      const response = await request.put("/inter-mongo-deudas/entrada/pagos");

      expect(response.status).toBe(401);
      expect(response.body.error).toBe("Acceso no autorizado.");
    });
    it("Debería retornar error si el token es invalido.", async () => {
      const response = await request
        .put("/inter-mongo-deudas/entrada/pagos")
        .set("Authorization", "no-token");

      expect(response.status).toBe(401);
      expect(response.body.error).toBe("Acceso no autorizado.");
    });
    it("Debería realizar la actualización para la orden Flow y retornar si la actualización fue éxitosa.", async () => {
      const response = await request
        .put("/inter-mongo-deudas/entrada/pagos")
        .set("Authorization", token)
        .send([ordenesFlowAActualizar[0]]);

      expect(response.status).toBe(200);

      const { respuesta } = response.body;

      expect(respuesta).toEqual([
        {
          afectado: "988411",
          realizado: true,
          error: "",
        },
      ]);

      const ordenFlowActualizada = await OrdenesFlow.findOne({
        _id: "62718b21fc13ae7dd20004d0",
      });

      expect(ordenFlowActualizada.flowOrder).toBe("988411");
      expect(ordenFlowActualizada.token).toBe(
        "KysBmS2OHnaZ0BpwZbsWmj3iuTJxrc1"
      );
      expect(ordenFlowActualizada.commerceOrder).toBe(
        "cbde4c0a-2d8d-40d0-97e4-d2f21f0c9f2e1"
      );
      expect(ordenFlowActualizada.rutPaciente).toBe("22222222-21");
      expect(ordenFlowActualizada.emailPagador).toBe(
        "chorley8m@theatlantic.com1"
      );
      expect(ordenFlowActualizada.rutPagador).toBe("22222222-21");
      expect(ordenFlowActualizada.estado).toBe("PAGADA1");
      expect(ordenFlowActualizada.registradoEnEstablecimiento).toBeTruthy();
      expect(ordenFlowActualizada.pagos.length).toBe(1);
      expect(ordenFlowActualizada.pagos[0].identificadorDeuda.toString()).toBe(
        "gultN7Y1"
      );
      expect(ordenFlowActualizada.pagos[0].tipoDeuda).toBe("PAGARE1");
      expect(ordenFlowActualizada.pagos[0].codigoEstablecimientoDeuda).toBe(
        "HRA1"
      );
      expect(ordenFlowActualizada.pagos[0].abono).toBe(4613302531);
    });
    it("Debería realizar actualizaciones para multiples ordenes Flow y retornar si las actualizaciones fueron éxitosas (probar con ordenes que no existan).", async () => {
      const response = await request
        .put("/inter-mongo-deudas/entrada/pagos")
        .set("Authorization", token)
        .send(ordenesFlowAActualizar);

      expect(response.status).toBe(200);

      const { respuesta } = response.body;

      expect(respuesta).toEqual([
        {
          afectado: "988411",
          realizado: true,
          error: "",
        },
        {
          afectado: "6101461",
          realizado: false,
          error: "La orden de flow no existe.",
        },
        {
          afectado: "811832",
          realizado: true,
          error: "",
        },
        {
          afectado: "476015",
          realizado: false,
          error:
            'CastError - Cast to ObjectId failed for value "62718b22fc13ae7dd20008181" (type string) at path "_id"',
        },
      ]);
    });
  });
  describe("DELETE /inter-mongo-deudas/entrada/pagos", () => {
    it("Debería retornar error si no se recibe token.", async () => {
      const response = await request.delete(
        "/inter-mongo-deudas/entrada/pagos"
      );

      expect(response.status).toBe(401);
      expect(response.body.error).toBe("Acceso no autorizado.");
    });
    it("Debería retornar error si el token es invalido.", async () => {
      const response = await request
        .delete("/inter-mongo-deudas/entrada/pagos")
        .set("Authorization", "no-token");

      expect(response.status).toBe(401);
      expect(response.body.error).toBe("Acceso no autorizado.");
    });
    it("Debería realizar la eliminación para la orden Flow y retornar si la eliminación fue éxitosa.", async () => {
      const response = await request
        .delete("/inter-mongo-deudas/entrada/pagos")
        .set("Authorization", token)
        .send([ordenesFlowAEliminar[0]]);

      expect(response.status).toBe(200);

      const { respuesta } = response.body;

      expect(respuesta).toEqual([
        {
          afectado: "988411",
          realizado: true,
          error: "",
        },
      ]);

      const ordenFlowEliminada = await OrdenesFlow.findOne({
        _id: "62718b21fc13ae7dd20004d0",
      });

      expect(ordenFlowEliminada).toBeFalsy();
    });
    it("Debería realizar eliminaciones para multiples ordenes Flow y retornar si las eliminaciones fueron éxitosas (probar con ordenes que no existan).", async () => {
      const response = await request
        .delete("/inter-mongo-deudas/entrada/pagos")
        .set("Authorization", token)
        .send(ordenesFlowAEliminar);

      expect(response.status).toBe(200);

      const { respuesta } = response.body;

      expect(respuesta).toEqual([
        {
          afectado: "988411",
          realizado: true,
          error: "",
        },
        {
          afectado: "6101461",
          realizado: false,
          error: "La orden de flow no existe.",
        },
        {
          afectado: "811832",
          realizado: true,
          error: "",
        },
        {
          afectado: "476015",
          realizado: true,
          error: "",
        },
      ]);
    });
  });
});

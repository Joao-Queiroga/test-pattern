import { expect, jest } from "@jest/globals";
import { CarrinhoBuilder } from "./builders/CarrinhoBuilder.js";
import { UserMother } from "./builders/UserMother.js";
import { CheckoutService } from "../src/services/CheckoutService.js";
import { Item } from "../src/domain/Item.js";

// Etapa 4 – Padrão Stub (falha no pagamento)
describe("quando o pagamento falha", () => {
  test("deve retornar null quando o pagamento não é aprovado", async () => {
    const carrinho = new CarrinhoBuilder()
      .comUser(UserMother.umUsuarioPadrao())
      .build();

    const gatewayStub = {
      cobrar: jest.fn().mockResolvedValue({ success: false }),
    };

    const repositoryDummy = {};
    const emailServiceDummy = {};

    const checkoutService = new CheckoutService(
      gatewayStub,
      repositoryDummy,
      emailServiceDummy,
    );

    const pedido = await checkoutService.processarPedido(
      carrinho,
      "1234-5678-9999-0000",
    );

    expect(pedido).toBeNull();
  });
});

// Etapa 5 – Padrão Mock (sucesso com cliente Premium)
describe("quando um cliente Premium finaliza a compra", () => {
  test("deve aplicar desconto e enviar e-mail de confirmação", async () => {
    const usuarioPremium = UserMother.umUsuarioPremium();

    const carrinho = new CarrinhoBuilder()
      .comUser(usuarioPremium)
      .comItens([new Item("Produto 1", 100), new Item("Produto 2", 100)])
      .build();

    const gatewayStub = {
      cobrar: jest.fn().mockResolvedValue({ success: true }),
    };

    const pedidoRepositoryStub = {
      salvar: jest.fn().mockResolvedValue({ id: 1, ...carrinho }),
    };

    const emailMock = {
      enviarEmail: jest.fn(),
    };

    const checkoutService = new CheckoutService(
      gatewayStub,
      pedidoRepositoryStub,
      emailMock,
    );

    const pedido = await checkoutService.processarPedido(
      carrinho,
      "1234-5678-9999-0000",
    );

    // Verificação de comportamento
    expect(gatewayStub.cobrar).toHaveBeenCalledWith(180, expect.anything());
    expect(emailMock.enviarEmail).toHaveBeenCalledTimes(1);
    expect(emailMock.enviarEmail).toHaveBeenCalledWith(
      "premium@exemplo.com",
      "Seu Pedido foi Aprovado!",
      expect.anything(),
    );
    expect(pedido).not.toBeNull();
  });
});

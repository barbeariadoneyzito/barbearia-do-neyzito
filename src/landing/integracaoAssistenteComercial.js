import { criarCatalogoService } from "../catalogo/catalogoService.js";
import { criarAtendimentoComercial } from "../comercial/atendimentoComercial.js";
import { criarAdaptadorAssistenteComercial } from "./adaptadorAssistenteComercial.js";
import { criarAdaptadorLandingAssistenteAgente } from "./agenteAssistenteComercial.js";

/**
 * Monta o adaptador da landing a partir de funções de leitura já autorizadas.
 *
 * A landing pública não deve ler as entidades administrativas `Instrucoes` ou
 * `HistoricoInstrucoes` diretamente. `instrucoes` e `carregarInstrucoes` existem
 * para testes e para uma futura injeção feita por backend/agente autorizado.
 * Quando não houver fonte segura, a landing deve operar com a lista vazia.
 */
export function criarAdaptadorLandingAssistenteComercial({
  carregarProdutos,
  carregarPromocoes = async () => [],
  carregarPromocaoItens = async () => [],
  instrucoes = [],
  carregarInstrucoes = null,
  agora = () => new Date(),
  config,
  agente = null,
  contextoAquisicao = null,
} = {}) {
  const catalogoService = criarCatalogoService({
    carregarProdutos,
    carregarPromocoes,
    carregarPromocaoItens,
    agora,
  });

  const atendimentoComercial = criarAtendimentoComercial({
    catalogoService,
    instrucoes,
    carregarInstrucoes,
    agora,
  });

  const adaptadorBase = criarAdaptadorAssistenteComercial({
    atendimentoComercial,
    config,
    agora,
  });

  if (agente) {
    return criarAdaptadorLandingAssistenteAgente({
      agente,
      atendimentoComercial,
      politica: adaptadorBase.politica,
      config,
      agora,
      contextoAquisicao,
    });
  }

  return adaptadorBase;
}

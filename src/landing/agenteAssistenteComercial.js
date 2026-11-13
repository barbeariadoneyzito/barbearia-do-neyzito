import { ATENDIMENTO_CONFIG } from "../comercial/config.js";
import { criarAtendimentoComHandoff, adicionarOfertaTransferencia } from "../comercial/atendimentoComHandoff.js";
import { criarPoliticaAtendimentoHumano } from "../comercial/atendimentoHumano.js";
import { INTENCOES, detectarIntencao } from "../comercial/intents.js";
import { criarApresentacaoResposta } from "./adaptadorAssistenteComercial.js";
import { spNowLabel } from "../lib/timezone.js";
import { MENSAGENS_FIM_DE_ANO, COMUNICADO_RECESSO } from "../catalogo/localCatalogData.js";

export const AGENT_NAME = "consultor_neyzito";

const EFEITOS_SEM_ACAO = Object.freeze({
  agendamentoConcluido: false,
  vendaConcluida: false,
  mensagemEnviada: false,
  linkAberto: false,
});

const BLOCOS_INTERNOS =
  /^\[Referência temporal[^\n]*\n\n(?:\[Contexto de aquisição[^\n]*\n(?:[^\n]*\n)*?\n)?/;

function gerarGeradoEm(agora = () => new Date()) {
  const data = typeof agora === "function" ? agora() : agora;
  const normalizada = data instanceof Date ? data : new Date(data);
  return Number.isNaN(normalizada.getTime())
    ? new Date().toISOString()
    : normalizada.toISOString();
}

function efeitosSemAcao() {
  return { ...EFEITOS_SEM_ACAO };
}

function normalizarCanal(canal = "generico") {
  return String(canal ?? "generico").trim().toLowerCase() || "generico";
}

function extrairConteudoRespostaAgente(resposta = {}) {
  const conteudo = resposta?.content ?? resposta?.texto ?? resposta?.mensagem ?? resposta?.resposta;
  if (typeof conteudo === "string") return conteudo;
  if (Array.isArray(conteudo)) {
    return conteudo
      .map((item) => (typeof item === "string" ? item : String(item?.content ?? item?.text ?? "")))
      .filter(Boolean)
      .join("\n");
  }
  if (conteudo && typeof conteudo === "object") {
    return String(conteudo.content ?? conteudo.text ?? conteudo.message ?? "");
  }
  return "";
}

function limparConteudoAgente(conteudo = "") {
  return String(conteudo ?? "")
    .replace(BLOCOS_INTERNOS, "")
    .trim();
}

function contextoTemporal(agora = () => new Date()) {
  const data = typeof agora === "function" ? agora() : agora;
  const normalizada = data instanceof Date ? data : new Date(data);
  const rotulo = Number.isNaN(normalizada.getTime())
    ? spNowLabel()
    : normalizada.toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" });

  return `[Referência temporal — fuso America/Sao_Paulo] Agora: ${rotulo}. Use SEMPRE este horário local de São Paulo (não o relógio do servidor, em UTC) para responder sobre expediente, dia da semana ou se está aberto agora.`;
}

function contextoAquisicao({ contexto, contextoAquisicao }) {
  if (typeof contextoAquisicao === "function") {
    return contextoAquisicao({ contexto });
  }

  return "";
}

/**
 * Detecta perguntas sobre fim de ano e retorna mensagem institucional.
 * Só responde quando o usuário mencionar o tema; não envia automaticamente.
 */
function obterMensagemFestivo(mensagem) {
  const texto = String(mensagem ?? "").trim().toLowerCase();
  const temFelizNatal = /feliz natal|natal/i.test(texto);
  const temAnoNovo = /ano novo|feliz ano novo|reveillon/i.test(texto);
  const boasFestas = /boas festas|festas de fim de ano/i.test(texto);
  const recesso = /recesso|feriado|fim de ano/i.test(texto);

  if (temFelizNatal) {
    return {
      versao: "1.0",
      canal: "generico",
      intencao: INTENCOES.FESTIVO,
      texto: `🎄 ${MENSAGENS_FIM_DE_ANO.felizNatal} 🎄`,
      dados: {},
      acoes: [],
      avisos: ["Aproveite o período festivo. O agendamento retorna após o fim de ano."],
      requerConfirmacaoOficial: false,
      efeitos: efeitosSemAcao(),
      geradoEm: gerarGeradoEm(),
    };
  }

  if (temAnoNovo) {
    return {
      versao: "1.0",
      canal: "generico",
      intencao: INTENCOES.FESTIVO,
      texto: `✨ ${MENSAGENS_FIM_DE_ANO.anoNovo} ✨`,
      dados: {},
      acoes: [],
      avisos: ["Que 2027 traga muitos novos looks e momentos incríveis!"],
      requerConfirmacaoOficial: false,
      efeitos: efeitosSemAcao(),
      geradoEm: gerarGeradoEm(),
    };
  }

  if (boasFestas) {
    return {
      versao: "1.0",
      canal: "generico",
      intencao: INTENCOES.FESTIVO,
      texto: `🎉 ${MENSAGENS_FIM_DE_ANO.boasFestas} 🎉`,
      dados: {},
      acoes: [],
      avisos: ["Obrigado por fazer parte da comunidade Barbearia do Neyzito."],
      requerConfirmacaoOficial: false,
      efeitos: efeitosSemAcao(),
      geradoEm: gerarGeradoEm(),
    };
  }

  if (recesso) {
    if (COMUNICADO_RECESSO.ativo) {
      return {
        versao: "1.0",
        canal: "generico",
        intencao: INTENCOES.FESTIVO,
        texto: `📅 ${COMUNICADO_RECESSO.mensagemRetorno ?? "Comunicado de recesso ativo."}`,
        dados: {},
        acoes: [],
        avisos: ["Horário de retorno conforme comunicado oficial."],
        requerConfirmacaoOficial: false,
        efeitos: efeitosSemAcao(),
        geradoEm: gerarGeradoEm(),
      };
    }
    return {
      versao: "1.0",
      canal: "generico",
      intencao: INTENCOES.FESTIVO,
      texto: `📅 Ainda não há comunicado de recesso oficial publicado.`,
      dados: {},
      acoes: [],
      avisos: ["As informações serão divulgadas quando confirmadas."],
      requerConfirmacaoOficial: false,
      efeitos: efeitosSemAcao(),
      geradoEm: gerarGeradoEm(),
    };
  }

  return null;
}

function respostaAgendamento({ canal, agora, config }) {
  return {
    versao: "1.0",
    canal,
    intencao: INTENCOES.AGENDAMENTO,
    texto: [
      "Perfeito. Vou te passar para o AppBarber oficial para finalizar o corte.",
      "Aqui não criamos reserva nem confirmamos horário; no AppBarber você escolhe o serviço, o profissional e o horário, e a confirmação e a verificação de disponibilidade acontecem lá.",
      "Sobre o valor, você confere no AppBarber junto com o serviço, o profissional e o horário; não informo valores por aqui.",
      `Use exclusivamente o endereço oficial: ${config.appBarberUrl}.`,
      "Nenhum agendamento foi criado por este módulo.",
    ].join("\n\n"),
    dados: {
      endereco: config.appBarberUrl,
      agendamentoConfirmado: false,
      requerConfirmacaoOficial: true,
    },
    acoes: [
      {
        tipo: "abrir_agendamento",
        url: config.appBarberUrl,
        rotulo: "Abrir AppBarber",
        executarAutomaticamente: false,
      },
    ],
    avisos: ["Nenhum agendamento foi criado por este módulo."],
    requerConfirmacaoOficial: true,
    efeitos: efeitosSemAcao(),
    geradoEm: gerarGeradoEm(agora),
  };
}

function respostaAtendimentoHumano({ canal, agora, config }) {
  return {
    versao: "1.0",
    canal,
    intencao: INTENCOES.ATENDIMENTO_HUMANO,
    texto: [
      `Para atendimento humano, use o WhatsApp oficial: ${config.whatsapp.numero}.`,
      "Nenhuma mensagem foi enviada por este módulo.",
    ].join(" "),
    dados: {
      telefone: config.whatsapp.numero,
      whatsappUrl: config.whatsapp.url,
      mensagemEnviada: false,
    },
    acoes: [
      {
        tipo: "abrir_whatsapp",
        url: config.whatsapp.url,
        rotulo: "Falar no WhatsApp",
        executarAutomaticamente: false,
      },
    ],
    avisos: ["A transferência para atendimento humano só ocorre se você solicitar."],
    requerConfirmacaoOficial: false,
    efeitos: efeitosSemAcao(),
    geradoEm: gerarGeradoEm(agora),
  };
}

function respostaSemInformacao({ canal, agora }) {
  return {
    versao: "1.0",
    canal,
    intencao: INTENCOES.NAO_ENTENDIDO,
    texto: "Essa informação eu não tenho. Posso informar sobre serviços, horários e a equipe.",
    dados: {},
    acoes: [],
    avisos: ["Nenhuma informação adicional foi retornada."],
    requerConfirmacaoOficial: false,
    efeitos: efeitosSemAcao(),
    geradoEm: gerarGeradoEm(agora),
  };
}

function criarRespostaAgente({
  respostaAgente,
  mensagem,
  contexto = {},
  canal,
  agora,
  config,
}) {
  const conteudo = limparConteudoAgente(extrairConteudoRespostaAgente(respostaAgente));
  const geradoEm = gerarGeradoEm(agora);

  const booking = /\[\[AGENDAR/.test(conteudo) || conteudo.includes(config.appBarberUrl);
  const human = /atendimento humano|falar com|whatsapp/i.test(conteudo);
  const semInformacao =
    /essa informação|informação que|informação dispon/i.test(conteudo) ||
    /não (tenho|sei|posso|conheço)/i.test(conteudo) ||
    conteudo.length === 0;

  if (booking) {
    return respostaAgendamento({ canal, agora, config });
  }

  if (human) {
    return respostaAtendimentoHumano({ canal, agora, config });
  }

  if (semInformacao) {
    return respostaSemInformacao({ canal, agora });
  }

  // Verifica perguntas sobre fim de ano ANTES de chamar detectarIntencao
  const festivo = obterMensagemFestivo(mensagem);
  if (festivo) {
    return festivo;
  }

  const { intencao } = detectarIntencao(mensagem, { produtos: [] });

  return {
    versao: "1.0",
    canal,
    intencao,
    texto: conteudo,
    dados: {},
    acoes: [],
    avisos: [],
    requerConfirmacaoOficial: false,
    efeitos: efeitosSemAcao(),
    geradoEm,
  };
}

export function criarAdaptadorLandingAssistenteAgente({
  agente,
  atendimentoComercial = null,
  politica = null,
  config = ATENDIMENTO_CONFIG,
  agora = () => new Date(),
  contextoAquisicao = null,
} = {}) {
  const atendimento = criarAtendimentoComHandoff({
    atendimentoComercial,
    politica,
    config,
    agora,
  });
  const politicaAtendimento = atendimento.politica;
  const conversas = new Map();

  async function aguardarRespostaAgente({
    conversaId,
    mensagem,
    contexto = {},
    agora = () => new Date(),
    contextoAquisicao = null,
  }) {
    const chave = conversaId ?? contexto.contato ?? "anonimo";
    let conversa = conversas.get(chave);

    if (!conversa) {
      conversa = await agente.createConversation({
        agent_name: AGENT_NAME,
        metadata: { name: "Consultor Neyzito", conversaId: chave },
      });
      conversas.set(chave, conversa);
    }

    let resolver;
    const respostaPromise = new Promise((resolve) => {
      resolver = resolve;
    });
    const unsubscribe = agente.subscribeToConversation(conversa.id, (data) => {
      const mensagens = Array.isArray(data?.messages) ? data.messages : [];
      const ultimaResposta = [...mensagens]
        .reverse()
        .find((mensagemAgente) => mensagemAgente?.role === "assistant" && String(mensagemAgente?.content ?? "").trim());

      if (ultimaResposta) {
        resolver({ conversa, resposta: ultimaResposta });
      }
    });

    const conteudo = [
      contextoTemporal(agora),
      contextoAquisicao({ contexto, contextoAquisicao }),
      mensagem,
    ]
      .filter(Boolean)
      .join("\n\n");

    try {
      await agente.addMessage(conversa, {
        role: "user",
        content: conteudo,
      });
      const { resposta } = await respostaPromise;
      return resposta;
    } finally {
      unsubscribe();
    }
  }

  async function responderComAgente(mensagem, contexto = {}) {
    const canal = normalizarCanal(contexto.canal);
    const conversaId = contexto.conversaId ?? contexto.contato ?? "anonimo";
    const estadoAtual = politicaAtendimento.obterEstado(conversaId);

    if (estadoAtual.iaSuspensa) {
      const resposta = {
        versao: "1.0",
        canal,
        intencao: INTENCOES.ATENDIMENTO_HUMANO,
        texto: estadoAtual.status === "humano_ativo"
          ? "O atendimento humano assumiu esta conversa. A IA está suspensa e só volta após retomada autorizada."
          : "O atendimento humano foi solicitado. A IA está suspensa nesta conversa até a retomada ser autorizada.",
        dados: {
          iaSuspensa: true,
          status: estadoAtual.status,
          atendente: estadoAtual.atendente,
          motivo: estadoAtual.motivo,
        },
        acoes: [],
        avisos: ["A IA não responderá até uma retomada controlada e autorizada."],
        requerConfirmacaoOficial: false,
        efeitos: efeitosSemAcao(),
        handoff: estadoAtual,
        geradoEm: gerarGeradoEm(agora),
      };

      return {
        resposta,
        apresentacao: criarApresentacaoResposta(resposta),
      };
    }

    const { resposta: respostaAgente } = await aguardarRespostaAgente({
      conversaId,
      mensagem,
      contexto,
      agora,
      contextoAquisicao,
    });
    const resposta = criarRespostaAgente({
      respostaAgente,
      mensagem,
      contexto,
      canal,
      agora,
      config,
    });
    const avaliacao = politicaAtendimento.avaliarResposta({
      conversaId,
      resposta,
    });
    const respostaFinal = avaliacao.oferecerTransferencia
      ? adicionarOfertaTransferencia(resposta, { config })
      : { ...resposta, handoff: avaliacao.estado };

    return {
      resposta: respostaFinal,
      apresentacao: criarApresentacaoResposta(respostaFinal),
    };
  }

  return {
    atendimento,
    politica: politicaAtendimento,

    async responder(mensagem, contexto = {}) {
      return responderComAgente(mensagem, contexto);
    },
    solicitarHumano({ conversaId, motivo } = {}) {
      return atendimento.solicitarHumano({ conversaId, motivo });
    },
    humanoAssumiu({ conversaId, atendente, motivo } = {}) {
      return atendimento.humanoAssumiu({ conversaId, atendente, motivo });
    },
    retomarIA({ conversaId, autorizadoPor, confirmado } = {}) {
      return atendimento.retomarIA({ conversaId, autorizadoPor, confirmado });
    },
  };
}

export { criarApresentacaoResposta };

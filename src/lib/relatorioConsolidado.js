// Relatório consolidado: uma linha por atendimento/lead, reunindo origem
// (navegação), dados do cadastro, atendimento (compareceu/faltou/cancelado) e
// valor. É a visão "tudo em um lugar", filtrável por período/barbeiro/origem/
// situação e exportável.
//
// Regra de rendimento idêntica ao resto do painel: só conta valor de
// situacao_atendimento = "compareceu".
import {
  formatBRL,
  formatDateOnly,
  formatSpDate,
  normalizeOrigem,
  origemLabel,
  situacaoLabel,
  statusLabel,
} from "@/lib/leadsPanel";
import { spEndOfDay, spStartOfDay, dentroDaJanela } from "@/lib/timezone";

export const PERIODOS = [
  { value: "hoje", label: "Hoje" },
  { value: "7d", label: "Últimos 7 dias" },
  { value: "30d", label: "Últimos 30 dias" },
  { value: "90d", label: "Últimos 90 dias" },
  { value: "12m", label: "Últimos 12 meses" },
  { value: "tudo", label: "Tudo" },
  { value: "custom", label: "Período personalizado" },
];

export const SITUACAO_FILTRO = [
  { value: "all", label: "Toda situação" },
  { value: "compareceu", label: "Compareceu" },
  { value: "faltou", label: "Faltou" },
  { value: "cancelado", label: "Cancelado" },
  { value: "pendente", label: "Pendente / sem situação" },
];

// Data de referência de um atendimento: a data do agendamento quando existir;
// senão, a data de criação do lead. Mesma convenção da evolução por barbeiro.
export function dataReferencia(l) {
  return l.data_agendamento || l.created_date || null;
}

// Filtra os leads pela janela de período escolhida.
export function filtrarPorPeriodo(leads, periodo, from, to) {
  if (periodo === "tudo") return leads;
  let ini = null;
  let fim = null;
  const now = new Date();
  if (periodo === "hoje") {
    ini = spStartOfDay(now);
    fim = spEndOfDay(now);
  } else if (periodo === "7d") ini = spStartOfDay(new Date(now.getTime() - 6 * 86400000));
  else if (periodo === "30d") ini = spStartOfDay(new Date(now.getTime() - 29 * 86400000));
  else if (periodo === "90d") ini = spStartOfDay(new Date(now.getTime() - 89 * 86400000));
  else if (periodo === "12m") ini = spStartOfDay(new Date(now.getTime() - 364 * 86400000));
  else if (periodo === "custom") {
    ini = from ? new Date(from + "T00:00:00-03:00") : null;
    fim = to ? new Date(to + "T23:59:59.999-03:00") : null;
  }
  if (periodo === "7d" || periodo === "30d" || periodo === "90d" || periodo === "12m") fim = spEndOfDay(now);

  return (leads || []).filter((l) => {
    const ref = dataReferencia(l);
    if (!ref) return periodo === "tudo";
    return dentroDaJanela(ref, ini, fim);
  });
}

// Constrói as linhas do relatório: cada lead vira uma linha com tudo que o
// painel sabe sobre ele.
export function construirLinhas(leads, precoMap = {}) {
  return (leads || []).map((l) => {
    const preco =
      l.preco_servico != null && l.preco_servico !== ""
        ? Number(l.preco_servico) || 0
        : precoMap[l.servico_interesse] || 0;
    return {
      id: l.id,
      data: dataReferencia(l),
      nome: l.nome || "—",
      whatsapp: l.whatsapp || "",
      email: l.email || "",
      servico: l.servico_interesse || "—",
      barbeiro: l.barbeiro_preferido || "Não informado",
      origem: normalizeOrigem(l.origem),
      canal: l.canal || "",
      campanha: l.campanha || "",
      referrer: l.referrer || "",
      utm_source: l.utm_source || "",
      sessao_id: l.sessao_id || "",
      status: l.status || "",
      situacao: l.situacao_atendimento || "",
      valor: preco,
      compareceu: l.situacao_atendimento === "compareceu",
    };
  });
}

// Resumo (KPIs) das linhas filtradas.
export function resumoConsolidado(linhas) {
  const total = linhas.length;
  const compareceu = linhas.filter((r) => r.situacao === "compareceu").length;
  const faltou = linhas.filter((r) => r.situacao === "faltou").length;
  const cancelado = linhas.filter((r) => r.situacao === "cancelado").length;
  const rendimento = linhas.reduce((s, r) => s + (r.compareceu ? r.valor : 0), 0);
  const ticket = compareceu > 0 ? rendimento / compareceu : 0;

  const porOrigem = {};
  for (const r of linhas) porOrigem[r.origem] = (porOrigem[r.origem] || 0) + 1;
  const topOrigens = Object.entries(porOrigem)
    .map(([origem, count]) => ({ origem, count }))
    .sort((a, b) => b.count - a.count);

  return { total, compareceu, faltou, cancelado, rendimento, ticket, topOrigens };
}

export function exportConsolidadoCSV(linhas) {
  const headers = [
    "Data",
    "Nome",
    "Telefone",
    "Email",
    "Servico",
    "Barbeiro",
    "Origem",
    "Canal",
    "Campanha",
    "Referrer",
    "UTM_Source",
    "Status",
    "Situacao_Atendimento",
    "Valor",
    "Sessao",
  ];
  const rows = linhas.map((r) => [
    r.data ? formatSpDate(r.data) : "",
    r.nome,
    r.whatsapp,
    r.email,
    r.servico,
    r.barbeiro,
    origemLabel(r.origem),
    r.canal,
    r.campanha,
    r.referrer,
    r.utm_source,
    statusLabel(r.status),
    r.situacao ? situacaoLabel(r.situacao) : "",
    r.compareceu ? r.valor.toFixed(2) : "",
    r.sessao_id,
  ]);
  const escape = (v) => {
    const s = String(v ?? "");
    if (s.includes(";") || s.includes('"') || s.includes("\n") || s.includes("\r"))
      return '"' + s.replace(/"/g, '""') + '"';
    return s;
  };
  const csv = [headers, ...rows].map((r) => r.map(escape).join(";")).join("\r\n");
  const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `relatorio-consolidado-${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// Reexporta helpers usados pela página, evitando imports duplicados lá.
export { formatBRL, formatDateOnly };

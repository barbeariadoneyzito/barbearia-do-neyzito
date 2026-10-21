// Painel "Origem dos Leads" — visão enxuta de aquisição.
//
// Substitui o antigo painel de métricas (14 blocos empilhados) por uma leitura
// objetiva: de onde vêm as visitas e os leads, e o que converte. Cruza os
// eventos de navegação (AnalyticsEvent) com os leads gravados, pela sessao_id,
// e unifica tudo em um único ranking por origem.
import { spDateKey, spDayMonth, parseDbDate, spStartOfDay, spEndOfDay, isDateOnly, dentroDaJanela } from "@/lib/timezone";

// Data de referência de um lead para fins de período: a data do atendimento
// quando existe; senão a criação do registro. Mesma convenção dos painéis.
export function dataRefLead(l) {
  return l?.data_agendamento || l?.created_date || null;
}

// Filtra leads pela janela de período escolhida no painel de origem.
// Compara pela data do atendimento (e não pela criação do registro, que é
// sempre "hoje" nos atendimentos importados do AppBarber).
export function filtrarLeadsPorPeriodo(leads, range, from, to) {
  const now = new Date();
  let ini = null;
  let fim = null;
  if (range === "hoje") {
    ini = spStartOfDay(now);
    fim = spEndOfDay(now);
  } else if (range === "7d") {
    ini = spStartOfDay(new Date(now.getTime() - 6 * 86400000));
    fim = spEndOfDay(now);
  } else if (range === "30d") {
    ini = spStartOfDay(new Date(now.getTime() - 29 * 86400000));
    fim = spEndOfDay(now);
  } else {
    ini = from ? new Date(from + "T00:00:00-03:00") : null;
    fim = to ? new Date(to + "T23:59:59.999-03:00") : null;
  }
  return (leads || []).filter((l) => {
    const ref = dataRefLead(l);
    if (!ref) return false;
    return dentroDaJanela(ref, ini, fim);
  });
}

// Origens canônicas exibidas no painel (ordem = prioridade de exibição).
export const ORIGENS = [
  "Google Meu Negócio",
  "Google Pesquisa",
  "Instagram",
  "TikTok",
  "YouTube",
  "WhatsApp",
  "Plataforma de IA",
  "Facebook",
  "LinkedIn",
  "AppBarber",
  "Indicação",
  "Acesso direto",
  "Origem desconhecida",
];

// Normaliza o rótulo do canal (AnalyticsEvent.canal) para a mesma taxonomia
// usada nos leads, para visitas e leads aparecerem na mesma linha.
const CANAL_PARA_ORIGEM = {
  "Google Business Profile": "Google Meu Negócio",
  "Google Meu Negócio": "Google Meu Negócio",
  "Google Ads": "Google Pesquisa",
  "Google Pesquisa": "Google Pesquisa",
  Instagram: "Instagram",
  Facebook: "Facebook",
  TikTok: "TikTok",
  YouTube: "YouTube",
  LinkedIn: "LinkedIn",
  WhatsApp: "WhatsApp",
  AppBarber: "AppBarber",
  "Indicação": "Indicação",
  "Acesso direto": "Acesso direto",
  "Origem desconhecida": "Origem desconhecida",
};

// Canais de IA ("IA — ChatGPT" etc.) colapsam em uma única origem.
export function canalParaOrigem(canal) {
  if (!canal) return "Origem desconhecida";
  if (String(canal).startsWith("IA —")) return "Plataforma de IA";
  return CANAL_PARA_ORIGEM[canal] || "Origem desconhecida";
}

// A origem do lead já vem normalizada pela entidade; aqui só garantimos que
// valores legados caiam em um rótulo conhecido.
export function origemDoLead(origem) {
  const s = String(origem || "").trim();
  if (!s || s === "Não identificado") return "Origem desconhecida";
  // Valores legados (antes da unificação da ficha do Google).
  if (s === "Google Maps / Perfil da Empresa" || s === "Google Business Profile") return "Google Meu Negócio";
  // A entidade usa "WhatsApp Business"; os eventos usam "WhatsApp". Unifica para
  // que visitas e leads do WhatsApp apareçam na mesma linha do painel.
  if (s === "WhatsApp Business") return "WhatsApp";
  // "Indicação de cliente" (entidade) e "Indicação" (eventos) são a mesma origem.
  if (s === "Indicação de cliente") return "Indicação";
  return s;
}

// Constrói o ranking de origens: visitas, leads e taxa de conversão por origem.
// Só visitas (tipo_evento === "visita") contam como entrada; cliques e eventos
// de navegação não inflam a base.
export function rankingOrigens(eventos, leads) {
  const mapa = {};
  const get = (origem) => {
    if (!mapa[origem]) mapa[origem] = { origem, visitas: 0, leads: 0, cliques: 0 };
    return mapa[origem];
  };

  for (const e of eventos || []) {
    if (e.tipo_evento === "visita") get(canalParaOrigem(e.canal)).visitas++;
    else if (e.tipo_evento === "clique" && e.destino === "appbarber") {
      get(canalParaOrigem(e.canal)).cliques++;
    }
  }

  for (const l of leads || []) {
    get(origemDoLead(l.origem)).leads++;
  }

  return Object.values(mapa)
    .filter((r) => r.visitas > 0 || r.leads > 0 || r.cliques > 0)
    .map((r) => ({
      ...r,
      taxa: r.visitas > 0 ? (r.leads / r.visitas) * 100 : null,
    }))
    .sort((a, b) => b.leads - a.leads || b.visitas - a.visitas || a.origem.localeCompare(b.origem));
}

// Evolução diária: visitas e leads por dia, no fuso de Brasília.
export function evolucaoDiaria(eventos, leads) {
  const mapa = {};
  const get = (key, date) => {
    if (!mapa[key]) mapa[key] = { date: key, label: spDayMonth(date), visitas: 0, leads: 0 };
    return mapa[key];
  };
  for (const e of eventos || []) {
    if (e.tipo_evento === "visita" && e.created_date) get(spDateKey(e.created_date), e.created_date).visitas++;
  }
  for (const l of leads || []) {
    const ref = l.data_agendamento || l.created_date;
    if (ref) get(spDateKey(isDateOnly(ref) ? new Date(String(ref).slice(0, 10) + "T12:00:00-03:00") : ref), ref).leads++;
  }
  return Object.values(mapa).sort((a, b) => a.date.localeCompare(b.date));
}

// Totais do topo do painel.
export function resumoOrigem(eventos, leads) {
  const evs = eventos || [];
  const visitas = evs.filter((e) => e.tipo_evento === "visita").length;
  const sessoes = new Set(evs.map((e) => e.sessao_id).filter(Boolean)).size;
  const cliquesAppbarber = evs.filter(
    (e) => e.tipo_evento === "clique" && e.destino === "appbarber"
  ).length;
  const cliquesWhatsapp = evs.filter(
    (e) => e.tipo_evento === "clique" && e.destino === "whatsapp"
  ).length;
  const REDES = ["instagram", "tiktok", "youtube", "linkedin", "facebook"];
  const cliquesRedes = evs.filter(
    (e) => e.tipo_evento === "clique" && REDES.includes(e.destino)
  ).length;
  return {
    visitas,
    sessoes,
    leads: (leads || []).length,
    cliquesAppbarber,
    cliquesWhatsapp,
    cliquesRedes,
    taxaVisitaLead: visitas > 0 ? ((leads || []).length / visitas) * 100 : null,
  };
}

// Saídas do site por destino (cliques). Diferente das origens: aqui mede quem
// JÁ ESTAVA no site e clicou para sair (AppBarber, WhatsApp, redes sociais).
// Útil para ver se os botões de redes são usados — mas não substitui a UTM,
// que é o único jeito de saber de onde o visitante VEIO.
const DESTINOS_SAIDA = [
  { destino: "appbarber", label: "AppBarber (agendar)" },
  { destino: "whatsapp", label: "WhatsApp" },
  { destino: "instagram", label: "Instagram" },
  { destino: "tiktok", label: "TikTok" },
  { destino: "youtube", label: "YouTube" },
  { destino: "linkedin", label: "LinkedIn" },
  { destino: "facebook", label: "Facebook" },
];

export function saidasPorDestino(eventos) {
  const evs = (eventos || []).filter((e) => e.tipo_evento === "clique");
  const contagem = {};
  for (const e of evs) {
    const d = e.destino || "—";
    contagem[d] = (contagem[d] || 0) + 1;
  }
  // Destinos conhecidos primeiro (na ordem definida), depois eventuais outros.
  const linhas = DESTINOS_SAIDA.map((d) => ({
    destino: d.destino,
    label: d.label,
    total: contagem[d.destino] || 0,
  }));
  for (const [d, total] of Object.entries(contagem)) {
    if (!DESTINOS_SAIDA.some((x) => x.destino === d)) linhas.push({ destino: d, label: d, total });
  }
  return linhas;
}

// Lista as sessões com o resultado de cada visitante (última etapa da jornada).
// Usada no detalhamento ao clicar em "Visitas".
export function jornadaResumida(eventos) {
  const porSessao = {};
  for (const e of eventos || []) {
    const s = e.sessao_id || "—";
    (porSessao[s] = porSessao[s] || []).push(e);
  }
  return Object.entries(porSessao).map(([sessao_id, evs]) => {
    const sorted = [...evs].sort((a, b) => parseDbDate(a.created_date) - parseDbDate(b.created_date));
    const visita = sorted.find((e) => e.tipo_evento === "visita");
    let resultado = "Só visitou";
    if (sorted.some((e) => e.tipo_evento === "clique" && e.destino === "appbarber")) resultado = "Foi ao AppBarber";
    else if (sorted.some((e) => e.tipo_evento === "clique" && e.destino === "whatsapp")) resultado = "Foi ao WhatsApp";
    else if (sorted.some((e) => e.tipo_evento === "chat_interacao")) resultado = "Conversou no chat";
    else if (sorted.some((e) => e.tipo_evento === "chat_aberto")) resultado = "Abriu o chat";
    return {
      sessao_id,
      data: sorted[0].created_date,
      origem: canalParaOrigem(visita?.canal || sorted[0]?.canal),
      saidas: sorted.filter((e) => e.tipo_evento === "clique").map((e) => e.destino),
      resultado,
    };
  }).sort((a, b) => parseDbDate(b.data) - parseDbDate(a.data));
}

export function exportOrigemCSV(ranking) {
  const headers = ["Origem", "Visitas", "Leads", "Conversao (%)", "Cliques AppBarber"];
  const rows = ranking.map((r) => [
    r.origem,
    r.visitas,
    r.leads,
    r.taxa == null ? "" : r.taxa.toFixed(1),
    r.cliques,
  ]);
  const escape = (v) => {
    const s = String(v ?? "");
    return /[;"\n\r]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
  };
  const csv = [headers, ...rows].map((r) => r.map(escape).join(";")).join("\r\n");
  const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `origem-dos-leads-${spDateKey(new Date())}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// Cálculo de métricas e jornada do visitante no cliente, a partir de uma única
// página de eventos carregada do banco. Os registros seguem armazenados em UTC;
// toda exibição e agrupamento diário usam o fuso de Brasília (America/Sao_Paulo).
import { spDateKey, spDayMonth, parseDbDate } from "@/lib/timezone";

export const ACTION_LABELS = {
  visita: "Visita à página",
  clique: "Clique",
  chat_aberto: "Abriu o chat",
  chat_interacao: "Interagiu no chat",
  secao_vista: "Viu uma seção",
  scroll_profundidade: "Rolou a página",
};
export const actionLabel = (v) => ACTION_LABELS[v] || v || "—";

export function shortSessao(sid) {
  if (!sid) return "—";
  const s = String(sid);
  return s.length > 8 ? s.slice(-6) : s;
}

// Resultado da visita: prioriza agendamento > whatsapp > chat > só visita.
export function sessionResultado(timeline) {
  if (!timeline || timeline.length === 0) return "Sem dados";
  if (timeline.some((e) => e.tipo_evento === "clique" && e.destino === "appbarber")) return "Agendamento (AppBarber)";
  if (timeline.some((e) => e.tipo_evento === "clique" && e.destino === "whatsapp")) return "WhatsApp";
  if (timeline.some((e) => e.tipo_evento === "chat_interacao")) return "Conversou no chat";
  if (timeline.some((e) => e.tipo_evento === "chat_aberto")) return "Abriu o chat";
  return "Só visita";
}

// Agrupa eventos por sessão (sessao_id) e monta a jornada de cada visitante.
export function buildJourney(events) {
  const bySessao = {};
  for (const e of events || []) {
    const s = e.sessao_id || "—";
    (bySessao[s] = bySessao[s] || []).push(e);
  }
  const rows = Object.entries(bySessao).map(([sessao_id, evs]) => {
    const sorted = [...evs].sort((a, b) => parseDbDate(a.created_date) - parseDbDate(b.created_date));
    const first = sorted[0];
    const last = sorted[sorted.length - 1];
    const visita = sorted.find((e) => e.tipo_evento === "visita");
    const canal = visita?.canal || first?.canal || "";
    const utm_campaign = evs.find((e) => e.utm_campaign)?.utm_campaign || "";
    const device = first?.dispositivo || "";
    // "Interações" conta engajamento real (visita, clique, chat). Os eventos de
    // navegação (secao_vista/scroll_profundidade) aparecem na timeline, mas não
    // entram na contagem — senão inflariam o número de interações.
    const interacoes = sorted.filter(
      (e) => e.tipo_evento === "visita" || e.tipo_evento === "clique" || e.tipo_evento.startsWith("chat_")
    ).length;
    return {
      sessao_id,
      data: first.created_date,
      canal,
      utm_campaign,
      device,
      interacoes,
      ultima_acao: last,
      resultado: sessionResultado(sorted),
      timeline: sorted,
    };
  });
  rows.sort((a, b) => parseDbDate(b.data) - parseDbDate(a.data));
  return rows;
}

// Computa todas as métricas do painel a partir de uma página de eventos.
export function computeMetrics(events, leadsCount, leadsBySessao = {}) {
  const evs = events || [];
  const visitas = evs.filter((e) => e.tipo_evento === "visita").length;
  const sessoes = new Set(evs.map((e) => e.sessao_id).filter(Boolean)).size;
  const cliques = evs.filter((e) => e.tipo_evento === "clique");
  const cliquesAppbarber = cliques.filter((e) => e.destino === "appbarber").length;
  const cliquesWhatsapp = cliques.filter((e) => e.destino === "whatsapp").length;

  const byDestMap = {};
  for (const c of cliques) byDestMap[c.destino] = (byDestMap[c.destino] || 0) + 1;
  const byDest = Object.entries(byDestMap).map(([destino, count]) => ({ destino, count })).sort((a, b) => b.count - a.count);

  const byCanalMap = {};
  for (const e of evs) {
    if (e.tipo_evento === "visita") {
      const c = e.canal || "Não classificado";
      byCanalMap[c] = (byCanalMap[c] || 0) + 1;
    }
  }
  const byCanal = Object.entries(byCanalMap).map(([canal, count]) => ({ canal, count })).sort((a, b) => b.count - a.count);

  const byDeviceMap = {};
  const byUtmCampaignMap = {};
  for (const e of evs) {
    // Só visitas e cliques entram nos breakdowns; eventos de navegação
    // (secao_vista/scroll_profundidade) não são jornada de aquisição e
    // inflariam a contagem por dispositivo/campanha.
    if (e.tipo_evento !== "visita" && e.tipo_evento !== "clique") continue;
    const dev = e.dispositivo || "outro";
    byDeviceMap[dev] = (byDeviceMap[dev] || 0) + 1;
    const camp = e.utm_campaign || "";
    byUtmCampaignMap[camp] = (byUtmCampaignMap[camp] || 0) + 1;
  }
  const byDevice = Object.entries(byDeviceMap).map(([dispositivo, count]) => ({ dispositivo, count })).sort((a, b) => b.count - a.count);
  const byUtmCampaign = Object.entries(byUtmCampaignMap).map(([utm_campaign, count]) => ({ utm_campaign, count })).sort((a, b) => b.count - a.count);

  // Evolução por dia (Brasília)
  const evMap = {};
  for (const e of evs) {
    const key = spDateKey(e.created_date);
    if (!evMap[key]) evMap[key] = { label: spDayMonth(e.created_date), date: key, visitas: 0, cliques: 0 };
    if (e.tipo_evento === "visita") evMap[key].visitas++;
    else if (e.tipo_evento === "clique") evMap[key].cliques++;
  }
  const evolution = Object.values(evMap).sort((a, b) => a.date.localeCompare(b.date));

  const campaigns = [...new Set(evs.map((e) => e.utm_campaign).filter(Boolean))];
  const journey = buildJourney(evs);

  // Cliques no AppBarber por canal (para a seção de redes sociais)
  const appCanalMap = {};
  for (const e of evs) {
    if (e.tipo_evento === "clique" && e.destino === "appbarber") {
      const c = e.canal || "Não classificado";
      appCanalMap[c] = (appCanalMap[c] || 0) + 1;
    }
  }
  const byAppBarberCanal = Object.entries(appCanalMap).map(([canal, count]) => ({ canal, count }));

  // --- Inteligência de conversão: funil, cliques convertidos e conversão por canal ---
  // Cruza eventos com leads pela sessao_id. Leads cuja sessão não está nos eventos
  // carregados não contam (assim o funil respeita os filtros ativos do painel).
  const sessoesSet = new Set(evs.map((e) => e.sessao_id).filter(Boolean));
  const sessaoCanal = {};
  for (const e of evs) {
    if (e.tipo_evento === "visita" && e.sessao_id && !sessaoCanal[e.sessao_id]) {
      sessaoCanal[e.sessao_id] = e.canal || "Não classificado";
    }
  }
  const leadsVisiveis = Object.values(leadsBySessao).filter((l) => l.sessao_id && sessoesSet.has(l.sessao_id));
  const leadsVinculados = leadsVisiveis.length;
  const cliquesConvertidos = cliques.filter(
    (e) => e.destino === "appbarber" && e.sessao_id && leadsBySessao[e.sessao_id]
  ).length;

  const convMap = {};
  for (const r of byCanal) convMap[r.canal] = { canal: r.canal, visitas: r.count, cliquesAppbarber: 0, leads: 0 };
  for (const e of evs) {
    if (e.tipo_evento === "clique" && e.destino === "appbarber" && e.sessao_id) {
      const c = sessaoCanal[e.sessao_id] || "Não classificado";
      if (!convMap[c]) convMap[c] = { canal: c, visitas: 0, cliquesAppbarber: 0, leads: 0 };
      convMap[c].cliquesAppbarber++;
    }
  }
  for (const l of leadsVisiveis) {
    const c = sessaoCanal[l.sessao_id] || "Não classificado";
    if (!convMap[c]) convMap[c] = { canal: c, visitas: 0, cliquesAppbarber: 0, leads: 0 };
    convMap[c].leads++;
  }
  const conversaoPorCanal = Object.values(convMap)
    .map((r) => ({ ...r, taxa: r.visitas > 0 ? (r.leads / r.visitas) * 100 : 0 }))
    .sort((a, b) => b.leads - a.leads || b.visitas - a.visitas);

  const funnel = { visitas, cliquesAppbarber, leads: leadsVinculados, cliquesConvertidos };

  return {
    visitas, sessoes, cliquesAppbarber, cliquesWhatsapp, leadsCount,
    byDest, byCanal, byDevice, byUtmCampaign, evolution, campaigns, journey, byAppBarberCanal,
    funnel, conversaoPorCanal, cliquesConvertidos, leadsVinculados,
  };
}
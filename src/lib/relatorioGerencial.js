// Motor de análise gerencial — Relatório Mensal da Barbearia do Neyzito.
//
// Recebe os leads (atendimentos) e eventos do site de um período e devolve
// todos os cortes que o relatório executivo precisa:
//   1. Comparativo mês a mês (variação % de rendimento, atendimentos, ticket)
//   2. Ranking de clientes (por gasto e por frequência)
//   3. Faltas e horários/dias de pico (taxa de no-show, dia da semana)
//   4. Desempenho por barbeiro
//   5. Análise de serviços (volume, participação no faturamento)
//   6. Funil de conversão do site (visitas → cliques → leads → atendimentos)
//   + Investimento por canal (CPA/ROAS) quando informado pelo gestor.
//
// Regra de rendimento (idêntica a todo o painel): só
// situacao_atendimento === "compareceu" conta dinheiro. "compareceu" também é
// o único status que representa um atendimento de fato realizado — a base de
// frequência e ranking.
import { normalizePhone, normalizeOrigem, origemLabel, situacaoLabel } from "@/lib/leadsPanel";
import { spDateKey, parseDbDate, isDateOnly } from "@/lib/timezone";

// ---------------------------------------------------------------- período

// Data de referência do atendimento: a data agendada quando existe; senão a
// criação do registro. Mesma convenção do resto do painel.
export function dataRef(l) {
  return l.data_agendamento || l.created_date || null;
}

// Chave YYYY-MM (Brasília) de um lead — usada para os cortes mensais.
// Data sem hora (ex.: "2026-10-20") é um dia civil: o mês vem direto do texto.
// Passar por spDateKey deslocaria um dia (meia-noite UTC = 21h do dia anterior
// em Brasília) e jogaria atendimentos do dia 1º para o mês anterior.
export function mesDoLead(l) {
  const ref = dataRef(l);
  if (!ref) return null;
  if (isDateOnly(ref)) return String(ref).slice(0, 7);
  return spDateKey(ref).slice(0, 7);
}

// Lista os meses presentes (YYYY-MM), mais recente primeiro.
export function mesesDisponiveis(leads) {
  const set = new Set();
  for (const l of leads || []) {
    const m = mesDoLead(l);
    if (m) set.add(m);
  }
  return Array.from(set).sort().reverse();
}

// Rótulo "outubro/2026" a partir de YYYY-MM.
export function mesLabel(mes) {
  if (!mes) return "—";
  const [y, m] = mes.split("-").map(Number);
  const nomes = [
    "janeiro", "fevereiro", "março", "abril", "maio", "junho",
    "julho", "agosto", "setembro", "outubro", "novembro", "dezembro",
  ];
  return `${nomes[m - 1]}/${y}`;
}

// Mês anterior a um YYYY-MM (para o comparativo).
// Calculado em calendário puro (não por instante UTC) — usar Date.UTC com mês
// -2 e depois spDateKey deslocava o mês, porque a meia-noite UTC cai no dia
// anterior em Brasília. Aqui apenas decrementamos o mês.
export function mesAnterior(mes) {
  if (!mes) return null;
  let [y, m] = mes.split("-").map(Number);
  m -= 1;
  if (m === 0) {
    m = 12;
    y -= 1;
  }
  return `${y}-${String(m).padStart(2, "0")}`;
}

// Filtra os leads de um mês específico.
export function leadsDoMes(leads, mes) {
  return (leads || []).filter((l) => mesDoLead(l) === mes);
}

// ---------------------------------------------------------------- situação

const SITUACOES = ["compareceu", "faltou", "cancelado", "reagendado", "confirmado", "pendente"];

// Contagem por situação + taxa de comparecimento e de falta.
export function resumoSituacao(leads) {
  const cont = {};
  for (const s of SITUACOES) cont[s] = 0;
  let semSituacao = 0;
  for (const l of leads || []) {
    const s = l.situacao_atendimento;
    if (!s) semSituacao++;
    else if (cont[s] !== undefined) cont[s]++;
  }
  const finalizados = cont.compareceu + cont.faltou + cont.cancelado;
  return {
    ...cont,
    sem_situacao: semSituacao,
    total: (leads || []).length,
    // Taxa de comparecimento = compareceu / (compareceu + faltou + cancelado).
    taxa_comparecimento: finalizados > 0 ? (cont.compareceu / finalizados) * 100 : null,
    // Taxa de falta (no-show) = faltou / finalizados.
    taxa_falta: finalizados > 0 ? (cont.faltou / finalizados) * 100 : null,
    taxa_cancelamento: finalizados > 0 ? (cont.cancelado / finalizados) * 100 : null,
  };
}

// ---------------------------------------------------------------- financeiro

// Rendimento (soma de preco_servico só de compareceu), ticket médio e base.
export function resumoFinanceiro(leads, precoMap = {}) {
  let rendimento = 0;
  let atendimentos = 0;
  for (const l of leads || []) {
    if (l.situacao_atendimento !== "compareceu") continue;
    atendimentos++;
    rendimento += precoDoLead(l, precoMap);
  }
  return {
    rendimento,
    atendimentos,
    ticket: atendimentos > 0 ? rendimento / atendimentos : 0,
  };
}

// Preço de um lead: usa preco_servico quando informado; senão busca no mapa de
// serviços ativos pelo nome do serviço.
export function precoDoLead(l, precoMap = {}) {
  if (l.preco_servico != null && l.preco_servico !== "") return Number(l.preco_servico) || 0;
  return precoMap[l.servico_interesse] || 0;
}

// Variação percentual entre dois valores (protege contra divisão por zero).
// Retorna null quando não há base de comparação — o painel exibe "—" nesse caso.
export function variacao(atual, anterior) {
  if (anterior == null || anterior === 0) return null;
  return ((atual - anterior) / anterior) * 100;
}

// ------------------------------------------------- 1. comparativo mês a mês

// Compara o mês escolhido com o anterior em rendimento, atendimentos, ticket,
// comparecimento e falta. `investimentoMes` é o gasto em tráfego do mês (para
// ROAS/CAC quando informado).
export function comparativoMensal(leads, mes, precoMap = {}, investimentoMes = 0) {
  const atual = leadsDoMes(leads, mes);
  const antMes = mesAnterior(mes);
  const anterior = antMes ? leadsDoMes(leads, antMes) : [];

  const finAtual = resumoFinanceiro(atual, precoMap);
  const finAnt = resumoFinanceiro(anterior, precoMap);
  const sitAtual = resumoSituacao(atual);
  const sitAnt = resumoSituacao(anterior);

  const invest = Number(investimentoMes) || 0;

  return {
    mes,
    mes_label: mesLabel(mes),
    mes_anterior: antMes,
    mes_anterior_label: mesLabel(antMes),
    atual: {
      ...finAtual,
      leads: atual.length,
      taxa_comparecimento: sitAtual.taxa_comparecimento,
      taxa_falta: sitAtual.taxa_falta,
    },
    anterior: {
      ...finAnt,
      leads: anterior.length,
      taxa_comparecimento: sitAnt.taxa_comparecimento,
      taxa_falta: sitAnt.taxa_falta,
    },
    variacao: {
      rendimento: variacao(finAtual.rendimento, finAnt.rendimento),
      atendimentos: variacao(finAtual.atendimentos, finAnt.atendimentos),
      ticket: variacao(finAtual.ticket, finAnt.ticket),
      leads: variacao(atual.length, anterior.length),
    },
    investimento: invest,
    cpa: finAtual.atendimentos > 0 ? invest / finAtual.atendimentos : null,
    cac: atual.length > 0 ? invest / atual.length : null,
    roas: invest > 0 ? finAtual.rendimento / invest : null,
  };
}

// Série dos últimos N meses para o gráfico de evolução (rendimento, atendimentos).
// Os meses são montados por aritmética de calendário (sem instante UTC), para
// não deslocar o mês quando convertido para o fuso de Brasília.
export function serieMensal(leads, precoMap = {}, meses = 6) {
  const disponiveis = mesesDisponiveis(leads);
  if (disponiveis.length === 0) return [];
  const [y0, m0] = disponiveis[0].split("-").map(Number);
  const out = [];
  for (let i = meses - 1; i >= 0; i--) {
    // Índice absoluto de mês (0-based) para trás a partir do mês mais recente.
    const absoluto = y0 * 12 + (m0 - 1) - i;
    const key = `${Math.floor(absoluto / 12)}-${String((absoluto % 12) + 1).padStart(2, "0")}`;
    const doMes = leadsDoMes(leads, key);
    const fin = resumoFinanceiro(doMes, precoMap);
    const sit = resumoSituacao(doMes);
    out.push({
      mes: key,
      label: key.slice(5, 7) + "/" + key.slice(2, 4),
      nome: mesLabel(key),
      rendimento: fin.rendimento,
      atendimentos: fin.atendimentos,
      leads: doMes.length,
      taxa_falta: sit.taxa_falta,
    });
  }
  return out;
}

// ------------------------------------------------- 2. ranking de clientes

// Consolida os leads em clientes únicos e devolve dois rankings: por gasto
// (quanto deixou) e por frequência (quantas vezes veio). Cliente = telefone
// normalizado (fallback e-mail).
export function rankingClientes(leads, precoMap = {}, limite = 10) {
  const mapa = new Map();
  for (const l of leads || []) {
    const tel = normalizePhone(l.whatsapp);
    const email = (l.email || "").trim().toLowerCase();
    const key = tel ? "tel:" + tel : email ? "email:" + email : "id:" + (l.id || Math.random());
    if (!mapa.has(key)) {
      mapa.set(key, {
        key,
        nome: l.nome || "—",
        whatsapp: l.whatsapp || "",
        email: l.email || "",
        visitas: 0,
        faltas: 0,
        cancelamentos: 0,
        total_gasto: 0,
        ultima_visita: null,
        ultima_visita_ts: 0,
        servicos: new Set(),
        barbeiros: new Set(),
        origem: normalizeOrigem(l.origem),
      });
    }
    const c = mapa.get(key);
    if (l.nome && c.nome === "—") c.nome = l.nome;
    if (l.whatsapp && !c.whatsapp) c.whatsapp = l.whatsapp;
    if (l.email && !c.email) c.email = l.email;
    const sit = l.situacao_atendimento;
    if (sit === "compareceu") {
      c.visitas++;
      c.total_gasto += precoDoLead(l, precoMap);
      const ref = dataRef(l);
      // Compara pela DATA do atendimento (não pelo instante): em datas sem hora
      // a meia-noite UTC cairia no dia anterior em Brasília e inverteria a
      // ordem de duas visitas próximas. Meio-dia do dia civil evita o desvio.
      const ts = ref ? new Date(isDateOnly(ref) ? String(ref).slice(0, 10) + "T12:00:00" : parseDbDate(ref)).getTime() || 0 : 0;
      if (ts >= c.ultima_visita_ts) {
        c.ultima_visita_ts = ts;
        c.ultima_visita = ref;
      }
    } else if (sit === "faltou") c.faltas++;
    else if (sit === "cancelado") c.cancelamentos++;
    if (l.servico_interesse) c.servicos.add(l.servico_interesse);
    if (l.barbeiro_preferido) c.barbeiros.add(l.barbeiro_preferido);
  }

  const lista = Array.from(mapa.values()).map((c) => ({
    ...c,
    servicos: Array.from(c.servicos),
    barbeiros: Array.from(c.barbeiros),
    ticket: c.visitas > 0 ? c.total_gasto / c.visitas : 0,
  }));

  const porGasto = [...lista].sort((a, b) => b.total_gasto - a.total_gasto).slice(0, limite);
  const porFrequencia = [...lista]
    .sort((a, b) => b.visitas - a.visitas || b.total_gasto - a.total_gasto)
    .slice(0, limite);

  const comVisita = lista.filter((c) => c.visitas > 0);
  const recorrentes = comVisita.filter((c) => c.visitas >= 2).length;
  const medios = comVisita.length > 0 ? comVisita.reduce((s, c) => s + c.visitas, 0) / comVisita.length : 0;
  const gastoMedio = comVisita.length > 0 ? comVisita.reduce((s, c) => s + c.total_gasto, 0) / comVisita.length : 0;

  return {
    total_clientes: lista.length,
    clientes_ativos: comVisita.length,
    recorrentes,
    taxa_recorrencia: comVisita.length > 0 ? (recorrentes / comVisita.length) * 100 : null,
    visitas_media: medios,
    gasto_medio_cliente: gastoMedio,
    por_gasto: porGasto,
    por_frequencia: porFrequencia,
  };
}

// ------------------------------------------------- 3. faltas e horários

const DIAS_SEMANA = ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"];

// Distribui os atendimentos por dia da semana e por faixa de horário. Só é
// possível saber o horário quando o registro tem data com hora (data_agendamento
// ou created_date). Devolve também a taxa de falta do período.
export function faltasEHorarios(leads, precoMap = {}) {
  const porDia = DIAS_SEMANA.map((nome) => ({ dia: nome, atendimentos: 0, faltas: 0, rendimento: 0 }));
  const porHora = [];
  for (let h = 8; h <= 21; h++) porHora.push({ hora: h, label: `${String(h).padStart(2, "0")}h`, atendimentos: 0 });

  for (const l of leads || []) {
    const ref = dataRef(l);
    if (!ref) continue;
    // Data sem hora é um dia civil: ancoramos ao meio-dia de Brasília para que
    // o dia da semana fique correto e não exista hora de atendimento (horário
    // só é contabilizado quando o registro traz a hora real).
    const diaCivil = isDateOnly(ref);
    const d = diaCivil
      ? new Date(String(ref).slice(0, 10) + "T12:00:00-03:00")
      : parseDbDate(ref);
    if (Number.isNaN(d.getTime())) continue;

    // Dia da semana e hora no fuso de Brasília.
    const diaIdx = Number(
      new Intl.DateTimeFormat("en-US", { timeZone: "America/Sao_Paulo", weekday: "short" })
        .format(d)
        .replace(/Sun/, "0").replace(/Mon/, "1").replace(/Tue/, "2").replace(/Wed/, "3")
        .replace(/Thu/, "4").replace(/Fri/, "5").replace(/Sat/, "6")
    );
    const hora = Number(
      new Intl.DateTimeFormat("en-US", { timeZone: "America/Sao_Paulo", hour: "2-digit", hour12: false }).format(d)
    );

    const sit = l.situacao_atendimento;
    if (sit === "compareceu") {
      porDia[diaIdx].atendimentos++;
      porDia[diaIdx].rendimento += precoDoLead(l, precoMap);
      if (!diaCivil) {
        const faixa = porHora.find((p) => p.hora === hora);
        if (faixa) faixa.atendimentos++;
      }
    } else if (sit === "faltou") {
      porDia[diaIdx].faltas++;
    }
  }

  const totalFaltas = porDia.reduce((s, d) => s + d.faltas, 0);
  const totalAtend = porDia.reduce((s, d) => s + d.atendimentos, 0);
  const diaPico = [...porDia].sort((a, b) => b.atendimentos - a.atendimentos)[0] || null;
  const melhorDiaRendimento = [...porDia].sort((a, b) => b.rendimento - a.rendimento)[0] || null;
  const horaPico = [...porHora].sort((a, b) => b.atendimentos - a.atendimentos)[0] || null;

  return {
    por_dia: porDia,
    por_hora: porHora.filter((p) => p.atendimentos > 0),
    total_faltas: totalFaltas,
    total_atendimentos: totalAtend,
    taxa_falta: totalAtend + totalFaltas > 0 ? (totalFaltas / (totalAtend + totalFaltas)) * 100 : null,
    dia_pico: diaPico && diaPico.atendimentos > 0 ? diaPico.dia : null,
    melhor_dia_rendimento: melhorDiaRendimento && melhorDiaRendimento.rendimento > 0 ? melhorDiaRendimento.dia : null,
    hora_pico: horaPico && horaPico.atendimentos > 0 ? horaPico.label : null,
  };
}

// ------------------------------------------------- 4. desempenho por barbeiro

export function desempenhoBarbeiros(leads, precoMap = {}) {
  const mapa = {};
  const get = (nome) => {
    const k = nome || "Não informado";
    if (!mapa[k]) {
      mapa[k] = {
        barbeiro: k,
        atendimentos: 0,
        faltas: 0,
        cancelamentos: 0,
        rendimento: 0,
        clientes: new Set(),
        servicos: {},
      };
    }
    return mapa[k];
  };

  for (const l of leads || []) {
    const b = get(l.barbeiro_preferido);
    const sit = l.situacao_atendimento;
    if (sit === "compareceu") {
      b.atendimentos++;
      b.rendimento += precoDoLead(l, precoMap);
      if (l.servico_interesse) b.servicos[l.servico_interesse] = (b.servicos[l.servico_interesse] || 0) + 1;
      const tel = normalizePhone(l.whatsapp) || (l.email || "").toLowerCase();
      if (tel) b.clientes.add(tel);
    } else if (sit === "faltou") b.faltas++;
    else if (sit === "cancelado") b.cancelamentos++;
  }

  const total = Object.values(mapa).reduce((s, b) => s + b.rendimento, 0);
  return Object.values(mapa)
    .map((b) => ({
      ...b,
      clientes: b.clientes.size,
      ticket: b.atendimentos > 0 ? b.rendimento / b.atendimentos : 0,
      participacao: total > 0 ? (b.rendimento / total) * 100 : 0,
      servico_top: Object.entries(b.servicos).sort((a, c) => c[1] - a[1])[0]?.[0] || "—",
    }))
    .sort((a, b) => b.rendimento - a.rendimento || b.atendimentos - a.atendimentos);
}

// ------------------------------------------------- 5. análise de serviços

export function analiseServicos(leads, precoMap = {}) {
  const mapa = {};
  let totalRendimento = 0;
  let totalAtend = 0;

  for (const l of leads || []) {
    const nome = l.servico_interesse || "Não informado";
    if (!mapa[nome]) mapa[nome] = { servico: nome, atendimentos: 0, rendimento: 0, faltas: 0, clientes: new Set() };
    const s = mapa[nome];
    const sit = l.situacao_atendimento;
    if (sit === "compareceu") {
      const preco = precoDoLead(l, precoMap);
      s.atendimentos++;
      s.rendimento += preco;
      totalRendimento += preco;
      totalAtend++;
      const tel = normalizePhone(l.whatsapp) || (l.email || "").toLowerCase();
      if (tel) s.clientes.add(tel);
    } else if (sit === "faltou") s.faltas++;
  }

  const lista = Object.values(mapa)
    .map((s) => ({
      ...s,
      clientes: s.clientes.size,
      ticket: s.atendimentos > 0 ? s.rendimento / s.atendimentos : 0,
      participacao: totalRendimento > 0 ? (s.rendimento / totalRendimento) * 100 : 0,
      participacao_volume: totalAtend > 0 ? (s.atendimentos / totalAtend) * 100 : 0,
    }))
    .sort((a, b) => b.rendimento - a.rendimento || b.atendimentos - a.atendimentos);

  return {
    total_rendimento: totalRendimento,
    total_atendimentos: totalAtend,
    lista,
    mais_rentavel: lista[0] || null,
    mais_vendido: [...lista].sort((a, b) => b.atendimentos - a.atendimentos)[0] || null,
    menos_vendido: lista.length > 1 ? [...lista].sort((a, b) => a.atendimentos - b.atendimentos)[0] : null,
  };
}

// ------------------------------------------------- 6. funil do site

// Funil: visitas → cliques no AppBarber → leads → atendimentos (compareceu).
// Usa AnalyticsEvent (site) e Leads (banco). Devolve também quebra por canal.
export function funilSite(eventos, leads, precoMap = {}) {
  const evs = eventos || [];
  const visitas = evs.filter((e) => e.tipo_evento === "visita");
  const sessoes = new Set(visitas.map((e) => e.sessao_id).filter(Boolean)).size;
  const cliquesApp = evs.filter((e) => e.tipo_evento === "clique" && e.destino === "appbarber").length;
  const cliquesWhats = evs.filter((e) => e.tipo_evento === "clique" && e.destino === "whatsapp").length;
  const chats = evs.filter((e) => e.tipo_evento === "chat_interacao").length;

  const lds = leads || [];
  const atendimentos = lds.filter((l) => l.situacao_atendimento === "compareceu").length;
  const rendimento = lds
    .filter((l) => l.situacao_atendimento === "compareceu")
    .reduce((s, l) => s + precoDoLead(l, precoMap), 0);

  const etapas = [
    { etapa: "Visitas ao site", valor: visitas.length },
    { etapa: "Cliques no AppBarber", valor: cliquesApp },
    { etapa: "Leads registrados", valor: lds.length },
    { etapa: "Atendimentos realizados", valor: atendimentos },
  ];

  return {
    visitas: visitas.length,
    sessoes,
    cliques_appbarber: cliquesApp,
    cliques_whatsapp: cliquesWhats,
    chats,
    leads: lds.length,
    atendimentos,
    rendimento,
    etapas,
    taxa_visita_clique: visitas.length > 0 ? (cliquesApp / visitas.length) * 100 : null,
    taxa_clique_lead: cliquesApp > 0 ? (lds.length / cliquesApp) * 100 : null,
    taxa_lead_atendimento: lds.length > 0 ? (atendimentos / lds.length) * 100 : null,
  };
}

// ------------------------------------------------- CSV do relatório

function esc(v) {
  const s = String(v ?? "");
  return /[;"\n\r]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
}

// Monta o CSV único do relatório mensal com todas as seções separadas por
// cabeçalhos. Formato pronto para o Excel (separador ";").
export function exportRelatorioCSV(dados) {
  const {
    mes, comparativo, clientes, faltas, barbeiros, servicos, funil, investimento,
  } = dados;
  const linhas = [];
  const add = (...c) => linhas.push(c.map(esc).join(";"));
  const titulo = (t) => { linhas.push(""); add("=== " + t + " ==="); };

  add("RELATÓRIO MENSAL — BARBEARIA DO NEYZITO");
  add("Período", mesLabel(mes));
  add("Gerado em", new Date().toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" }));

  titulo("1. COMPARATIVO MÊS A MÊS");
  add("Indicador", mesLabel(mes), mesLabel(comparativo.mes_anterior), "Variação %");
  const v = (x) => (x == null ? "—" : x.toFixed(1) + "%");
  add("Rendimento (R$)", comparativo.atual.rendimento.toFixed(2), comparativo.anterior.rendimento.toFixed(2), v(comparativo.variacao.rendimento));
  add("Atendimentos", comparativo.atual.atendimentos, comparativo.anterior.atendimentos, v(comparativo.variacao.atendimentos));
  add("Ticket médio (R$)", comparativo.atual.ticket.toFixed(2), comparativo.anterior.ticket.toFixed(2), v(comparativo.variacao.ticket));
  add("Leads", comparativo.atual.leads, comparativo.anterior.leads, v(comparativo.variacao.leads));
  add("Taxa comparecimento %", comparativo.atual.taxa_comparecimento?.toFixed(1) ?? "—", comparativo.anterior.taxa_comparecimento?.toFixed(1) ?? "—", "");
  add("Taxa falta %", comparativo.atual.taxa_falta?.toFixed(1) ?? "—", comparativo.anterior.taxa_falta?.toFixed(1) ?? "—", "");
  if (Number(investimento) > 0) {
    add("Investimento tráfego (R$)", Number(investimento).toFixed(2), "", "");
    add("CPA (R$)", comparativo.cpa?.toFixed(2) ?? "—", "", "");
    add("CAC (R$)", comparativo.cac?.toFixed(2) ?? "—", "", "");
    add("ROAS", comparativo.roas?.toFixed(2) ?? "—", "", "");
  }

  titulo("2. RANKING DE CLIENTES");
  add("Clientes únicos", clientes.total_clientes);
  add("Clientes ativos", clientes.clientes_ativos);
  add("Recorrentes (2+)", clientes.recorrentes);
  add("Taxa recorrência %", clientes.taxa_recorrencia?.toFixed(1) ?? "—");
  add("");
  add("#", "Cliente (por gasto)", "Visitas", "Total gasto (R$)", "Ticket (R$)");
  clientes.por_gasto.forEach((c, i) => add(i + 1, c.nome, c.visitas, c.total_gasto.toFixed(2), c.ticket.toFixed(2)));
  add("");
  add("#", "Cliente (por frequência)", "Visitas", "Total gasto (R$)", "Faltas");
  clientes.por_frequencia.forEach((c, i) => add(i + 1, c.nome, c.visitas, c.total_gasto.toFixed(2), c.faltas));

  titulo("3. FALTAS E HORÁRIOS DE PICO");
  add("Total faltas", faltas.total_faltas);
  add("Taxa de falta %", faltas.taxa_falta?.toFixed(1) ?? "—");
  add("Dia de pico", faltas.dia_pico || "—");
  add("Dia de maior rendimento", faltas.melhor_dia_rendimento || "—");
  add("Hora de pico", faltas.hora_pico || "—");
  add("");
  add("Dia da semana", "Atendimentos", "Faltas", "Rendimento (R$)");
  faltas.por_dia.forEach((d) => add(d.dia, d.atendimentos, d.faltas, d.rendimento.toFixed(2)));
  if (faltas.por_hora.length) {
    add("");
    add("Hora", "Atendimentos");
    faltas.por_hora.forEach((h) => add(h.label, h.atendimentos));
  }

  titulo("4. DESEMPENHO POR BARBEIRO");
  add("Barbeiro", "Atendimentos", "Clientes", "Rendimento (R$)", "Ticket (R$)", "Participação %", "Faltas", "Serviço top");
  barbeiros.forEach((b) => add(b.barbeiro, b.atendimentos, b.clientes, b.rendimento.toFixed(2), b.ticket.toFixed(2), b.participacao.toFixed(1), b.faltas, b.servico_top));

  titulo("5. ANÁLISE DE SERVIÇOS");
  add("Serviço", "Atendimentos", "Clientes", "Rendimento (R$)", "Ticket (R$)", "Participação %", "Faltas");
  servicos.lista.forEach((s) => add(s.servico, s.atendimentos, s.clientes, s.rendimento.toFixed(2), s.ticket.toFixed(2), s.participacao.toFixed(1), s.faltas));

  titulo("6. FUNIL DE CONVERSÃO DO SITE");
  add("Etapa", "Quantidade", "Conversão %");
  funil.etapas.forEach((e) => add(e.etapa, e.valor, ""));
  add("Visitas → cliques AppBarber", funil.taxa_visita_clique?.toFixed(1) ?? "—");
  add("Cliques → leads", funil.taxa_clique_lead?.toFixed(1) ?? "—");
  add("Leads → atendimentos", funil.taxa_lead_atendimento?.toFixed(1) ?? "—");
  add("Cliques no WhatsApp", funil.cliques_whatsapp);
  add("Interações no chat", funil.chats);

  const csv = linhas.join("\r\n");
  const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `relatorio-neyzito-${mes || spDateKey(new Date())}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// Reexporta para a página não precisar de dois imports.
export { origemLabel, situacaoLabel };

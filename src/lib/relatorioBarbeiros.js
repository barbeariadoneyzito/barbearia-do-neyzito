// Evolução do rendimento por barbeiro ao longo do tempo.
//
// Diferente do relatório mensal (que mostra um retrato de um único mês), aqui
// agregamos vários meses para responder "rende mais ou menos que antes?".
// A regra de rendimento é a MESMA do resto do painel: só atendimentos com
// situacao_atendimento = "compareceu" entram na soma, usando preco_servico do
// lead ou, na falta dele, o preço atual cadastrado em Servicos.
import { spDateKey, isDateOnly } from "@/lib/timezone";

// Chave "YYYY-MM" de Brasília para um instante.
export function spMonthKey(d = new Date()) {
  return spDateKey(d).slice(0, 7);
}

// Lista os últimos N meses terminando no mês de `endMes` (inclusive), do mais
// antigo para o mais recente.
export function lastMonths(endMes, n) {
  const [y, m] = endMes.split("-").map(Number);
  const out = [];
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(Date.UTC(y, m - 1 - i, 1));
    out.push(`${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`);
  }
  return out;
}

export function monthLabel(mes) {
  const [y, m] = mes.split("-").map(Number);
  return new Intl.DateTimeFormat("pt-BR", { month: "short", year: "2-digit" }).format(
    new Date(Date.UTC(y, m - 1, 1))
  );
}

// Preço efetivo do lead (o capturado no momento, ou o atual do serviço).
function precoDoLead(l, precoMap) {
  if (l.preco_servico != null && l.preco_servico !== "") return Number(l.preco_servico) || 0;
  return precoMap[l.servico_interesse] || 0;
}

// Constrói a matriz de evolução:
//   months:     lista de meses (YYYY-MM), do mais antigo ao mais recente
//   barbeiros:  lista de nomes de barbeiro
//   series:     por barbeiro, o rendimento e os atendimentos em cada mês
//   totaisMes:  rendimento total do mês (todos os barbeiros)
//   totalSerie: rendimento de cada barbeiro somado no período todo
//   variacao:   % do último mês comparado ao penúltimo, por barbeiro
export function computeEvolucaoBarbeiros(leads, months, precoMap = {}) {
  const porMes = {}; // mes -> barbeiro -> { rendimento, compareceu, leads }
  for (const mes of months) porMes[mes] = {};

  for (const l of leads || []) {
    // Mês de referência: data do agendamento quando existir; senão a criação.
    // Data sem hora é um dia civil — o mês vem direto do texto para não
    // deslocar um dia (meia-noite UTC cai no dia anterior em Brasília).
    const ref = l.data_agendamento || l.created_date;
    if (!ref) continue;
    const mes = isDateOnly(ref)
      ? String(ref).slice(0, 7)
      : spMonthKey(new Date(ref));
    if (!porMes[mes]) continue; // fora da janela pedida
    const b = l.barbeiro_preferido || "Não informado";
    if (!porMes[mes][b]) porMes[mes][b] = { rendimento: 0, compareceu: 0, leads: 0 };
    const cell = porMes[mes][b];
    cell.leads++;
    if (l.situacao_atendimento === "compareceu") {
      cell.compareceu++;
      cell.rendimento += precoDoLead(l, precoMap);
    }
  }

  const barbeiros = Array.from(
    new Set(months.flatMap((m) => Object.keys(porMes[m] || {})))
  ).sort();

  const series = {};
  for (const b of barbeiros) {
    series[b] = months.map((mes) => ({
      mes,
      rendimento: porMes[mes]?.[b]?.rendimento || 0,
      compareceu: porMes[mes]?.[b]?.compareceu || 0,
      leads: porMes[mes]?.[b]?.leads || 0,
    }));
  }

  const totaisMes = months.map((mes) => ({
    mes,
    rendimento: Object.values(porMes[mes] || {}).reduce((s, c) => s + c.rendimento, 0),
    compareceu: Object.values(porMes[mes] || {}).reduce((s, c) => s + c.compareceu, 0),
  }));

  const totalSerie = barbeiros
    .map((b) => ({
      barbeiro: b,
      rendimento: series[b].reduce((s, c) => s + c.rendimento, 0),
      compareceu: series[b].reduce((s, c) => s + c.compareceu, 0),
    }))
    .sort((a, b) => b.rendimento - a.rendimento);

  // Variação do último mês fechado em relação ao anterior, por barbeiro.
  const variacao = {};
  const n = months.length;
  if (n >= 2) {
    const atual = months[n - 1];
    const anterior = months[n - 2];
    for (const b of barbeiros) {
      const a = porMes[atual]?.[b]?.rendimento || 0;
      const p = porMes[anterior]?.[b]?.rendimento || 0;
      variacao[b] = {
        mesAtual: atual,
        mesAnterior: anterior,
        atual: a,
        anterior: p,
        // Sem base anterior não há % confiável (evita "∞%" e falsos crescimentos).
        pct: p > 0 ? ((a - p) / p) * 100 : null,
      };
    }
  }

  return { months, barbeiros, series, totaisMes, totalSerie, variacao };
}

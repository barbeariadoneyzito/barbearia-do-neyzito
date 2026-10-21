import { useEffect, useState, useCallback } from "react";
import { Download, RefreshCw, Scissors, TrendingUp } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { monthRangeQuery } from "@/lib/metricasPanel";
import { formatBRL } from "@/lib/leadsPanel";
import { spDateKey } from "@/lib/timezone";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";

// "YYYY-MM" do instante atual no fuso de Brasília.
function currentMonthSP() {
  return spDateKey(new Date()).slice(0, 7);
}

// Rótulo "outubro de 2026" a partir de "2026-10".
function monthLabel(mes) {
  const [y, m] = mes.split("-").map(Number);
  return new Intl.DateTimeFormat("pt-BR", {
    month: "long",
    year: "numeric",
  }).format(new Date(Date.UTC(y, m - 1, 1)));
}

function shiftMonth(mes, delta) {
  const [y, m] = mes.split("-").map(Number);
  return spDateKey(new Date(Date.UTC(y, m - 1 + delta, 1))).slice(0, 7);
}

// Agrupa leads por barbeiro e calcula atendimentos (compareceu), faltas,
// cancelamentos e rendimento (soma do preço do serviço dos que compareceram).
// O preço efetivo de cada lead = preco_servico capturado, ou o preço atual do
// serviço cadastrado (Servicos) quando o lead não trouxer o valor.
function computeReport(leads, barbeiros, precoMap) {
  const map = {};
  const ensure = (nome) => {
    if (!map[nome])
      map[nome] = {
        barbeiro: nome,
        leads: 0,
        compareceu: 0,
        faltou: 0,
        cancelado: 0,
        pendente: 0,
        rendimento: 0,
      };
    return map[nome];
  };
  for (const b of barbeiros) ensure(b.nome);
  for (const l of leads) {
    const r = ensure(l.barbeiro_preferido || "Não informado");
    r.leads++;
    const sit = l.situacao_atendimento || "";
    const preco =
      l.preco_servico != null && l.preco_servico !== ""
        ? Number(l.preco_servico)
        : precoMap[l.servico_interesse] || 0;
    if (sit === "compareceu") {
      r.compareceu++;
      r.rendimento += preco;
    } else if (sit === "faltou") r.faltou++;
    else if (sit === "cancelado") r.cancelado++;
    else r.pendente++;
  }
  return Object.values(map)
    .map((r) => ({
      ...r,
      ticket: r.compareceu > 0 ? r.rendimento / r.compareceu : 0,
    }))
    .sort((a, b) => b.rendimento - a.rendimento || b.compareceu - a.compareceu);
}

function KPI({ label, value, accent }) {
  return (
    <div className="rounded-lg border border-white/10 bg-[#0E0E10] px-4 py-3">
      <p className="text-[11px] uppercase tracking-wide text-slate-500">{label}</p>
      <p className={`mt-1 text-xl font-heading tracking-wide ${accent || "text-white"}`}>{value}</p>
    </div>
  );
}

const tooltipStyle = {
  backgroundColor: "#111113",
  border: "1px solid rgba(255,255,255,0.1)",
  borderRadius: "8px",
  color: "#fff",
  fontSize: "12px",
};

export default function MetricasBarbeiros() {
  const [mes, setMes] = useState(currentMonthSP());
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState([]);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const q = monthRangeQuery(mes);
      const [leadsPage, barbeirosPage, servicosPage] = await Promise.all([
        base44.entities.Leads.filter(q, { sort: "-created_date", limit: 500 }),
        base44.entities.Barbeiros.filter({ ativo: true }, { sort: "nome", limit: 100 }).catch(() => ({ items: [] })),
        base44.entities.Servicos.filter({ ativo: true }, { sort: "nome", limit: 100 }).catch(() => ({ items: [] })),
      ]);
      const precoMap = {};
      for (const s of servicosPage.items || []) if (s.nome) precoMap[s.nome] = s.preco;
      setRows(computeReport(leadsPage.items || [], barbeirosPage.items || [], precoMap));
    } catch (e) {
      console.error(e);
      setError(e?.message ? String(e.message) : "Erro ao carregar o relatório.");
    } finally {
      setLoading(false);
    }
  }, [mes]);

  useEffect(() => {
    const t = setTimeout(() => load(), 200);
    return () => clearTimeout(t);
  }, [load]);

  const totals = rows.reduce(
    (acc, r) => ({
      leads: acc.leads + r.leads,
      compareceu: acc.compareceu + r.compareceu,
      faltou: acc.faltou + r.faltou,
      cancelado: acc.cancelado + r.cancelado,
      pendente: acc.pendente + r.pendente,
      rendimento: acc.rendimento + r.rendimento,
    }),
    { leads: 0, compareceu: 0, faltou: 0, cancelado: 0, pendente: 0, rendimento: 0 }
  );
  totals.ticket = totals.compareceu > 0 ? totals.rendimento / totals.compareceu : 0;

  const exportCSV = () => {
    const headers = [
      "Barbeiro",
      "Leads",
      "Atendimentos",
      "Faltou",
      "Cancelado",
      "Pendentes",
      "Rendimento",
      "Ticket_Medio",
    ];
    const data = [...rows, { barbeiro: "TOTAL", ...totals, ticket: totals.ticket }];
    const escape = (v) => {
      const s = String(v ?? "");
      if (s.includes(";") || s.includes('"') || s.includes("\n") || s.includes("\r"))
        return '"' + s.replace(/"/g, '""') + '"';
      return s;
    };
    const csv = [
      headers,
      ...data.map((r) => [
        r.barbeiro,
        r.leads,
        r.compareceu,
        r.faltou,
        r.cancelado,
        r.pendente,
        r.rendimento ? r.rendimento.toFixed(2) : "",
        r.ticket ? r.ticket.toFixed(2) : "",
      ]),
    ]
      .map((row) => row.map(escape).join(";"))
      .join("\r\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `rendimento-barbeiros-${mes}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const chartData = rows.filter((r) => r.rendimento > 0).map((r) => ({
    nome: r.barbeiro,
    rendimento: r.rendimento,
  }));

  const btnCls =
    "h-8 w-8 inline-flex items-center justify-center rounded-md border border-white/10 text-slate-300 hover:border-[#A81C1C] hover:text-white disabled:opacity-40 disabled:cursor-not-allowed";

  return (
    <section className="rounded-lg border border-white/10 bg-[#111113] p-4 sm:p-5 space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Scissors className="h-5 w-5 text-[#E05252]" />
          <h2 className="font-heading text-lg tracking-wide">RELATÓRIO MENSAL POR BARBEIRO</h2>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1">
            <button onClick={() => setMes(shiftMonth(mes, -1))} className={btnCls} title="Mês anterior">
              ‹
            </button>
            <input
              type="month"
              value={mes}
              max={currentMonthSP()}
              onChange={(e) => e.target.value && setMes(e.target.value)}
              className="rounded-md border border-white/10 bg-[#0A0A0B] px-2 py-1.5 text-sm text-white focus:border-[#A81C1C] focus:outline-none [color-scheme:dark]"
            />
            <button
              onClick={() => setMes(shiftMonth(mes, 1))}
              disabled={mes >= currentMonthSP()}
              className={btnCls}
              title="Próximo mês"
            >
              ›
            </button>
            <button
              onClick={() => setMes(currentMonthSP())}
              className="text-xs text-slate-300 hover:text-white border border-white/10 px-2.5 py-1.5 rounded-md"
            >
              Atual
            </button>
          </div>
          <button
            onClick={load}
            disabled={loading}
            className="text-xs text-slate-300 hover:text-white border border-white/10 px-3 py-2 rounded-md inline-flex items-center gap-1.5 disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} /> Atualizar
          </button>
          <button
            onClick={exportCSV}
            disabled={!rows.length}
            className="text-xs text-white bg-[#A81C1C] hover:bg-[#C22424] px-3 py-2 rounded-md inline-flex items-center gap-1.5 disabled:opacity-50"
          >
            <Download className="h-4 w-4" /> CSV
          </button>
        </div>
      </div>

      <p className="text-xs text-slate-400 capitalize -mt-2">{monthLabel(mes)}</p>

      {loading ? (
        <div className="flex justify-center py-10">
          <div className="w-8 h-8 border-4 border-white/20 border-t-[#E05252] rounded-full animate-spin" />
        </div>
      ) : error ? (
        <div className="text-rose-400 text-sm py-6 text-center">{error}</div>
      ) : totals.leads === 0 ? (
        <div className="text-center py-10 text-slate-500 text-sm">
          Nenhum lead registrado em {monthLabel(mes)}.
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <KPI label="Atendimentos" value={totals.compareceu} accent="text-emerald-300" />
            <KPI label="Rendimento total" value={formatBRL(totals.rendimento)} />
            <KPI label="Ticket médio" value={totals.compareceu ? formatBRL(totals.ticket) : "—"} />
            <KPI
              label="Taxa comparecimento"
              value={totals.leads ? `${Math.round((totals.compareceu / totals.leads) * 100)}%` : "—"}
            />
          </div>

          <div className="overflow-x-auto rounded-lg border border-white/10">
            <table className="w-full min-w-[760px] text-sm">
              <thead className="bg-[#0E0E10] text-slate-400">
                <tr className="text-left">
                  <th className="px-3 py-3 font-medium">Barbeiro</th>
                  <th className="px-3 py-3 font-medium">Leads</th>
                  <th className="px-3 py-3 font-medium">Atendimentos</th>
                  <th className="px-3 py-3 font-medium">Faltou</th>
                  <th className="px-3 py-3 font-medium">Cancelado</th>
                  <th className="px-3 py-3 font-medium">Pendentes</th>
                  <th className="px-3 py-3 font-medium">Rendimento</th>
                  <th className="px-3 py-3 font-medium">Ticket médio</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {rows.map((r) => (
                  <tr key={r.barbeiro} className="hover:bg-white/[0.02]">
                    <td className="px-3 py-3 text-white font-medium">{r.barbeiro}</td>
                    <td className="px-3 py-3 text-slate-300">{r.leads}</td>
                    <td className="px-3 py-3 text-emerald-300">{r.compareceu}</td>
                    <td className="px-3 py-3 text-rose-300">{r.faltou}</td>
                    <td className="px-3 py-3 text-slate-300">{r.cancelado}</td>
                    <td className="px-3 py-3 text-amber-300">{r.pendente}</td>
                    <td className="px-3 py-3 text-white font-semibold whitespace-nowrap">
                      {formatBRL(r.rendimento)}
                    </td>
                    <td className="px-3 py-3 text-slate-300 whitespace-nowrap">
                      {r.compareceu ? formatBRL(r.ticket) : "—"}
                    </td>
                  </tr>
                ))}
                <tr className="bg-[#0E0E10] font-semibold">
                  <td className="px-3 py-3 text-white">TOTAL</td>
                  <td className="px-3 py-3 text-white">{totals.leads}</td>
                  <td className="px-3 py-3 text-emerald-300">{totals.compareceu}</td>
                  <td className="px-3 py-3 text-rose-300">{totals.faltou}</td>
                  <td className="px-3 py-3 text-white">{totals.cancelado}</td>
                  <td className="px-3 py-3 text-amber-300">{totals.pendente}</td>
                  <td className="px-3 py-3 text-white whitespace-nowrap">{formatBRL(totals.rendimento)}</td>
                  <td className="px-3 py-3 text-slate-200 whitespace-nowrap">
                    {totals.compareceu ? formatBRL(totals.ticket) : "—"}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {chartData.length > 0 && (
            <div>
              <p className="text-sm font-semibold text-white mb-2 flex items-center gap-1.5">
                <TrendingUp className="h-4 w-4 text-[#E05252]" /> Rendimento por barbeiro (R$)
              </p>
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" />
                    <XAxis dataKey="nome" tick={{ fill: "#94a3b8", fontSize: 12 }} />
                    <YAxis
                      tick={{ fill: "#94a3b8", fontSize: 12 }}
                      tickFormatter={(v) => `R$${Math.round(v)}`}
                      width={70}
                    />
                    <Tooltip
                      contentStyle={tooltipStyle}
                      formatter={(v) => [formatBRL(v), "Rendimento"]}
                    />
                    <Bar dataKey="rendimento" fill="#A81C1C" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}
        </>
      )}
    </section>
  );
}
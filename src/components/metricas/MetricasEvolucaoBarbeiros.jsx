import { useEffect, useState, useCallback, useMemo } from "react";
import { Download, RefreshCw, TrendingDown, TrendingUp, Activity, AlertTriangle } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { formatBRL } from "@/lib/leadsPanel";
import { spDateKey } from "@/lib/timezone";
import {
  computeEvolucaoBarbeiros,
  lastMonths,
  monthLabel,
  spMonthKey,
} from "@/lib/relatorioBarbeiros";
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

// Paleta para as séries de barbeiros no gráfico de tendência. Repete se houver
// mais barbeiros que cores.
const CORES = ["#E05252", "#3B82F6", "#22C55E", "#F59E0B", "#A855F7", "#14B8A6", "#EC4899", "#64748B"];

// Queda a partir deste percentual (mês atual vs. anterior) dispara alerta.
const LIMITE_QUEDA_PCT = -10;

function startOfMonthsAgo(mesInicial) {
  // Instante (UTC) do dia 1 às 00:00 -03:00 do mês mais antigo da janela.
  const [y, m] = mesInicial.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, 1, 3, 0, 0));
}

function KPI({ label, value, accent, hint }) {
  return (
    <div className="rounded-lg border border-white/10 bg-[#0E0E10] px-4 py-3">
      <p className="text-[11px] uppercase tracking-wide text-slate-500">{label}</p>
      <p className={`mt-1 text-xl font-heading tracking-wide ${accent || "text-white"}`}>{value}</p>
      {hint && <p className="text-[11px] text-slate-500 mt-0.5">{hint}</p>}
    </div>
  );
}

// Selo de variação percentual: verde quando sobe, vermelho quando cai.
function VariacaoBadge({ pct }) {
  if (pct == null) {
    return <span className="text-xs text-slate-500">sem base anterior</span>;
  }
  const subiu = pct >= 0;
  const Icone = subiu ? TrendingUp : TrendingDown;
  return (
    <span
      className={`inline-flex items-center gap-1 text-xs font-medium ${
        subiu ? "text-emerald-300" : "text-rose-300"
      }`}
    >
      <Icone className="h-3.5 w-3.5" />
      {subiu ? "+" : ""}
      {pct.toFixed(1)}%
    </span>
  );
}

const tooltipStyle = {
  backgroundColor: "#111113",
  border: "1px solid rgba(255,255,255,0.1)",
  borderRadius: "8px",
  color: "#fff",
  fontSize: "12px",
};

export default function MetricasEvolucaoBarbeiros({ meses = 6 }) {
  // Mês de referência (o mais recente da janela) controlado pelo usuário.
  const [endMes, setEndMes] = useState(spMonthKey(new Date()));
  const [loading, setLoading] = useState(true);
  const [leads, setLeads] = useState([]);
  const [precoMap, setPrecoMap] = useState({});
  const [error, setError] = useState(null);

  const months = useMemo(() => lastMonths(endMes, meses), [endMes, meses]);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // Uma única consulta cobrindo a janela inteira: do início do mês mais
      // antigo até o instante atual. Reaproveitada por todas as agregações.
      const from = startOfMonthsAgo(months[0]).toISOString();
      const [leadsPage, servicosPage] = await Promise.all([
        base44.entities.Leads.filter(
          { created_date: { $gte: from } },
          { sort: "-created_date", limit: 2000 }
        ),
        base44.entities.Servicos.filter({ ativo: true }, { sort: "nome", limit: 100 }).catch(
          () => ({ items: [] })
        ),
      ]);
      const mapa = {};
      for (const s of servicosPage.items || []) if (s.nome) mapa[s.nome] = s.preco;
      setPrecoMap(mapa);
      setLeads(leadsPage.items || []);
    } catch (e) {
      console.error(e);
      setError(e?.message ? String(e.message) : "Erro ao carregar a evolução.");
    } finally {
      setLoading(false);
    }
  }, [months]);

  useEffect(() => {
    const t = setTimeout(() => load(), 200);
    return () => clearTimeout(t);
  }, [load]);

  const evo = useMemo(
    () => computeEvolucaoBarbeiros(leads, months, precoMap),
    [leads, months, precoMap]
  );

  // Dados do gráfico de tendência: uma linha por barbeiro, x = mês.
  const chartData = useMemo(() => {
    return months.map((mes, i) => {
      const ponto = { mes, label: monthLabel(mes) };
      for (const b of evo.barbeiros) ponto[b] = evo.series[b][i]?.rendimento || 0;
      return ponto;
    });
  }, [months, evo]);

  const totalPeriodo = evo.totaisMes.reduce((s, m) => s + m.rendimento, 0);
  const atendPeriodo = evo.totaisMes.reduce((s, m) => s + m.compareceu, 0);
  const ultimoMes = evo.totaisMes[evo.totaisMes.length - 1];
  const penultimoMes = evo.totaisMes[evo.totaisMes.length - 2];
  const totalPct =
    penultimoMes && penultimoMes.rendimento > 0
      ? ((ultimoMes.rendimento - penultimoMes.rendimento) / penultimoMes.rendimento) * 100
      : null;

  // Barbeiros em queda no comparativo do último mês, ordenados da maior queda.
  const quedas = useMemo(
    () =>
      Object.entries(evo.variacao)
        .filter(([, v]) => v.pct != null && v.pct <= LIMITE_QUEDA_PCT)
        .sort((a, b) => a[1].pct - b[1].pct),
    [evo]
  );

  const exportCSV = () => {
    const headers = ["Barbeiro", ...months.map((m) => monthLabel(m)), "Total_Periodo"];
    const rows = evo.totalSerie.map((r) => [
      r.barbeiro,
      ...evo.series[r.barbeiro].map((c) => (c.rendimento ? c.rendimento.toFixed(2) : "0.00")),
      r.rendimento.toFixed(2),
    ]);
    rows.push([
      "TOTAL",
      ...evo.totaisMes.map((m) => (m.rendimento ? m.rendimento.toFixed(2) : "0.00")),
      totalPeriodo.toFixed(2),
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
    a.download = `evolucao-barbeiros-${months[0]}_a_${endMes}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const shiftEndMonth = (delta) => {
    const [y, m] = endMes.split("-").map(Number);
    setEndMes(spDateKey(new Date(Date.UTC(y, m - 1 + delta, 1))).slice(0, 7));
  };

  const mesAtual = spMonthKey(new Date());
  const btnCls =
    "h-8 w-8 inline-flex items-center justify-center rounded-md border border-white/10 text-slate-300 hover:border-[#A81C1C] hover:text-white disabled:opacity-40 disabled:cursor-not-allowed";

  const semDados = evo.barbeiros.length === 0 || totalPeriodo === 0;

  return (
    <section className="rounded-lg border border-white/10 bg-[#111113] p-4 sm:p-5 space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Activity className="h-5 w-5 text-[#E05252]" />
          <h2 className="font-heading text-lg tracking-wide">EVOLUÇÃO DO RENDIMENTO POR BARBEIRO</h2>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1">
            <button onClick={() => shiftEndMonth(-1)} className={btnCls} title="Janela anterior">
              ‹
            </button>
            <input
              type="month"
              value={endMes}
              max={mesAtual}
              onChange={(e) => e.target.value && setEndMes(e.target.value)}
              className="rounded-md border border-white/10 bg-[#0A0A0B] px-2 py-1.5 text-sm text-white focus:border-[#A81C1C] focus:outline-none [color-scheme:dark]"
            />
            <button
              onClick={() => shiftEndMonth(1)}
              disabled={endMes >= mesAtual}
              className={btnCls}
              title="Próxima janela"
            >
              ›
            </button>
            <button
              onClick={() => setEndMes(mesAtual)}
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
            disabled={!evo.totalSerie.length}
            className="text-xs text-white bg-[#A81C1C] hover:bg-[#C22424] px-3 py-2 rounded-md inline-flex items-center gap-1.5 disabled:opacity-50"
          >
            <Download className="h-4 w-4" /> CSV
          </button>
        </div>
      </div>

      <p className="text-xs text-slate-400 capitalize -mt-2">
        {monthLabel(months[0])} a {monthLabel(endMes)} · {meses} meses
      </p>

      {loading ? (
        <div className="flex justify-center py-10">
          <div className="w-8 h-8 border-4 border-white/20 border-t-[#E05252] rounded-full animate-spin" />
        </div>
      ) : error ? (
        <div className="text-rose-400 text-sm py-6 text-center">{error}</div>
      ) : semDados ? (
        <div className="text-center py-10 text-slate-500 text-sm">
          Nenhum atendimento com rendimento registrado nesta janela. Importe os atendimentos do
          AppBarber no painel de Leads para alimentar a evolução.
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <KPI label="Rendimento no período" value={formatBRL(totalPeriodo)} />
            <KPI label="Atendimentos" value={atendPeriodo} accent="text-emerald-300" />
            <KPI
              label={`Último mês (${monthLabel(endMes)})`}
              value={formatBRL(ultimoMes.rendimento)}
            />
            <KPI
              label="Variação vs. mês anterior"
              value={<VariacaoBadge pct={totalPct} />}
              accent="text-white"
            />
          </div>

          {quedas.length > 0 && (
            <div className="flex items-start gap-2 rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-3">
              <AlertTriangle className="h-4 w-4 text-amber-400 mt-0.5 shrink-0" />
              <div className="text-sm text-amber-200">
                <p className="font-medium">
                  {quedas.length === 1
                    ? "1 barbeiro com queda no rendimento"
                    : `${quedas.length} barbeiros com queda no rendimento`}
                </p>
                <p className="text-amber-200/80 text-xs mt-0.5">
                  Comparando {monthLabel(evo.variacao[quedas[0][0]]?.mesAtual)}{" "}
                  com {monthLabel(evo.variacao[quedas[0][0]]?.mesAnterior)}:
                </p>
                <ul className="mt-1.5 space-y-0.5">
                  {quedas.map(([nome, v]) => (
                    <li key={nome} className="text-xs">
                      <span className="font-medium text-white">{nome}</span> — {formatBRL(v.atual)}{" "}
                      <span className="text-rose-300">({v.pct.toFixed(1)}%)</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          <div>
            <p className="text-sm font-semibold text-white mb-2 flex items-center gap-1.5">
              <Activity className="h-4 w-4 text-[#E05252]" /> Tendência de rendimento por barbeiro (R$)
            </p>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" />
                  <XAxis dataKey="label" tick={{ fill: "#94a3b8", fontSize: 12 }} />
                  <YAxis
                    tick={{ fill: "#94a3b8", fontSize: 12 }}
                    tickFormatter={(v) => `R$${Math.round(v)}`}
                    width={70}
                  />
                  <Tooltip
                    contentStyle={tooltipStyle}
                    formatter={(v, name) => [formatBRL(v), name]}
                    labelStyle={{ color: "#e2e8f0" }}
                  />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  {evo.barbeiros.map((b, i) => (
                    <Line
                      key={b}
                      type="monotone"
                      dataKey={b}
                      stroke={CORES[i % CORES.length]}
                      strokeWidth={2}
                      dot={{ r: 3 }}
                      activeDot={{ r: 5 }}
                    />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="overflow-x-auto rounded-lg border border-white/10">
            <table className="w-full min-w-[720px] text-sm">
              <thead className="bg-[#0E0E10] text-slate-400">
                <tr className="text-left">
                  <th className="px-3 py-3 font-medium">Barbeiro</th>
                  <th className="px-3 py-3 font-medium">Atendimentos</th>
                  {months.map((m) => (
                    <th key={m} className="px-3 py-3 font-medium whitespace-nowrap capitalize">
                      {monthLabel(m)}
                    </th>
                  ))}
                  <th className="px-3 py-3 font-medium">Total</th>
                  <th className="px-3 py-3 font-medium">Var. último mês</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {evo.totalSerie.map((r) => (
                  <tr key={r.barbeiro} className="hover:bg-white/[0.02]">
                    <td className="px-3 py-3 text-white font-medium">{r.barbeiro}</td>
                    <td className="px-3 py-3 text-emerald-300">{r.compareceu}</td>
                    {evo.series[r.barbeiro].map((c) => (
                      <td key={c.mes} className="px-3 py-3 text-slate-300 whitespace-nowrap">
                        {c.rendimento ? formatBRL(c.rendimento) : "—"}
                      </td>
                    ))}
                    <td className="px-3 py-3 text-white font-semibold whitespace-nowrap">
                      {formatBRL(r.rendimento)}
                    </td>
                    <td className="px-3 py-3 whitespace-nowrap">
                      <VariacaoBadge pct={evo.variacao[r.barbeiro]?.pct ?? null} />
                    </td>
                  </tr>
                ))}
                <tr className="bg-[#0E0E10] font-semibold">
                  <td className="px-3 py-3 text-white">TOTAL</td>
                  <td className="px-3 py-3 text-emerald-300">{atendPeriodo}</td>
                  {evo.totaisMes.map((m) => (
                    <td key={m.mes} className="px-3 py-3 text-slate-200 whitespace-nowrap">
                      {formatBRL(m.rendimento)}
                    </td>
                  ))}
                  <td className="px-3 py-3 text-white whitespace-nowrap">{formatBRL(totalPeriodo)}</td>
                  <td className="px-3 py-3">
                    <VariacaoBadge pct={totalPct} />
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <p className="text-[11px] text-slate-500">
            O rendimento considera apenas atendimentos marcados como <strong>compareceu</strong>,
            somando o valor do serviço de cada um. Meses sem base de comparação não exibem percentual.
          </p>
        </>
      )}
    </section>
  );
}

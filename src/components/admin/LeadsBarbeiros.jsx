import { useMemo } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Users } from "lucide-react";

const brl = (v) =>
  (Number(v) || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

// Desempenho por barbeiro a partir dos leads já filtrados (respeita o período,
// barbeiro, nome e demais filtros do painel). Rendimento = soma do preço do
// serviço dos atendimentos marcados como "Compareceu".
export default function LeadsBarbeiros({ leads }) {
  const rows = useMemo(() => {
    const map = {};
    for (const l of leads || []) {
      const b = l.barbeiro_preferido || "Não definido";
      if (!map[b]) {
        map[b] = {
          barbeiro: b,
          agendamentos: 0,
          compareceu: 0,
          faltou: 0,
          cancelado: 0,
          pendente: 0,
          reagendado: 0,
          rendimento: 0,
        };
      }
      const r = map[b];
      r.agendamentos++;
      const s = l.situacao_atendimento;
      if (s === "compareceu") {
        r.compareceu++;
        r.rendimento += Number(l.preco_servico) || 0;
      } else if (s === "faltou") r.faltou++;
      else if (s === "cancelado") r.cancelado++;
      else if (s === "reagendado") r.reagendado++;
      else r.pendente++;
    }
    return Object.values(map).sort((a, b) => b.agendamentos - a.agendamentos);
  }, [leads]);

  if (!rows.length) return null;

  const chartData = rows.map((r) => ({
    barbeiro: r.barbeiro,
    Compareceu: r.compareceu,
    Faltou: r.faltou,
    Cancelado: r.cancelado,
  }));

  return (
    <section className="rounded-lg border border-white/10 bg-[#111113]">
      <div className="px-4 py-3 border-b border-white/10 flex items-center gap-2">
        <Users className="h-4 w-4 text-[#E05252]" />
        <p className="text-sm font-semibold text-white">Desempenho por barbeiro</p>
        <span className="text-xs text-slate-500">· reflete o período e filtros acima</span>
      </div>
      <div className="p-4 space-y-4">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-sm">
            <thead className="text-slate-400 text-left">
              <tr>
                <th className="px-2 py-2 font-medium">Barbeiro</th>
                <th className="px-2 py-2 font-medium text-right">Agendamentos</th>
                <th className="px-2 py-2 font-medium text-right">Compareceu</th>
                <th className="px-2 py-2 font-medium text-right">Faltou</th>
                <th className="px-2 py-2 font-medium text-right">Cancelado</th>
                <th className="px-2 py-2 font-medium text-right">Reagendado</th>
                <th className="px-2 py-2 font-medium text-right">Taxa comp.</th>
                <th className="px-2 py-2 font-medium text-right">Rendimento</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {rows.map((r) => {
                const base = r.compareceu + r.faltou;
                const taxa = base > 0 ? Math.round((r.compareceu / base) * 100) : null;
                return (
                  <tr key={r.barbeiro} className="hover:bg-white/[0.02]">
                    <td className="px-2 py-2 text-white font-medium">{r.barbeiro}</td>
                    <td className="px-2 py-2 text-right text-slate-300">{r.agendamentos}</td>
                    <td className="px-2 py-2 text-right text-emerald-300">{r.compareceu}</td>
                    <td className="px-2 py-2 text-right text-red-300">{r.faltou}</td>
                    <td className="px-2 py-2 text-right text-red-300">{r.cancelado}</td>
                    <td className="px-2 py-2 text-right text-amber-300">{r.reagendado}</td>
                    <td className="px-2 py-2 text-right text-slate-300">{taxa === null ? "—" : `${taxa}%`}</td>
                    <td className="px-2 py-2 text-right text-emerald-300 font-medium">{brl(r.rendimento)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
              <XAxis dataKey="barbeiro" tick={{ fill: "#94a3b8", fontSize: 12 }} />
              <YAxis allowDecimals={false} tick={{ fill: "#94a3b8", fontSize: 12 }} />
              <Tooltip
                contentStyle={{
                  background: "#111113",
                  border: "1px solid rgba(255,255,255,0.1)",
                  borderRadius: 8,
                  color: "#fff",
                }}
                cursor={{ fill: "rgba(255,255,255,0.04)" }}
              />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Bar dataKey="Compareceu" stackId="a" fill="#10b981" />
              <Bar dataKey="Faltou" stackId="a" fill="#ef4444" />
              <Bar dataKey="Cancelado" stackId="a" fill="#7f1d1d" />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <p className="text-xs text-slate-500 leading-relaxed">
          <strong className="text-slate-400">Rendimento</strong> = soma do preço do serviço dos atendimentos marcados
          como “Compareceu”. Atualize a situação de cada lead (✓ compareceu / ✗ faltou / ⊘ cancelado / ↻ reagendado)
          para alimentar estes números.
        </p>
      </div>
    </section>
  );
}
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  BarChart,
  Bar,
  Legend,
} from "recharts";
import { destinoLabel } from "@/lib/metricasPanel";

const tooltipStyle = {
  background: "#111113",
  border: "1px solid rgba(255,255,255,0.12)",
  borderRadius: 8,
  color: "#fff",
  fontSize: 12,
};

export default function MetricasCharts({ evolution, byDest }) {
  const evData = evolution.map((d) => ({
    date: d.label || String(d.date).slice(5),
    visitas: d.visitas,
    cliques: d.cliques,
  }));
  const destData = byDest.map((d) => ({ name: destinoLabel(d.destino), cliques: d.count }));

  return (
    <div className="grid lg:grid-cols-2 gap-4">
      <div className="rounded-lg border border-white/10 bg-[#111113] p-4">
        <p className="text-sm font-semibold text-white mb-3">Evolução de visitas e cliques</p>
        {evData.length === 0 ? (
          <p className="text-sm text-slate-500 py-16 text-center">Sem dados no período.</p>
        ) : (
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={evData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
              <XAxis dataKey="date" stroke="#94a3b8" fontSize={12} />
              <YAxis stroke="#94a3b8" fontSize={12} allowDecimals={false} />
              <Tooltip contentStyle={tooltipStyle} labelStyle={{ color: "#94a3b8" }} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Area type="monotone" dataKey="visitas" name="Visitas" stroke="#E05252" fill="rgba(224,82,82,0.18)" />
              <Area type="monotone" dataKey="cliques" name="Cliques" stroke="#38bdf8" fill="rgba(56,189,248,0.18)" />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>

      <div className="rounded-lg border border-white/10 bg-[#111113] p-4">
        <p className="text-sm font-semibold text-white mb-3">Cliques por destino</p>
        {destData.length === 0 ? (
          <p className="text-sm text-slate-500 py-16 text-center">Sem cliques no período.</p>
        ) : (
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={destData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
              <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} />
              <YAxis stroke="#94a3b8" fontSize={12} allowDecimals={false} />
              <Tooltip contentStyle={tooltipStyle} labelStyle={{ color: "#94a3b8" }} cursor={{ fill: "rgba(255,255,255,0.04)" }} />
              <Bar dataKey="cliques" name="Cliques" fill="#A81C1C" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
import { deviceLabel } from "@/lib/metricasPanel";

function BarList({ title, rows, labelFn }) {
  const max = Math.max(1, ...rows.map((r) => r.count || 0));
  return (
    <div className="rounded-lg border border-white/10 bg-[#111113] p-4">
      <p className="text-sm font-semibold text-white mb-3">{title}</p>
      {rows.length === 0 ? (
        <p className="text-sm text-slate-500">Sem dados.</p>
      ) : (
        <div className="space-y-2.5">
          {rows.map((r, i) => (
            <div key={i}>
              <div className="flex justify-between text-sm">
                <span className="text-slate-300 truncate pr-2">{labelFn(r)}</span>
                <span className="text-slate-400 shrink-0">{r.count}</span>
              </div>
              <div className="mt-1 h-1.5 rounded-full bg-white/5 overflow-hidden">
                <div
                  className="h-1.5 rounded-full bg-[#A81C1C]"
                  style={{ width: `${Math.round(((r.count || 0) / max) * 100)}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function MetricasBreakdown({ byDevice, byUtmCampaign }) {
  return (
    <div className="grid md:grid-cols-2 gap-4">
      <BarList title="Dispositivos" rows={byDevice} labelFn={(r) => deviceLabel(r.dispositivo)} />
      <BarList
        title="Campanhas (UTM campaign)"
        rows={byUtmCampaign}
        labelFn={(r) => r.utm_campaign || "Não identificado"}
      />
    </div>
  );
}
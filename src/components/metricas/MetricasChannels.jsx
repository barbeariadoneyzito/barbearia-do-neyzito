import { canalLabel, isCanalIA } from "@/lib/metricasPanel";

export default function MetricasChannels({ rows, conversaoPorCanal, onSelectCanal }) {
  const sorted = [...(rows || [])].sort((a, b) => (b.count || 0) - (a.count || 0));
  const max = Math.max(1, ...sorted.map((r) => r.count || 0));
  const convMap = {};
  (conversaoPorCanal || []).forEach((c) => { convMap[c.canal] = c; });
  const iaTotal = sorted
    .filter((r) => isCanalIA(r.canal))
    .reduce((s, r) => s + (r.count || 0), 0);

  return (
    <div className="rounded-lg border border-white/10 bg-[#111113] p-4">
      <div className="flex items-center justify-between mb-3">
        <p className="text-sm font-semibold text-white">Visitas por canal</p>
        {iaTotal > 0 && (
          <span className="text-xs text-emerald-400">IA (total): {iaTotal}</span>
        )}
      </div>
      {sorted.length === 0 ? (
        <p className="text-sm text-slate-500">Sem dados.</p>
      ) : (
        <div className="space-y-2.5">
          {sorted.map((r, i) => {
            const ia = isCanalIA(r.canal);
            const canalValue = r.canal || "";
            const interactive = onSelectCanal && canalValue;
            return (
              <div key={i}>
                <div className="flex justify-between text-sm">
                  {interactive ? (
                    <button
                      onClick={() => onSelectCanal(canalValue)}
                      className="text-left hover:text-[#E05252] hover:underline"
                    >
                      <span className={ia ? "text-emerald-300" : "text-slate-300"}>{canalLabel(r.canal)}</span>
                    </button>
                  ) : (
                    <span className={ia ? "text-emerald-300" : "text-slate-300"}>{canalLabel(r.canal)}</span>
                  )}
                  <span className="text-slate-400">
                    {r.count}
                    {convMap[r.canal] && convMap[r.canal].leads > 0 ? (
                      <span className="text-emerald-400">
                        {" "}· {convMap[r.canal].leads} lead{convMap[r.canal].leads > 1 ? "s" : ""} · {convMap[r.canal].taxa.toFixed(0)}%
                      </span>
                    ) : null}
                  </span>
                </div>
                <div className="mt-1 h-1.5 rounded-full bg-white/5 overflow-hidden">
                  <div
                    className={`h-1.5 rounded-full ${ia ? "bg-emerald-500" : "bg-[#A81C1C]"}`}
                    style={{ width: `${Math.round(((r.count || 0) / max) * 100)}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}
      {onSelectCanal && sorted.length > 0 && (
        <p className="mt-3 text-xs text-slate-500">Clique em um canal para filtrar a jornada.</p>
      )}
    </div>
  );
}
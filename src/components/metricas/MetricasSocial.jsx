import { canalLabel, destinoLabel } from "@/lib/metricasPanel";
import { SOCIAL_CHANNELS, SOCIAL_DESTINOS } from "@/lib/metricasPanel";

function Row({ label, value }) {
  return (
    <div className="flex justify-between text-sm py-1.5 border-b border-white/5 last:border-0">
      <span className="text-slate-300">{label}</span>
      <span className="text-slate-400">{value}</span>
    </div>
  );
}

export default function MetricasSocial({ visitasPorCanal, cliquesPorDestino, appbarberPorCanal }) {
  const visitaCount = (c) => visitasPorCanal.find((r) => r.canal === c)?.count || 0;
  const clickCount = (d) => cliquesPorDestino.find((r) => r.destino === d)?.count || 0;
  const appBarberCount = (c) => appbarberPorCanal.find((r) => r.canal === c)?.count || 0;

  const totalVisitas = SOCIAL_CHANNELS.reduce((s, c) => s + visitaCount(c), 0);
  const totalClicks = SOCIAL_DESTINOS.reduce((s, d) => s + clickCount(d), 0);
  const totalAppBarber = SOCIAL_CHANNELS.reduce((s, c) => s + appBarberCount(c), 0);

  return (
    <div className="rounded-lg border border-white/10 bg-[#111113] p-4">
      <div className="flex items-center justify-between mb-3">
        <p className="text-sm font-semibold text-white">Redes Sociais</p>
        <span className="text-xs text-slate-500">Cliques na landing page · não inclui métricas nativas</span>
      </div>
      {totalVisitas === 0 && totalClicks === 0 && totalAppBarber === 0 ? (
        <p className="text-sm text-slate-500">Sem dados de redes sociais no período.</p>
      ) : (
        <div className="grid md:grid-cols-3 gap-4">
          <div>
            <p className="text-xs uppercase tracking-wide text-slate-500 mb-2">Visitas atribuídas</p>
            {SOCIAL_CHANNELS.map((c) => (
              <Row key={c} label={canalLabel(c)} value={visitaCount(c)} />
            ))}
          </div>
          <div>
            <p className="text-xs uppercase tracking-wide text-slate-500 mb-2">Cliques por destino</p>
            {SOCIAL_DESTINOS.map((d) => (
              <Row key={d} label={destinoLabel(d)} value={clickCount(d)} />
            ))}
          </div>
          <div>
            <p className="text-xs uppercase tracking-wide text-slate-500 mb-2">Cliques AppBarber por canal</p>
            {SOCIAL_CHANNELS.map((c) => (
              <Row key={c} label={canalLabel(c)} value={appBarberCount(c)} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
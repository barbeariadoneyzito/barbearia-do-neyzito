import { CANAL_OPTIONS, DEVICE_LABELS, ACAO_OPTIONS, DESTINO_OPTIONS } from "@/lib/metricasPanel";

const PRESETS = [
  ["hoje", "Hoje"],
  ["7d", "7 dias"],
  ["30d", "30 dias"],
  ["custom", "Personalizado"],
];

const selectCls =
  "rounded-md border border-white/10 bg-[#111113] px-2.5 py-2 text-sm text-white focus:border-[#A81C1C] outline-none";

export default function MetricasFilters({
  range,
  setRange,
  customFrom,
  setCustomFrom,
  customTo,
  setCustomTo,
  canal,
  setCanal,
  campaign,
  setCampaign,
  campaigns,
  device,
  setDevice,
  acao,
  setAcao,
  destino,
  setDestino,
}) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      {PRESETS.map(([v, l]) => (
        <button
          key={v}
          onClick={() => setRange(v)}
          className={
            range === v
              ? "px-3.5 py-2 rounded-md text-sm font-medium bg-[#A81C1C] text-white"
              : "px-3.5 py-2 rounded-md text-sm font-medium border border-white/10 text-slate-300 hover:text-white hover:border-white/30 transition-colors"
          }
        >
          {l}
        </button>
      ))}
      {range === "custom" && (
        <div className="flex items-center gap-2">
          <input
            type="date"
            value={customFrom}
            onChange={(e) => setCustomFrom(e.target.value)}
            className={selectCls}
            aria-label="Data inicial"
          />
          <span className="text-slate-500 text-sm">até</span>
          <input
            type="date"
            value={customTo}
            onChange={(e) => setCustomTo(e.target.value)}
            className={selectCls}
            aria-label="Data final"
          />
        </div>
      )}
      <select value={canal} onChange={(e) => setCanal(e.target.value)} className={selectCls} aria-label="Canal">
        {CANAL_OPTIONS.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      <select value={acao} onChange={(e) => setAcao(e.target.value)} className={selectCls} aria-label="Tipo de ação">
        <option value="">Todas as ações</option>
        {ACAO_OPTIONS.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      <select value={destino} onChange={(e) => setDestino(e.target.value)} className={selectCls} aria-label="Destino">
        <option value="">Todos os destinos</option>
        {DESTINO_OPTIONS.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      <select
        value={campaign}
        onChange={(e) => setCampaign(e.target.value)}
        className={selectCls}
        aria-label="Campanha"
      >
        <option value="">Todas as campanhas</option>
        {campaigns.map((c) => (
          <option key={c} value={c}>
            {c}
          </option>
        ))}
      </select>
      <select value={device} onChange={(e) => setDevice(e.target.value)} className={selectCls} aria-label="Dispositivo">
        <option value="">Todos os dispositivos</option>
        {Object.entries(DEVICE_LABELS).map(([v, l]) => (
          <option key={v} value={v}>
            {l}
          </option>
        ))}
      </select>
    </div>
  );
}
import { ArrowDown } from "lucide-react";

const pct = (a, b) => (b > 0 ? (a / b) * 100 : 0);
const fmt = (n) => (n || 0).toLocaleString("pt-BR");

// Funil de conversão: Visitas -> Cliques no AppBarber -> Leads capturados.
// Destaca os "cliques convertidos" (cliques no AppBarber que viraram lead).
export default function MetricasFunil({ funnel }) {
  const { visitas = 0, cliquesAppbarber = 0, leads = 0, cliquesConvertidos = 0 } = funnel || {};
  const stages = [
    { label: "Visitas", value: visitas, color: "bg-sky-500" },
    { label: "Cliques no AppBarber", value: cliquesAppbarber, color: "bg-[#A81C1C]" },
    { label: "Leads capturados", value: leads, color: "bg-emerald-500" },
  ];
  const max = Math.max(1, visitas);

  return (
    <div className="rounded-lg border border-white/10 bg-[#111113] p-4">
      <div className="flex items-center justify-between mb-3">
        <p className="text-sm font-semibold text-white">Funil de conversão</p>
        <span className="text-xs text-emerald-400">Convertidos: {fmt(cliquesConvertidos)}</span>
      </div>
      <div className="space-y-2.5">
        {stages.map((s, i) => {
          const width = pct(s.value, max);
          const prev = i > 0 ? stages[i - 1].value : 0;
          const rate = i > 0 && prev > 0 ? pct(s.value, prev) : null;
          return (
            <div key={s.label}>
              {rate !== null && (
                <div className="flex items-center gap-1 text-[11px] text-slate-500 mb-1">
                  <ArrowDown className="h-3 w-3" /> {rate.toFixed(1)}% do estágio anterior
                </div>
              )}
              <div className="flex items-center justify-between text-sm mb-1">
                <span className="text-slate-300">{s.label}</span>
                <span className="text-white font-medium">{fmt(s.value)}</span>
              </div>
              <div className="h-2.5 rounded-full bg-white/5 overflow-hidden">
                <div className={`h-2.5 rounded-full ${s.color}`} style={{ width: `${Math.max(width, 2)}%` }} />
              </div>
            </div>
          );
        })}
      </div>
      <p className="mt-3 text-xs text-slate-500 leading-relaxed">
        <strong className="text-emerald-400">Convertidos</strong> = cliques no AppBarber que viraram lead (o visitante
        confirmou o agendamento e deixou os dados). A taxa entre estágios mostra onde o funil perde mais visitantes.
      </p>
    </div>
  );
}
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

// Análise drill-down das visitas: abre ao clicar no KPI "Visitas".
// Mostra o funil de conversão (visitas → cliques no AppBarber → leads),
// o desfecho de cada visitante (só visitou, engajou no chat, foi agendar,
// fechou agendamento) e a explicação objetiva de cada número.
export default function MetricasVisitasDrilldown({ open, onClose, visitas, sessoes, journey, funnel }) {
  const totalSessions = journey?.length || 0;
  const soVisita = journey?.filter((r) => r.resultado === "Só visita").length || 0;
  const chat =
    journey?.filter((r) => r.resultado?.startsWith("Abriu") || r.resultado?.startsWith("Conversou")).length || 0;
  const appbarber = journey?.filter((r) => r.resultado === "Agendamento (AppBarber)").length || 0;
  const leads = funnel?.cliquesConvertidos || 0;
  const cliquesAppbarber = funnel?.cliquesAppbarber || 0;

  const pct = (n) => (totalSessions ? Math.round((n / totalSessions) * 100) : 0);

  const outcomes = [
    { label: "Só visitou a página", count: soVisita, bar: "bg-slate-500", text: "text-slate-300" },
    { label: "Engajou no chat", count: chat, bar: "bg-sky-500", text: "text-sky-300" },
    { label: "Foi para o agendamento (AppBarber)", count: appbarber, bar: "bg-[#E05252]", text: "text-[#E05252]" },
    { label: "Fechou o agendamento (virou lead)", count: leads, bar: "bg-emerald-500", text: "text-emerald-300" },
  ];
  const maxO = Math.max(...outcomes.map((o) => o.count), 1);

  const funnelSteps = [
    { label: "Visitas", value: visitas || 0 },
    { label: "Cliques no AppBarber", value: cliquesAppbarber },
    { label: "Leads convertidos", value: leads },
  ];
  const maxF = Math.max(...funnelSteps.map((s) => s.value), 1);

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="bg-[#111113] border-white/10 text-white max-w-2xl max-h-[88vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Análise das visitas</DialogTitle>
        </DialogHeader>
        <p className="text-xs text-slate-400 -mt-2">
          O que significam as <strong className="text-white">{visitas}</strong> visitas e{" "}
          <strong className="text-white">{sessoes}</strong> visitantes únicos no período selecionado.
        </p>

        {/* Funil de conversão */}
        <section className="space-y-2">
          <p className="text-sm font-semibold text-white">Funil de conversão</p>
          {funnelSteps.map((s, i) => {
            const prev = i === 0 ? s.value : funnelSteps[i - 1].value;
            const rate = prev > 0 ? Math.round((s.value / prev) * 100) : 0;
            return (
              <div key={s.label}>
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="text-slate-300">{s.label}</span>
                  <span className="text-white font-semibold">
                    {s.value}
                    {i > 0 && prev > 0 ? <span className="text-slate-500 font-normal"> · {rate}%</span> : null}
                  </span>
                </div>
                <div className="h-7 rounded-md bg-white/5 overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-[#7a1414] to-[#A81C1C] rounded-md transition-all"
                    style={{ width: `${(s.value / maxF) * 100}%` }}
                  />
                </div>
              </div>
            );
          })}
          <p className="text-xs text-slate-500">
            Taxa visita → agendamento:{" "}
            <strong className="text-slate-300">{visitas ? Math.round((cliquesAppbarber / visitas) * 100) : 0}%</strong> ·
            Taxa visita → lead:{" "}
            <strong className="text-slate-300">{visitas ? Math.round((leads / visitas) * 100) : 0}%</strong>
          </p>
        </section>

        {/* Desfecho por visitante */}
        <section className="space-y-2">
          <p className="text-sm font-semibold text-white">O que cada visitante fez</p>
          <p className="text-xs text-slate-500 -mt-1">
            Por visitante único (sessão) — {totalSessions} visitantes.
          </p>
          <div className="space-y-2.5">
            {outcomes.map((o) => (
              <div key={o.label}>
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className={o.text}>{o.label}</span>
                  <span className="text-slate-300">
                    {o.count} <span className="text-slate-500">({pct(o.count)}%)</span>
                  </span>
                </div>
                <div className="h-5 rounded bg-white/5 overflow-hidden">
                  <div
                    className={`h-full ${o.bar} rounded transition-all`}
                    style={{ width: `${(o.count / maxO) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Explicação objetiva */}
        <section className="rounded-lg border border-white/10 bg-[#0E0E10] p-3 text-xs text-slate-400 space-y-1.5">
          <p>
            <strong className="text-slate-300">Só visitou:</strong> chegou à página e não clicou em nada nem abriu o
            chat.
          </p>
          <p>
            <strong className="text-slate-300">Foi para o agendamento:</strong> clicou no AppBarber — indica intenção,
            mas <strong className="text-slate-300">não</strong> é agendamento confirmado.
          </p>
          <p>
            <strong className="text-slate-300">Fechou o agendamento:</strong> clicou no AppBarber e deixou os dados,
            virando lead registrado no painel de Leads.
          </p>
          <p className="text-slate-500 pt-1">
            Veja o caminho completo de cada visitante na seção “Jornada dos visitantes” logo abaixo no painel.
          </p>
        </section>
      </DialogContent>
    </Dialog>
  );
}
export default function MetricasKPIs({ visitas, sessoes, cliquesAppbarber, cliquesWhatsapp, leadsCount, cliquesConvertidos, onFilter, onDrilldownVisitas }) {
  const cards = [
    { label: "Visitas", value: visitas, color: "text-white", drilldown: true },
    { label: "Visitantes (sessões)", value: sessoes, color: "text-sky-300", filter: null },
    { label: "Cliques AppBarber", value: cliquesAppbarber, color: "text-[#E05252]", filter: { acao: "clique", destino: "appbarber" } },
    { label: "Cliques WhatsApp", value: cliquesWhatsapp, color: "text-green-300", filter: { acao: "clique", destino: "whatsapp" } },
    { label: "Leads registrados", value: leadsCount, color: "text-amber-300", filter: null },
    { label: "Cliques convertidos", value: cliquesConvertidos, color: "text-emerald-300", filter: null },
  ];
  return (
    <>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {cards.map((c) => {
          const interactive = (c.filter || c.drilldown) && (c.value || 0) > 0;
          return (
            <button
              key={c.label}
              type="button"
              onClick={interactive ? () => (c.drilldown ? onDrilldownVisitas?.() : onFilter?.(c.filter)) : undefined}
              disabled={!interactive}
              className={`text-left rounded-lg border border-white/10 bg-[#111113] p-4 transition-colors ${
                interactive ? "hover:border-[#A81C1C]/60 hover:bg-white/[0.03] cursor-pointer" : "cursor-default"
              }`}
            >
              <p className="text-[11px] uppercase tracking-wide text-slate-500">{c.label}</p>
              <p className={`mt-1 font-heading text-2xl ${c.color}`}>{c.value}</p>
            </button>
          );
        })}
      </div>
      <p className="mt-2.5 text-xs text-slate-500 leading-relaxed">
        <strong className="text-slate-400">Visitantes (sessões)</strong> = visitantes únicos anônimos (cada visitante recebe um
        identificador de sessão no navegador; não é dado pessoal). <strong className="text-slate-400">Cliques no AppBarber</strong>{" "}
        indicam apenas que o visitante foi encaminhado ao agendamento — <strong className="text-slate-400">não</strong> é
        agendamento confirmado. <strong className="text-slate-400">Cliques convertidos</strong> = cliques no AppBarber que
        viraram lead (o visitante confirmou o agendamento e deixou os dados). Taxa de conversão = cliques no AppBarber ÷ visitas.
        Clique em <strong className="text-slate-400">Visitas</strong> para abrir a análise de conversão (o que cada
        visita significou). Clique em <strong className="text-slate-400">Cliques AppBarber</strong> ou{" "}
        <strong className="text-slate-400">WhatsApp</strong> para ver os registros na jornada.
      </p>
    </>
  );
}
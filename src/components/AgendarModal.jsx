import { useEffect, useState, useSyncExternalStore } from "react";
import { Calendar, Loader2, X } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { SITE } from "@/lib/siteConfig";
import {
  fecharAgendarModal,
  getAgendarSnapshot,
  subscribeAgendar,
} from "@/lib/agendar";
import { getCampaignContext, origemFromContext, trackCta } from "@/lib/analytics";
import { spDateKey } from "@/lib/timezone";

const inputCls =
  "w-full rounded-lg border border-white/10 bg-[#0A0A0B] px-3.5 py-3 text-base text-white placeholder:text-slate-500 focus:border-[#A81C1C] focus:outline-none";
const labelCls = "text-[11px] font-medium text-slate-400";
const brl = (v) => (Number(v) || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

export default function AgendarModal() {
  const snap = useSyncExternalStore(subscribeAgendar, getAgendarSnapshot);
  const [servicos, setServicos] = useState([]);
  const [barbeiros, setBarbeiros] = useState([]);
  const [form, setForm] = useState({ nome: "", whatsapp: "", email: "", servico: "", barbeiro: "" });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!snap.open) return;
    setError("");
    Promise.all([
      base44.entities.Servicos.filter({ ativo: true }, { sort: "nome", limit: 100 }).catch(() => ({ items: [] })),
      base44.entities.Barbeiros.filter({ ativo: true }, { sort: "nome", limit: 100 }).catch(() => ({ items: [] })),
    ]).then(([s, b]) => {
      setServicos(s.items || []);
      setBarbeiros(b.items || []);
    });
  }, [snap.open]);

  if (!snap.open) return null;

  const preco = servicos.find((s) => s.nome === form.servico)?.preco;
  const valid = form.nome.trim() && form.whatsapp.trim() && form.servico && form.barbeiro;

  const submit = async (e) => {
    e.preventDefault();
    if (!valid) {
      setError("Preencha nome, telefone, serviço e barbeiro para continuar.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      const ctx = getCampaignContext();
      await base44.entities.Leads.create({
        nome: form.nome.trim(),
        whatsapp: form.whatsapp.trim(),
        email: form.email.trim() || null,
        servico_interesse: form.servico,
        barbeiro_preferido: form.barbeiro,
        preco_servico: preco ?? null,
        status: "agendou",
        situacao_atendimento: "pendente",
        origem: origemFromContext(ctx),
        canal: "Landing page — agendar agora",
        campanha: ctx.utm_campaign || null,
        utm_source: ctx.utm_source || null,
        utm_medium: ctx.utm_medium || null,
        utm_campaign: ctx.utm_campaign || null,
        pagina_entrada: ctx.pagina_entrada || null,
        primeiro_contato: spDateKey(new Date()),
        sessao_id: ctx.sessao_id || null,
      });
      window.open(SITE.appBarberUrl, "_blank", "noopener,noreferrer");
      fecharAgendarModal();
      setForm({ nome: "", whatsapp: "", email: "", servico: "", barbeiro: "" });
    } catch (err) {
      setError("Não foi possível salvar seus dados. Tente novamente ou vá direto ao agendamento.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
      onClick={fecharAgendarModal}
    >
      <div
        className="w-full max-w-md rounded-2xl border border-white/10 bg-[#111113] shadow-2xl shadow-black/60"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/10">
          <div className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-[#E05252]" />
            <h2 className="font-heading text-xl tracking-wide text-white">AGENDAR ATENDIMENTO</h2>
          </div>
          <button onClick={fecharAgendarModal} aria-label="Fechar" className="text-slate-400 hover:text-white">
            <X className="h-5 w-5" />
          </button>
        </div>
        <form onSubmit={submit} className="px-5 py-5 space-y-3.5">
          <p className="text-xs text-slate-400 -mt-1">
            Preencha seus dados para registrar o agendamento. Depois você escolhe o horário no AppBarber.
          </p>
          <div>
            <label className={labelCls}>Nome *</label>
            <input
              value={form.nome}
              onChange={(e) => setForm({ ...form, nome: e.target.value })}
              className={inputCls}
              placeholder="Seu nome"
            />
          </div>
          <div>
            <label className={labelCls}>Telefone / WhatsApp *</label>
            <input
              value={form.whatsapp}
              onChange={(e) => setForm({ ...form, whatsapp: e.target.value })}
              className={inputCls}
              placeholder="(11) 99999-9999"
              inputMode="tel"
            />
          </div>
          <div>
            <label className={labelCls}>E-mail (opcional)</label>
            <input
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className={inputCls}
              placeholder="voce@email.com"
            />
          </div>
          <div>
            <label className={labelCls}>Serviço *</label>
            <select
              value={form.servico}
              onChange={(e) => setForm({ ...form, servico: e.target.value })}
              className={inputCls}
            >
              <option value="">Selecione…</option>
              {servicos.map((s) => (
                <option key={s.id} value={s.nome}>
                  {s.nome}
                  {s.preco ? ` — ${brl(s.preco)}` : ""}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelCls}>Barbeiro *</label>
            <select
              value={form.barbeiro}
              onChange={(e) => setForm({ ...form, barbeiro: e.target.value })}
              className={inputCls}
            >
              <option value="">Selecione…</option>
              {barbeiros.map((b) => (
                <option key={b.id} value={b.nome}>
                  {b.nome}
                </option>
              ))}
            </select>
          </div>
          {error && <p className="text-xs text-red-300">{error}</p>}
          <button
            type="submit"
            disabled={saving}
            className="w-full inline-flex items-center justify-center gap-2 bg-[#A81C1C] hover:bg-[#C22424] text-white font-bold tracking-wide py-3.5 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? <Loader2 className="h-5 w-5 animate-spin" /> : <Calendar className="h-5 w-5" />}
            {saving ? "SALVANDO…" : "CONFIRMAR E IR PARA O APPBARBER"}
          </button>
          <a
            href={SITE.appBarberUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => {
              trackCta("appbarber", "modal-skip");
              fecharAgendarModal();
            }}
            className="block text-center text-xs text-slate-400 hover:text-white underline underline-offset-2"
          >
            Prefiro ir direto ao agendamento
          </a>
        </form>
      </div>
    </div>
  );
}
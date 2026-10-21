import { useState } from "react";
import {
  STATUS_OPTIONS,
  ORIGEM_OPTIONS,
  origemBadge,
  origemLabel,
  normalizeOrigem,
  SITUACAO_OPTIONS,
  PREFERENCIA_CONTATO_OPTIONS,
  formatSpDate,
  whatsappLink,
  formatBRL,
} from "@/lib/leadsPanel";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Ban, Check, ExternalLink, Pencil, RefreshCw, Route, X } from "lucide-react";
import LeadJornadaDialog from "@/components/admin/LeadJornadaDialog";

const inputCls =
  "w-full rounded-lg border border-white/10 bg-[#0A0A0B] px-3 py-2 text-sm text-white focus:border-[#A81C1C] focus:outline-none";
const selectCls = inputCls;
const labelCls = "text-[11px] font-medium text-slate-400";

function Field({ label, children }) {
  return (
    <div className="space-y-1">
      <label className={labelCls}>{label}</label>
      {children}
    </div>
  );
}

const EMPTY_DRAFT = {
  email: "",
  origem: "Não identificado",
  canal: "",
  campanha: "",
  primeiro_contato: "",
  ultimo_interacao: "",
  ultimo_atendimento: "",
  data_agendamento: "",
  situacao_atendimento: "",
  id_externo: "",
  responsavel_atendimento: "",
  consentimento_marketing: false,
  consentimento_data: "",
  consentimento_origem: "",
  consentimento_finalidade: "",
  preferencia_contato: "",
  descadastrado: false,
  utm_source: "",
  utm_medium: "",
  utm_campaign: "",
  pagina_entrada: "",
  observacoes: "",
};

function toDay(v) {
  return v ? String(v).slice(0, 10) : "";
}

export default function LeadsTable({ leads, onStatusChange, onSituacaoChange, onEditLead, onMarkViewed, onTipoChange }) {
  const [editing, setEditing] = useState(null);
  const [draft, setDraft] = useState(EMPTY_DRAFT);
  const [jornadaLead, setJornadaLead] = useState(null);

  const openEdit = (lead) => {
    setEditing(lead);
    setDraft({
      ...EMPTY_DRAFT,
      email: lead.email || "",
      origem: normalizeOrigem(lead.origem),
      canal: lead.canal || "",
      campanha: lead.campanha || "",
      primeiro_contato: toDay(lead.primeiro_contato),
      ultimo_interacao: toDay(lead.ultimo_interacao),
      ultimo_atendimento: toDay(lead.ultimo_atendimento),
      data_agendamento: toDay(lead.data_agendamento),
      situacao_atendimento: lead.situacao_atendimento || "",
      id_externo: lead.id_externo || "",
      responsavel_atendimento: lead.responsavel_atendimento || "",
      consentimento_marketing: !!lead.consentimento_marketing,
      consentimento_data: toDay(lead.consentimento_data),
      consentimento_origem: lead.consentimento_origem || "",
      consentimento_finalidade: lead.consentimento_finalidade || "",
      preferencia_contato: lead.preferencia_contato || "",
      descadastrado: !!lead.descadastrado,
      utm_source: lead.utm_source || "",
      utm_medium: lead.utm_medium || "",
      utm_campaign: lead.utm_campaign || "",
      pagina_entrada: lead.pagina_entrada || "",
      observacoes: lead.observacoes || "",
    });
  };

  const set = (k, v) => setDraft((prev) => ({ ...prev, [k]: v }));

  const save = () => {
    onEditLead(editing.id, {
      email: draft.email || null,
      origem: draft.origem,
      canal: draft.canal || null,
      campanha: draft.campanha || null,
      primeiro_contato: draft.primeiro_contato || null,
      ultimo_interacao: draft.ultimo_interacao || null,
      ultimo_atendimento: draft.ultimo_atendimento || null,
      data_agendamento: draft.data_agendamento || null,
      situacao_atendimento: draft.situacao_atendimento || null,
      id_externo: draft.id_externo || null,
      responsavel_atendimento: draft.responsavel_atendimento || null,
      consentimento_marketing: draft.consentimento_marketing,
      consentimento_data: draft.consentimento_data || null,
      consentimento_origem: draft.consentimento_origem || null,
      consentimento_finalidade: draft.consentimento_finalidade || null,
      preferencia_contato: draft.preferencia_contato || null,
      descadastrado: draft.descadastrado,
      utm_source: draft.utm_source || null,
      utm_medium: draft.utm_medium || null,
      utm_campaign: draft.utm_campaign || null,
      pagina_entrada: draft.pagina_entrada || null,
      observacoes: draft.observacoes || null,
    });
    setEditing(null);
  };

  if (!leads.length) {
    return (
      <div className="text-center py-12 text-slate-500 text-sm border border-white/10 rounded-lg">
        Nenhum lead encontrado para os filtros selecionados.
      </div>
    );
  }

  return (
    <>
      <div className="overflow-x-auto rounded-lg border border-white/10">
        <table className="w-full min-w-[1320px] text-sm">
          <thead className="bg-[#111113] text-slate-400">
            <tr className="text-left">
              <th className="px-3 py-3 font-medium">ID Registro</th>
              <th className="px-3 py-3 font-medium">Data/Hora Contato</th>
              <th className="px-3 py-3 font-medium">Nome Cliente</th>
              <th className="px-3 py-3 font-medium">Telefone</th>
              <th className="px-3 py-3 font-medium">Email</th>
              <th className="px-3 py-3 font-medium">Serviço</th>
              <th className="px-3 py-3 font-medium">Barbeiro</th>
              <th className="px-3 py-3 font-medium">Canal Origem</th>
              <th className="px-3 py-3 font-medium">Meio Acesso</th>
              <th className="px-3 py-3 font-medium">Status Agendamento</th>
              <th className="px-3 py-3 font-medium">Valor Serviço</th>
              <th className="px-3 py-3 font-medium">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {leads.map((l) => {
              const wa = whatsappLink(l.whatsapp);
              const idShort = l.id ? String(l.id).slice(0, 8) : "—";
              return (
                <tr
                  key={l.id}
                  onClick={() => !l.visualizado && onMarkViewed?.(l.id)}
                  className={!l.visualizado ? "bg-[#E05252]/[0.04] hover:bg-[#E05252]/[0.07] cursor-pointer" : "hover:bg-white/[0.02]"}
                >
                  <td className="px-3 py-3 font-mono text-xs text-slate-400" title={l.id}>{idShort}</td>
                  <td className="px-3 py-3 text-slate-400 whitespace-nowrap">{formatSpDate(l.created_date)}</td>
                  <td className="px-3 py-3 text-white font-medium">
                    <span className="inline-flex items-center gap-2">
                      {!l.visualizado && <span className="h-2 w-2 rounded-full bg-[#E05252] shrink-0" title="Novo lead não visualizado" />}
                      {l.nome || "—"}
                    </span>
                  </td>
                  <td className="px-3 py-3">
                    {wa ? (
                      <a
                        href={wa}
                        target="_blank"
                        rel="noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="inline-flex items-center gap-1 text-[#E05252] hover:underline"
                      >
                        {l.whatsapp}
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    ) : (
                      l.whatsapp || "—"
                    )}
                  </td>
                  <td className="px-3 py-3 text-slate-300 max-w-[180px] truncate" title={l.email || ""}>{l.email || "—"}</td>
                  <td className="px-3 py-3 text-slate-300">{l.servico_interesse || "—"}</td>
                  <td className="px-3 py-3 text-slate-300">{l.barbeiro_preferido || "—"}</td>
                  <td className="px-3 py-3">
                    <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${origemBadge(normalizeOrigem(l.origem))}`}>
                      {origemLabel(normalizeOrigem(l.origem))}
                    </span>
                  </td>
                  <td className="px-3 py-3 text-slate-300">{l.canal || "—"}</td>
                  <td className="px-3 py-3">
                    <select
                      value={l.status || ""}
                      onChange={(e) => onStatusChange(l.id, e.target.value)}
                      onClick={(e) => e.stopPropagation()}
                      className="rounded border border-white/10 bg-[#0A0A0B] px-2 py-1 text-xs text-white focus:border-[#A81C1C] focus:outline-none"
                    >
                      {STATUS_OPTIONS.map((s) => (
                        <option key={s.value} value={s.value}>{s.label}</option>
                      ))}
                    </select>
                  </td>
                  <td className="px-3 py-3 text-slate-200 whitespace-nowrap">{formatBRL(l.preco_servico)}</td>
                  <td className="px-3 py-3">
                    <div className="flex items-center gap-1.5">
                      <select
                        value={l.tipo_cliente || "Não identificado"}
                        onChange={(e) => onTipoChange(l.id, e.target.value)}
                        onClick={(e) => e.stopPropagation()}
                        className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium focus:outline-none cursor-pointer bg-slate-500/15 text-slate-300 border-slate-500/30"
                      >
                        <option value="Não identificado">Não identificado</option>
                        <option value="Cliente novo">Cliente novo</option>
                        <option value="Já é cliente">Já é cliente</option>
                      </select>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={(e) => { e.stopPropagation(); onSituacaoChange?.(l.id, "compareceu"); }}
                          title="Compareceu"
                          className={`h-6 w-6 inline-flex items-center justify-center rounded border ${l.situacao_atendimento === "compareceu" ? "border-emerald-500/50 bg-emerald-500/20 text-emerald-300" : "border-white/10 text-slate-400 hover:border-emerald-500/50 hover:text-emerald-300"}`}
                        >
                          <Check className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); onSituacaoChange?.(l.id, "faltou"); }}
                          title="Faltou (abandono)"
                          className={`h-6 w-6 inline-flex items-center justify-center rounded border ${l.situacao_atendimento === "faltou" ? "border-red-500/50 bg-red-500/20 text-red-300" : "border-white/10 text-slate-400 hover:border-red-500/50 hover:text-red-300"}`}
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); onSituacaoChange?.(l.id, "cancelado"); }}
                          title="Cancelado"
                          className={`h-6 w-6 inline-flex items-center justify-center rounded border ${l.situacao_atendimento === "cancelado" ? "border-red-500/50 bg-red-500/20 text-red-300" : "border-white/10 text-slate-400 hover:border-red-500/50 hover:text-red-300"}`}
                        >
                          <Ban className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); onSituacaoChange?.(l.id, "reagendado"); }}
                          title="Reagendado"
                          className={`h-6 w-6 inline-flex items-center justify-center rounded border ${l.situacao_atendimento === "reagendado" ? "border-amber-500/50 bg-amber-500/20 text-amber-300" : "border-white/10 text-slate-400 hover:border-amber-500/50 hover:text-amber-300"}`}
                        >
                          <RefreshCw className="h-3 w-3" />
                        </button>
                      </div>
                      <button
                        onClick={(e) => { e.stopPropagation(); setJornadaLead(l); }}
                        disabled={!l.sessao_id}
                        className="inline-flex h-7 w-7 items-center justify-center rounded border border-white/10 text-slate-300 hover:border-[#A81C1C] hover:text-white disabled:opacity-30 disabled:cursor-not-allowed"
                        title={l.sessao_id ? "Ver caminho do lead" : "Sem sessão vinculada"}
                      >
                        <Route className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); openEdit(l); }}
                        className="inline-flex h-7 w-7 items-center justify-center rounded border border-white/10 text-slate-300 hover:border-[#A81C1C] hover:text-white"
                        title="Editar lead"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent className="bg-[#111113] border-white/10 text-white max-w-2xl max-h-[88vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Editar lead — {editing?.nome}</DialogTitle>
          </DialogHeader>

          <div className="space-y-5">
            {/* Contato */}
            <section className="space-y-3">
              <p className="font-mono text-[10px] tracking-[0.2em] text-[#E05252] uppercase">Contato</p>
              <div className="grid grid-cols-2 gap-3">
                <Field label="E-mail">
                  <input type="email" value={draft.email} onChange={(e) => set("email", e.target.value)} className={inputCls} placeholder="cliente@email.com" />
                </Field>
                <Field label="Preferência de contato">
                  <select value={draft.preferencia_contato} onChange={(e) => set("preferencia_contato", e.target.value)} className={selectCls}>
                    <option value="">Não definida</option>
                    {PREFERENCIA_CONTATO_OPTIONS.map((p) => (
                      <option key={p.value} value={p.value}>{p.label}</option>
                    ))}
                  </select>
                </Field>
              </div>
              <label className="flex items-center gap-2 text-sm text-slate-300">
                <input type="checkbox" checked={draft.descadastrado} onChange={(e) => set("descadastrado", e.target.checked)} className="accent-[#A81C1C]" />
                Descadastrado (não deseja receber comunicações de marketing)
              </label>
            </section>

            {/* Aquisição */}
            <section className="space-y-3">
              <p className="font-mono text-[10px] tracking-[0.2em] text-[#E05252] uppercase">Aquisição</p>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Origem">
                  <select value={draft.origem} onChange={(e) => set("origem", e.target.value)} className={selectCls}>
                    {ORIGEM_OPTIONS.map((o) => (
                      <option key={o.value} value={o.value}>{o.label}</option>
                    ))}
                  </select>
                </Field>
                <Field label="Canal">
                  <input value={draft.canal} onChange={(e) => set("canal", e.target.value)} className={inputCls} placeholder="Ex.: Chat landing page" />
                </Field>
                <Field label="Campanha">
                  <input value={draft.campanha} onChange={(e) => set("campanha", e.target.value)} className={inputCls} placeholder="Ex.: promocao-outubro" />
                </Field>
                <Field label="ID externo (cliente/agendamento)">
                  <input value={draft.id_externo} onChange={(e) => set("id_externo", e.target.value)} className={inputCls} placeholder="Identificador da integração" />
                </Field>
                <Field label="UTM source">
                  <input value={draft.utm_source} onChange={(e) => set("utm_source", e.target.value)} className={inputCls} />
                </Field>
                <Field label="UTM medium">
                  <input value={draft.utm_medium} onChange={(e) => set("utm_medium", e.target.value)} className={inputCls} />
                </Field>
                <Field label="UTM campaign">
                  <input value={draft.utm_campaign} onChange={(e) => set("utm_campaign", e.target.value)} className={inputCls} />
                </Field>
                <Field label="Página de entrada">
                  <input value={draft.pagina_entrada} onChange={(e) => set("pagina_entrada", e.target.value)} className={inputCls} placeholder="URL de origem" />
                </Field>
              </div>
            </section>

            {/* Acompanhamento */}
            <section className="space-y-3">
              <p className="font-mono text-[10px] tracking-[0.2em] text-[#E05252] uppercase">Acompanhamento</p>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Data do agendamento">
                  <input type="date" value={draft.data_agendamento} onChange={(e) => set("data_agendamento", e.target.value)} className={inputCls} />
                </Field>
                <Field label="Situação do atendimento">
                  <select value={draft.situacao_atendimento} onChange={(e) => set("situacao_atendimento", e.target.value)} className={selectCls}>
                    <option value="">Não definida</option>
                    {SITUACAO_OPTIONS.map((s) => (
                      <option key={s.value} value={s.value}>{s.label}</option>
                    ))}
                  </select>
                </Field>
                <Field label="Responsável pelo atendimento">
                  <input value={draft.responsavel_atendimento} onChange={(e) => set("responsavel_atendimento", e.target.value)} className={inputCls} placeholder="Barbeiro / responsável" />
                </Field>
                <Field label="Primeiro contato">
                  <input type="date" value={draft.primeiro_contato} onChange={(e) => set("primeiro_contato", e.target.value)} className={inputCls} />
                </Field>
                <Field label="Última interação">
                  <input type="date" value={draft.ultimo_interacao} onChange={(e) => set("ultimo_interacao", e.target.value)} className={inputCls} />
                </Field>
                <Field label="Último atendimento">
                  <input type="date" value={draft.ultimo_atendimento} onChange={(e) => set("ultimo_atendimento", e.target.value)} className={inputCls} />
                </Field>
              </div>
            </section>

            {/* Consentimento */}
            <section className="space-y-3">
              <p className="font-mono text-[10px] tracking-[0.2em] text-[#E05252] uppercase">Consentimento de marketing</p>
              <label className="flex items-center gap-2 text-sm text-slate-300">
                <input type="checkbox" checked={draft.consentimento_marketing} onChange={(e) => set("consentimento_marketing", e.target.checked)} className="accent-[#A81C1C]" />
                Consentiu receber comunicações de marketing
              </label>
              <div className="grid grid-cols-3 gap-3">
                <Field label="Data do consentimento">
                  <input type="date" value={draft.consentimento_data} onChange={(e) => set("consentimento_data", e.target.value)} className={inputCls} />
                </Field>
                <Field label="Origem do consentimento">
                  <input value={draft.consentimento_origem} onChange={(e) => set("consentimento_origem", e.target.value)} className={inputCls} placeholder="Ex.: chat landing page" />
                </Field>
                <Field label="Finalidade">
                  <input value={draft.consentimento_finalidade} onChange={(e) => set("consentimento_finalidade", e.target.value)} className={inputCls} placeholder="Ex.: promoções" />
                </Field>
              </div>
            </section>

            {/* Observações */}
            <section className="space-y-1.5">
              <label className={labelCls}>Observações comerciais</label>
              <Textarea
                value={draft.observacoes}
                onChange={(e) => set("observacoes", e.target.value)}
                rows={4}
                className="bg-[#0A0A0B] border-white/10 text-white"
                placeholder="Adicione observações sobre este lead..."
              />
            </section>
          </div>

          <DialogFooter>
            <Button variant="ghost" onClick={() => setEditing(null)} className="text-slate-300">
              Cancelar
            </Button>
            <Button onClick={save} className="bg-[#A81C1C] hover:bg-[#A81C1C]/90 text-white">
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <LeadJornadaDialog lead={jornadaLead} open={!!jornadaLead} onClose={() => setJornadaLead(null)} />
    </>
  );
}
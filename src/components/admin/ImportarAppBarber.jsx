import { useRef, useState } from "react";
import { base44 } from "@/api/base44Client";
import { analisarCSV } from "@/lib/importAppBarber";
import { formatBRL } from "@/lib/leadsPanel";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { CheckCircle2, ClipboardPaste, FileUp, Loader2, Upload, XCircle } from "lucide-react";

const KPI = ({ label, value, accent }) => (
  <div className="rounded-lg border border-white/10 bg-[#0E0E10] px-3 py-2">
    <p className="text-[10px] uppercase tracking-wide text-slate-500">{label}</p>
    <p className={`mt-0.5 text-lg font-heading tracking-wide ${accent || "text-white"}`}>{value}</p>
  </div>
);

// Importação do CSV de agendamentos exportado do AppBarber.
// Fluxo: escolher o arquivo -> conferir a prévia (o que entra, o que é
// ignorado, o que é duplicado) -> confirmar -> gravar direto na entidade.
//
// O botão que abre o diálogo é configurável (`rotulo`, `icone`, `variante`)
// para que o Relatório e os painéis possam destacar a funcionalidade sem
// duplicar o diálogo.
export default function ImportarAppBarber({
  onImportado,
  rotulo = "Importar AppBarber",
  Icone = FileUp,
  variante = "discreto",
  compacto = false,
}) {
  const [open, setOpen] = useState(false);
  const [analise, setAnalise] = useState(null);
  const [nomeArquivo, setNomeArquivo] = useState("");
  const [erro, setErro] = useState(null);
  const [gravando, setGravando] = useState(false);
  const [progresso, setProgresso] = useState({ feito: 0, total: 0 });
  const [resultado, setResultado] = useState(null);
  const [modo, setModo] = useState("arquivo");
  const [textoColado, setTextoColado] = useState("");
  const inputRef = useRef(null);

  const abrirSeletor = () => {
    setErro(null);
    setAnalise(null);
    setResultado(null);
    inputRef.current?.click();
  };

  // Analisa tanto o arquivo escolhido quanto o texto colado, reaproveitando a
  // mesma validação e o mesmo tratamento de duplicados.
  const analisarTexto = async (texto) => {
    setErro(null);
    setResultado(null);
    if (!String(texto || "").trim()) {
      setErro("O conteúdo está vazio.");
      setAnalise(null);
      return;
    }
    try {
      // Ids já importados antes, para não duplicar em reimportações.
      const existentes = await base44.entities.Leads
        .list("-created_date", 1000)
        .catch(() => []);
      const ids = new Set((existentes || []).map((l) => l.id_externo).filter(Boolean));
      const a = analisarCSV(texto, ids);
      if (a.colunas.length === 0) {
        setErro("Não foi possível ler o cabeçalho. Confira se colou a tabela com os títulos das colunas.");
        setAnalise(null);
        return;
      }
      if (a.validos.length === 0) {
        setErro("Nenhuma linha válida foi reconhecida. Confira se há nome e telefone nas linhas.");
        setAnalise(a);
        return;
      }
      setAnalise(a);
    } catch (err) {
      setErro(err?.message || "Falha ao analisar o conteúdo.");
      setAnalise(null);
    }
  };

  const aoEscolherArquivo = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setNomeArquivo(file.name);
    try {
      const texto = await file.text();
      await analisarTexto(texto);
    } catch (err) {
      setErro(err?.message || "Falha ao ler o arquivo.");
      setAnalise(null);
    } finally {
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  const importar = async () => {
    if (!analise?.validos?.length) return;
    setGravando(true);
    setErro(null);
    const total = analise.validos.length;
    setProgresso({ feito: 0, total });
    let ok = 0;
    const falhas = [];
    for (let i = 0; i < analise.validos.length; i++) {
      try {
        // Importação administrativa: grava direto na entidade (o admin logado
        // tem permissão de create). Não passa pelo criarLead, que é a função
        // pública do chat e, por segurança, ignora campos de controle como
        // situacao_atendimento, id_externo e preco_servico.
        const criado = await base44.entities.Leads.create(analise.validos[i]);
        if (criado?.id) ok++;
        else falhas.push({ lead: analise.validos[i], erro: "não retornou id" });
      } catch (e) {
        falhas.push({ lead: analise.validos[i], erro: e?.message || "falha ao gravar" });
      }
      setProgresso({ feito: i + 1, total });
    }
    setGravando(false);
    setResultado({ ok, falhas });
    if (onImportado) onImportado();
  };

  const fechar = () => {
    if (gravando) return;
    setOpen(false);
    setAnalise(null);
    setResultado(null);
    setErro(null);
    setNomeArquivo("");
    setTextoColado("");
  };

  const r = analise?.resumo;

  // Três pesos visuais: `discreto` (cabeçalho dos painéis), `destaque` (botão
  // grande e verde do relatório) e `claro` (faixa de alerta, quando está tudo
  // zerado e o objetivo é justamente chamar para importar).
  const estiloBotao =
    variante === "destaque"
      ? "text-sm font-semibold text-white bg-emerald-700 hover:bg-emerald-600 px-4 py-2.5 rounded-lg inline-flex items-center gap-2 shadow-lg shadow-emerald-900/30"
      : variante === "claro"
        ? "text-sm font-semibold text-emerald-100 bg-emerald-800/80 hover:bg-emerald-700 border border-emerald-500/40 px-4 py-2.5 rounded-lg inline-flex items-center gap-2"
        : "text-xs text-slate-300 hover:text-white border border-white/10 px-3 py-2 rounded-md inline-flex items-center gap-1.5";

  const iconeCls = compacto ? "h-4 w-4" : "h-4 w-4";

  return (
    <>
      <button onClick={() => setOpen(true)} className={estiloBotao} title="Buscar e inserir a movimentação do AppBarber">
        <Icone className={iconeCls} /> {rotulo}
      </button>
      <input
        ref={inputRef}
        type="file"
        accept=".csv,text/csv"
        onChange={aoEscolherArquivo}
        className="hidden"
      />

      <Dialog open={open} onOpenChange={(o) => !o && fechar()}>
        <DialogContent className="bg-[#111113] border-white/10 text-white max-w-2xl max-h-[88vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Importar agendamentos do AppBarber</DialogTitle>
          </DialogHeader>

          <p className="text-xs text-slate-400 -mt-2">
            Exporte no AppBarber em <strong className="text-slate-200">Relatórios → Agendamentos</strong>. Você pode
            enviar o <strong className="text-slate-200">arquivo</strong> (CSV) ou <strong className="text-slate-200">colar
            a tabela</strong> copiada da tela/PDF. Você confere o que será importado antes de gravar.
          </p>

          {erro && (
            <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-300 flex items-start gap-2">
              <XCircle className="h-4 w-4 shrink-0 mt-0.5" /> {erro}
            </div>
          )}

          {!analise && !resultado && (
            <div className="space-y-3">
              <div className="flex items-center gap-1 rounded-lg border border-white/10 bg-[#0E0E10] p-1 w-fit">
                {[
                  { key: "arquivo", label: "Arquivo", Icon: FileUp },
                  { key: "colar", label: "Colar texto", Icon: ClipboardPaste },
                ].map((t) => (
                  <button
                    key={t.key}
                    onClick={() => { setModo(t.key); setErro(null); }}
                    className={`px-3 py-1.5 text-xs rounded-md inline-flex items-center gap-1.5 transition-colors ${
                      modo === t.key ? "bg-[#A81C1C] text-white" : "text-slate-300 hover:text-white hover:bg-white/5"
                    }`}
                  >
                    <t.Icon className="h-3.5 w-3.5" /> {t.label}
                  </button>
                ))}
              </div>

              {modo === "arquivo" ? (
                <button
                  onClick={abrirSeletor}
                  className="w-full rounded-lg border border-dashed border-white/20 bg-[#0E0E10] hover:border-[#A81C1C] px-4 py-8 text-sm text-slate-300 inline-flex flex-col items-center gap-2"
                >
                  <Upload className="h-6 w-6 text-[#E05252]" />
                  Escolher o arquivo (CSV) do AppBarber
                  {nomeArquivo && <span className="text-[11px] text-slate-500">{nomeArquivo}</span>}
                </button>
              ) : (
                <div className="space-y-2">
                  <textarea
                    value={textoColado}
                    onChange={(e) => setTextoColado(e.target.value)}
                    rows={7}
                    placeholder={"Cole aqui a tabela do AppBarber (com a linha de títulos).\nEx.:\nCliente\tTelefone\tServiço\tProfissional\tStatus\tValor\tData"}
                    className="w-full rounded-lg border border-white/10 bg-[#0A0A0B] px-3 py-2 text-xs text-white font-mono focus:border-[#A81C1C] focus:outline-none resize-y"
                  />
                  <button
                    onClick={() => analisarTexto(textoColado)}
                    disabled={!textoColado.trim()}
                    className="text-xs text-white bg-[#A81C1C] hover:bg-[#C22424] px-4 py-2 rounded-md inline-flex items-center gap-1.5 disabled:opacity-50"
                  >
                    <ClipboardPaste className="h-4 w-4" /> Analisar texto colado
                  </button>
                </div>
              )}
            </div>
          )}

          {analise && !resultado && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <KPI label="Linhas no CSV" value={r.total} />
                <KPI label="A importar" value={r.aImportar} accent="text-emerald-300" />
                <KPI label="Duplicados" value={r.duplicados} accent="text-amber-300" />
                <KPI label="Ignorados" value={r.ignorados} accent="text-rose-300" />
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <KPI label="Compareceu" value={r.compareceu} accent="text-emerald-300" />
                <KPI label="Faltou" value={r.faltou} accent="text-rose-300" />
                <KPI label="Cancelado" value={r.cancelado} accent="text-rose-300" />
                <KPI label="Rendimento" value={formatBRL(r.rendimento)} />
              </div>

              {r.semTelefone > 0 && (
                <p className="text-[11px] text-amber-400/80">
                  {r.semTelefone} linha(s) sem telefone. Elas serão importadas normalmente — só não
                  aparecerão na aba Clientes (remarketing), que depende do contato.
                </p>
              )}

              <div>
                <p className="text-xs font-semibold text-slate-300 mb-1.5">Prévia (primeiros 5)</p>
                <div className="overflow-x-auto rounded-lg border border-white/10">
                  <table className="w-full text-xs">
                    <thead className="bg-[#0E0E10] text-slate-400">
                      <tr className="text-left">
                        <th className="px-2 py-2 font-medium">Data</th>
                        <th className="px-2 py-2 font-medium">Cliente</th>
                        <th className="px-2 py-2 font-medium">Telefone</th>
                        <th className="px-2 py-2 font-medium">Serviço</th>
                        <th className="px-2 py-2 font-medium">Barbeiro</th>
                        <th className="px-2 py-2 font-medium">Situação</th>
                        <th className="px-2 py-2 font-medium">Valor</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {analise.validos.slice(0, 5).map((d, i) => (
                        <tr key={i}>
                          <td className="px-2 py-2 text-slate-300 whitespace-nowrap">{d.data_agendamento || "—"}</td>
                          <td className="px-2 py-2 text-white">{d.nome}</td>
                          <td className="px-2 py-2 text-slate-300">{d.whatsapp}</td>
                          <td className="px-2 py-2 text-slate-300">{d.servico_interesse || "—"}</td>
                          <td className="px-2 py-2 text-slate-300">{d.barbeiro_preferido || "—"}</td>
                          <td className="px-2 py-2 text-slate-300">{d.situacao_atendimento || "—"}</td>
                          <td className="px-2 py-2 text-slate-300">
                            {d.preco_servico != null ? formatBRL(d.preco_servico) : "—"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {analise.ignorados.length > 0 && (
                <p className="text-[11px] text-rose-300">
                  {analise.ignorados.length} linha(s) ignorada(s): {analise.ignorados[0].motivo}
                </p>
              )}

              <div className="flex items-center justify-end gap-2 pt-1">
                <button
                  onClick={() => { setAnalise(null); setErro(null); }}
                  className="text-xs text-slate-300 hover:text-white border border-white/10 px-3 py-2 rounded-md"
                >
                  Voltar
                </button>
                <button
                  onClick={importar}
                  disabled={gravando || !analise.validos.length}
                  className="text-xs text-white bg-[#A81C1C] hover:bg-[#C22424] px-4 py-2 rounded-md inline-flex items-center gap-1.5 disabled:opacity-50"
                >
                  {gravando ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                  {gravando ? `Importando ${progresso.feito}/${progresso.total}…` : `Importar ${r.aImportar} registro(s)`}
                </button>
              </div>
            </div>
          )}

          {resultado && (
            <div className="space-y-3">
              <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-3 text-sm text-emerald-300 flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5" /> {resultado.ok} registro(s) importado(s) com sucesso.
              </div>
              {resultado.falhas.length > 0 && (
                <div className="rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-xs text-rose-300">
                  {resultado.falhas.length} falha(s). Primeira: {resultado.falhas[0].erro}
                </div>
              )}
              <div className="flex justify-end">
                <button onClick={fechar} className="text-xs text-white bg-[#A81C1C] hover:bg-[#C22424] px-4 py-2 rounded-md">
                  Fechar
                </button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}

import { useState, useEffect, useRef } from "react";
import { MessageCircle, X, Send, Calendar } from "lucide-react";
import { base44 } from "@/api/base44Client";
import ReactMarkdown from "react-markdown";
import {
  getCampaignContext,
  origemFromContext,
  trackCta,
  trackChatOpen,
  trackChatInteraction,
} from "@/lib/analytics";
import { spNowLabel } from "@/lib/timezone";

const AGENT_NAME = "consultor_neyzito";
const APPBARBER_URL = "https://sites.appbarber.com.br/barbeariadoneyz-sqbc";

// Constrói o link do AppBarber com parâmetros de rastreamento (utm_source + barbeiro)
// para manter a rastreabilidade da origem do cliente, conforme instrução do agente.
function buildAppBarberUrl(barber) {
  const ctx = getCampaignContext();
  const params = new URLSearchParams();
  if (ctx.utm_source) params.set("utm_source", ctx.utm_source);
  if (barber) params.set("barber", barber);
  const qs = params.toString();
  return qs ? `${APPBARBER_URL}?${qs}` : APPBARBER_URL;
}

// Bloco de contexto de aquisição injetado em cada mensagem enviada ao agente.
// Não é exibido ao usuário. Garante que o agente saiba de onde veio o visitante
// (Google Meu Negócio, redes, plataformas de IA, acesso direto) mesmo sem UTM, e
// repasse isso à ferramenta criarLead — assim o lead nasce com a origem correta.
function contextoAquisicao() {
  const ctx = getCampaignContext();
  const origem = origemFromContext(ctx);
  const linhas = [
    "[Contexto de aquisição — use ao chamar criarLead, não mencione ao cliente]",
    `origem: ${origem}`,
    `utm_source: ${ctx.utm_source || "(vazio)"}`,
    `utm_medium: ${ctx.utm_medium || "(vazio)"}`,
    `utm_campaign: ${ctx.utm_campaign || "(vazio)"}`,
    `referrer: ${ctx.referrer || "(vazio)"}`,
    `pagina_entrada: ${ctx.pagina_entrada || "/"}`,
    `sessao_id: ${ctx.sessao_id || ""}`,
    "consentimento_marketing: envie true APENAS se o cliente concordou explicitamente em receber promoções; caso contrário false.",
  ];
  return linhas.join("\n");
}

// Diferenciais da Barbearia do Neyzito — injetados para o agente citar
// naturalmente quando perguntarem "por que escolher", vantagens ou comparações.
// Não exibir este bloco ao usuário.
function contextoDiferenciais() {
  const linhas = [
    "[Diferenciais da Barbearia do Neyzito — cite quando perguntarem por vantagens ou por que escolher]",
    "- Estacionamento grátis na porta (2 vagas)",
    "- Ambiente climatizado",
    "- TV",
    "- Música ambiente",
    "- Bar com bebidas",
    "- Wi-Fi grátis",
    "- Decoração diferenciada e aconchegante",
    "- Atendimento personalizado",
    "- Qualidade nos detalhes",
    "- Localização: Rua Clodomiro Amazonas, 1361 — Vila Nova Conceição, São Paulo/SP",
    "- Agendamento online pelo AppBarber",
    "- Mais de 9 anos de tradição (desde 2017)",
    "Sempre dê destaque ao estacionamento grátis na porta quando fizer sentido.",
  ];
  return linhas.join("\n");
}

// Renderizadores customizados do Markdown para uma leitura premium no celular.
const mdComponents = {
  h1: ({ children }) => <p className="mb-1 font-heading text-[15px] tracking-wide text-white">{children}</p>,
  h2: ({ children }) => <p className="mb-1 font-heading text-[15px] tracking-wide text-white">{children}</p>,
  h3: ({ children }) => <p className="mb-1 font-semibold text-[14px] text-white">{children}</p>,
  p: ({ children }) => <p className="mb-1.5 last:mb-0 leading-relaxed">{children}</p>,
  ul: ({ children }) => <ul className="mb-1.5 last:mb-0 flex flex-col gap-1">{children}</ul>,
  ol: ({ children }) => <ol className="mb-1.5 last:mb-0 flex flex-col gap-1 list-decimal ml-4 marker:text-[#E05252]">{children}</ol>,
  li: ({ children, ...props }) => {
    const ordered = props?.node?.properties?.className?.includes?.("ordered");
    return (
      <li className={`relative pl-4 leading-relaxed ${ordered ? "" : "list-none"}`}>
        {!ordered && <span className="absolute left-0 top-[0.55em] h-1.5 w-1.5 rounded-full bg-[#E05252]" />}
        {children}
      </li>
    );
  },
  a: ({ href, children }) => (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="text-[#E05252] underline underline-offset-2 hover:text-[#ff7a7a] break-words"
    >
      {children}
    </a>
  ),
  strong: ({ children }) => <strong className="font-semibold text-white">{children}</strong>,
  em: ({ children }) => <em className="text-slate-200">{children}</em>,
  blockquote: ({ children }) => (
    <blockquote className="my-1.5 border-l-2 border-[#A81C1C] pl-2.5 text-slate-300 italic">{children}</blockquote>
  ),
  hr: () => <hr className="my-2 border-white/10" />,
  code: ({ children }) => (
    <code className="rounded bg-white/10 px-1 py-0.5 text-[13px] text-slate-100">{children}</code>
  ),
  // Tabelas viram cartões empilhados (legível no celular, sem rolagem horizontal)
  table: ({ children }) => <div className="my-2 flex flex-col gap-2">{children}</div>,
  thead: ({ children }) => <div className="sr-only">{children}</div>,
  tbody: ({ children }) => <div className="flex flex-col gap-2">{children}</div>,
  tr: ({ children }) => (
    <div className="rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2 flex flex-col gap-0.5">
      {children}
    </div>
  ),
  th: ({ children }) => (
    <div className="text-[11px] font-semibold uppercase tracking-wide text-[#E05252]">{children}</div>
  ),
  td: ({ children }) => <div className="text-[13.5px] leading-snug text-slate-100">{children}</div>,
};

export default function ConsultorChat() {
  const [open, setOpen] = useState(false);
  const [conversation, setConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [starting, setStarting] = useState(false);
  const scrollRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, loading]);

  useEffect(() => {
    if (!open || conversation || starting) return;
    let unsub = () => {};
    setStarting(true);
    (async () => {
      try {
        const conv = await base44.agents.createConversation({
          agent_name: AGENT_NAME,
          metadata: { name: "Consultor Neyzito", campaign: getCampaignContext() },
        });
        setConversation(conv);
        const cleanedInit = (conv.messages || [])
          .map((m) => {
            const txt = typeof m.content === "string" ? m.content : JSON.stringify(m.content || "");
            if (!txt) return m;
            if (txt.toLowerCase().includes("diferenciais da barbearia do neyzito")) {
              if (m.role === "user") {
                const lines = txt.split(/\r?\n/);
                for (let i = lines.length - 1; i >= 0; i--) {
                  const line = lines[i].trim();
                  if (!line) continue;
                  if (line.startsWith("-")) continue;
                  if (line.toLowerCase().includes("diferenciais")) continue;
                  if (line.toLowerCase().includes("estacionamento")) continue;
                  if (line.toLowerCase().includes("ambiente climatizado")) continue;
                  if (line.toLowerCase().includes("vila nova conceição")) continue;
                  if (line.toLowerCase().includes("appbarber")) continue;
                  if (line.toLowerCase().includes("desde 2017")) continue;
                  if (line.toLowerCase().includes("sempre dê destaque")) continue;
                  if (line.toLowerCase().includes("qualidade nos detalhes")) continue;
                  if (line.toLowerCase().includes("música ambiente")) continue;
                  if (line.toLowerCase().includes("bar com bebidas")) continue;
                  if (line.toLowerCase().includes("wi-fi")) continue;
                  if (line.toLowerCase().includes("decoração diferenciada")) continue;
                  if (line.toLowerCase().includes("atendimento personalizado")) continue;
                  if (line.toLowerCase().includes("climatizado")) continue;
                  if (line.toLowerCase().includes("tradição")) continue;
                  return { ...m, content: line };
                }
                return null;
              }
              return null;
            }
            return m;
          })
          .filter(Boolean);
        setMessages(cleanedInit);
        unsub = base44.agents.subscribeToConversation(conv.id, (data) => {
          const cleaned = (data.messages || [])
            .map((m) => {
              const txt = typeof m.content === "string" ? m.content : JSON.stringify(m.content || "");
              if (!txt) return m;
              if (txt.toLowerCase().includes("diferenciais da barbearia do neyzito")) {
                if (m.role === "user") {
                  const lines = txt.split(/\r?\n/);
                  for (let i = lines.length - 1; i >= 0; i--) {
                    const line = lines[i].trim();
                    if (!line) continue;
                    if (line.startsWith("-")) continue;
                    if (line.toLowerCase().includes("diferenciais")) continue;
                    if (line.toLowerCase().includes("estacionamento")) continue;
                    if (line.toLowerCase().includes("ambiente climatizado")) continue;
                    if (line.toLowerCase().includes("vila nova conceição")) continue;
                    if (line.toLowerCase().includes("appbarber")) continue;
                    if (line.toLowerCase().includes("desde 2017")) continue;
                    if (line.toLowerCase().includes("sempre dê destaque")) continue;
                    if (line.toLowerCase().includes("qualidade nos detalhes")) continue;
                    if (line.toLowerCase().includes("música ambiente")) continue;
                    if (line.toLowerCase().includes("bar com bebidas")) continue;
                    if (line.toLowerCase().includes("wi-fi")) continue;
                    if (line.toLowerCase().includes("decoração diferenciada")) continue;
                    if (line.toLowerCase().includes("atendimento personalizado")) continue;
                    if (line.toLowerCase().includes("climatizado")) continue;
                    if (line.toLowerCase().includes("tradição")) continue;
                    return { ...m, content: line };
                  }
                  return null;
                }
                return null;
              }
              return m;
            })
            .filter(Boolean);
          setMessages(cleaned);
          setLoading(false);
        });
      } catch (e) {
        console.error("Erro ao iniciar conversa:", e);
      } finally {
        setStarting(false);
      }
    })();
    return () => unsub();
  }, [open, conversation, starting]);

  const send = async () => {
    const text = input.trim();
    if (!text || !conversation || loading) return;
    setInput("");
    trackChatInteraction();
    setLoading(true);
    setMessages((prev) => [...prev, { role: "user", content: text }]);
    try {
      // Injeta a hora atual de São Paulo no contexto enviado ao agente (não
      // exibido ao usuário). O relógio do servidor do agente é UTC; sem isso ele
      // responde com horário incorreto em perguntas como "está aberto agora?".
      const agora = spNowLabel();
      const contexto = `[Referência temporal — fuso America/Sao_Paulo] Agora: ${agora}. Use SEMPRE este horário local de São Paulo (não o relógio do servidor, em UTC) para responder sobre expediente, dia da semana ou se está aberto agora.`;
      // Repassa também o contexto de aquisição (origem/UTM/referrer/sessão) para
      // o agente enviar à criarLead e o lead nascer com a origem correta.
      const aquisicao = contextoAquisicao();
      const diferenciais = contextoDiferenciais();
      await base44.agents.addMessage(conversation, {
        role: "user",
        content: `${contexto}\n\n${aquisicao}\n\n${diferenciais}\n\n${text}`,
      });
    } catch (e) {
      console.error(e);
      setLoading(false);
    }
  };

  return (
    <>
      {/* Launcher */}
      <button
        onClick={() => {
          const willOpen = !open;
          setOpen(willOpen);
          if (willOpen) trackChatOpen();
        }}
        aria-label={open ? "Fechar chat" : "Falar com o Consultor Neyzito"}
        className="fixed z-[60] bottom-24 right-5 md:bottom-24 md:right-6 h-14 w-14 flex items-center justify-center rounded-full bg-[#A81C1C] text-white shadow-lg shadow-black/50 hover:bg-[#C22424] transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#E05252]/60"
      >
        {open ? <X className="h-6 w-6" /> : <MessageCircle className="h-6 w-6" />}
      </button>

      {open && (
        <div className="fixed z-[60] inset-x-0 bottom-0 top-0 flex flex-col bg-[#0E0E10] sm:inset-auto sm:bottom-24 sm:right-6 sm:w-[400px] sm:h-[640px] sm:max-h-[85vh] sm:rounded-2xl sm:border sm:border-white/10 sm:shadow-2xl sm:shadow-black/60 overflow-hidden">
          {/* Header */}
          <div className="flex items-center gap-3 px-4 py-3.5 bg-gradient-to-r from-[#A81C1C] to-[#7a1414] shrink-0">
            <div className="h-10 w-10 rounded-full bg-white/15 flex items-center justify-center shrink-0">
              <MessageCircle className="h-5 w-5 text-white" />
            </div>
            <div className="leading-tight flex-1 min-w-0">
              <p className="font-heading text-base tracking-wide text-white truncate">CONSULTOR NEYZITO</p>
              <p className="text-[11px] text-white/70 flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" /> Online agora · te ajudo a agendar
              </p>
            </div>
            <button
              onClick={() => setOpen(false)}
              aria-label="Fechar chat"
              className="h-9 w-9 flex items-center justify-center rounded-full text-white/80 hover:text-white hover:bg-white/10 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-white/60"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Messages */}
          <div
            ref={scrollRef}
            className="flex-1 overflow-y-auto overscroll-contain px-3 py-4 space-y-3 bg-[#0E0E10]"
          >
            {messages.length === 0 && !starting && (
              <div className="flex justify-start">
                <div className="max-w-[88%] rounded-2xl rounded-bl-sm bg-[#1A1A1D] border border-white/5 text-slate-100 px-3.5 py-2.5 text-[15px] leading-relaxed">
                  Olá! Sou o Consultor Neyzito. Quer agendar seu horário? Me diga o serviço que procura.
                </div>
              </div>
            )}
            {starting && (
              <div className="flex justify-start">
                <div className="rounded-2xl rounded-bl-sm bg-[#1A1A1D] border border-white/5 px-3.5 py-2.5 text-[15px] text-slate-400">
                  Iniciando conversa…
                </div>
              </div>
            )}

            {messages.map((m, i) => {
              const raw = m.content || "";
              const rawStr = typeof raw === "string" ? raw : JSON.stringify(raw);
              
              // Bloqueia qualquer mensagem com o bloco de diferenciais
              if (rawStr.toLowerCase().includes("diferenciais da barbearia do neyzito")) {
                if (m.role === "user") {
                  const lines = rawStr.split(/\r?\n/);
                  for (let j = lines.length - 1; j >= 0; j--) {
                    const line = lines[j].trim();
                    if (!line) continue;
                    if (line.startsWith("-")) continue;
                    if (line.toLowerCase().includes("diferenciais")) continue;
                    if (line.toLowerCase().includes("estacionamento")) continue;
                    if (line.toLowerCase().includes("ambiente climatizado")) continue;
                    if (line.toLowerCase().includes("vila nova conceição")) continue;
                    if (line.toLowerCase().includes("appbarber")) continue;
                    if (line.toLowerCase().includes("desde 2017")) continue;
                    if (line.toLowerCase().includes("sempre dê destaque")) continue;
                    if (line.toLowerCase().includes("qualidade nos detalhes")) continue;
                    if (line.toLowerCase().includes("música ambiente")) continue;
                    if (line.toLowerCase().includes("bar com bebidas")) continue;
                    if (line.toLowerCase().includes("wi-fi")) continue;
                    if (line.toLowerCase().includes("decoração diferenciada")) continue;
                    if (line.toLowerCase().includes("atendimento personalizado")) continue;
                    if (line.toLowerCase().includes("climatizado")) continue;
                    if (line.toLowerCase().includes("tradição")) continue;
                    // Usa apenas a linha da pergunta
                    m = { ...m, content: line };
                    break;
                  }
                  if (typeof m.content === "string" && m.content.toLowerCase().includes("diferenciais da barbearia do neyzito")) {
                    return null;
                  }
                } else {
                  return null;
                }
              }
              
              const isUser = m.role === "user";
              const bookingIntent =
                /botão abaixo|clique no botão|clique abaixo|é só clicar|escolher (seu |o )?horário|vamos marcar|quer agendar/i.test(
                  raw
                );
              const barberMatch = !isUser ? raw.match(/\[\[AGENDAR:barber=([^\]]+)\]\]/) : null;
              const barber = barberMatch ? barberMatch[1].trim() : "";
              const hasButton =
                !isUser &&
                (raw.includes("[[AGENDAR") ||
                  raw.includes("sites.appbarber.com.br") ||
                  bookingIntent);
              const cleaned = isUser
                ? raw
                    .replace(/^\[Referência temporal[^\n]*\n\n/, "")
                    .replace(/^\[Contexto de aquisição[^\n]*\n(?:[^\n]*\n)*?\n/, "")
                : raw
                    .replace(/\[\[AGENDAR(?::barber=[^\]]+)?\]\]/g, "")
                    .replace(/https:\/\/sites\.appbarber\.com\.br\/barbeariadoneyz-sqbc/g, "")
                    .replace(/\s+$/g, "");
              const appbarberUrl = buildAppBarberUrl(barber);
              return (
                <div
                  key={i}
                  className={isUser ? "flex flex-col items-end gap-2" : "flex flex-col items-start gap-2"}
                >
                  <div
                    className={
                      isUser
                        ? "max-w-[85%] rounded-2xl rounded-br-sm bg-[#A81C1C] text-white px-3.5 py-2.5 text-[15px] leading-relaxed break-words [overflow-wrap:anywhere] whitespace-pre-wrap"
                        : "max-w-[88%] sm:max-w-[85%] rounded-2xl rounded-bl-sm bg-[#1A1A1D] border border-white/5 text-slate-100 px-3.5 py-2.5 text-[15px] leading-relaxed break-words [overflow-wrap:anywhere]"
                    }
                  >
                    {isUser ? (
                      cleaned
                    ) : (
                      <div className="chat-md">
                        <ReactMarkdown components={mdComponents}>{cleaned}</ReactMarkdown>
                      </div>
                    )}
                  </div>
                  {hasButton && (
                    <a
                      href={appbarberUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={() => trackCta("appbarber", "chat")}
                      className="w-full sm:w-auto max-w-[88%] sm:max-w-[85%] rounded-xl bg-[#A81C1C] hover:bg-[#C22424] text-white font-semibold text-sm px-4 py-3.5 transition-colors flex items-center justify-center gap-2 shadow-lg shadow-black/30 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#E05252]/70"
                    >
                      <Calendar className="h-4 w-4" /> AGENDAR PELO APPBARBER
                    </a>
                  )}
                </div>
              );
            })}

            {loading && (
              <div className="flex justify-start">
                <div className="rounded-2xl rounded-bl-sm bg-[#1A1A1D] border border-white/5 px-4 py-3 text-slate-400">
                  <span className="inline-flex gap-1">
                    <span className="h-2 w-2 rounded-full bg-slate-500 animate-bounce [animation-delay:-0.3s]" />
                    <span className="h-2 w-2 rounded-full bg-slate-500 animate-bounce [animation-delay:-0.15s]" />
                    <span className="h-2 w-2 rounded-full bg-slate-500 animate-bounce" />
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Input */}
          <div className="shrink-0 border-t border-white/10 bg-[#0A0A0B] p-3">
            <div className="flex items-end gap-2">
              <input
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") send();
                }}
                placeholder="Digite sua mensagem..."
                enterKeyHint="send"
                autoComplete="off"
                aria-label="Mensagem"
                className="flex-1 min-w-0 bg-[#1A1A1D] text-white text-[15px] rounded-2xl px-4 py-3 outline-none placeholder:text-slate-500 border border-white/10 focus:border-[#A81C1C] focus-visible:ring-2 focus-visible:ring-[#E05252]/40"
              />
              <button
                onClick={send}
                disabled={!input.trim() || loading || !conversation}
                aria-label="Enviar mensagem"
                className="h-11 w-11 shrink-0 flex items-center justify-center rounded-2xl bg-[#A81C1C] text-white hover:bg-[#C22424] disabled:opacity-40 disabled:cursor-not-allowed transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#E05252]/60"
              >
                <Send className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
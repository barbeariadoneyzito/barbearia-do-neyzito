import { useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { criarLeituraPublicaCatalogoBase44 } from "@/catalogo";
import AssistenteComercial from "@/components/comercial/AssistenteComercial";
import { abrirAgendarModal } from "@/lib/agendar";
import { trackCta } from "@/lib/analytics";
import { SITE } from "@/lib/siteConfig";
import { criarAdaptadorLandingAssistenteComercial } from "./integracaoAssistenteComercial";
import { assistenteComercialAtivo } from "./featureFlag";

/**
 * Ações explícitas da landing. O adaptador apenas informa a ação; nada é aberto
 * sem o clique do visitante.
 *
 * No fluxo do assistente, agendamento abre o AppBarber oficial diretamente.
 * Modal só direciona ao AppBarber e não cria reserva.
 * WhatsApp usa a configuração do site e não é aberto automaticamente.
 */
export function executarAcaoAssistenteComercial(acao) {
  if (acao?.tipo === "abrir_agendamento") {
    trackCta("appbarber", "assistente-comercial");
    if (typeof window !== "undefined") {
      window.open(acao.url ?? "https://sites.appbarber.com.br/barbeariadoneyz-sqbc", "_blank", "noopener,noreferrer");
    }
    return;
  }

  if (acao?.tipo === "abrir_whatsapp") {
    trackCta("whatsapp", "assistente-comercial");
    if (typeof window !== "undefined") {
      window.open(SITE.whatsappUrl, "_blank", "noopener,noreferrer");
    }
  }
}

function invocarCatalogoPublico(nome, payload) {
  return base44.functions.invoke(nome, payload);
}

/**
 * Monta o assistente com leitura pública do catálogo.
 *
 * As entidades administrativas não são lidas aqui. O catálogo chega pela função
 * de backend `catalogoPublico`, que consulta com service role no servidor,
 * mantém o RLS admin-only e devolve somente os campos públicos. A lista de
 * instruções fica vazia por padrão; uma fonte autorizada pode ser injetada em
 * testes, sem expor Instrucoes/HistoricoInstrucoes ao navegador.
 *
 * A flag deve permanecer desligada até a função pública ser publicada e o smoke
 * test de homologação ser autorizado.
 *
 * @param {{
 *   invocar?: (nome: string, payload?: Record<string, unknown>) => Promise<unknown>,
 *   funcao?: string,
 *   instrucoes?: any[],
 *   carregarInstrucoes?: ((args: any) => Promise<any[]>) | null,
 *   agora?: () => Date,
 * }} [opcoes]
 */
export function criarAdaptadorLandingBase44(opcoes = {}) {
  const {
    invocar = invocarCatalogoPublico,
    funcao = "catalogoPublico",
    instrucoes = [],
    carregarInstrucoes = null,
    agora = () => new Date(),
    contextoAquisicao = null,
  } = opcoes;

  const leituraPublica = criarLeituraPublicaCatalogoBase44({ invocar, funcao });

  return criarAdaptadorLandingAssistenteComercial({
    ...leituraPublica,
    instrucoes,
    carregarInstrucoes,
    agora,
    contextoAquisicao,
    agente: base44.agents,
  });
}

export default function AssistenteComercialLanding({
  habilitado = undefined,
  criarAdaptador = criarAdaptadorLandingBase44,
  onAction = executarAcaoAssistenteComercial,
  fallback = null,
}) {
  const ativo = habilitado ?? assistenteComercialAtivo();

  const { adaptador, erro } = useMemo(() => {
    if (!ativo) return { adaptador: null, erro: false };

    try {
      return { adaptador: criarAdaptador(), erro: false };
    } catch {
      return { adaptador: null, erro: true };
    }
  }, [ativo, criarAdaptador]);

  if (!ativo) return null;
  if (erro || !adaptador) return fallback;

  return <AssistenteComercial adaptador={adaptador} onAction={onAction} />;
}
